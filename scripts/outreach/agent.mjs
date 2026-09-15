#!/usr/bin/env node
/**
 * aggit 冷启动外联 agent
 *
 * 用法：
 *   node scripts/outreach/agent.mjs scan [--pages 2] [--min 50] [--max 500]
 *     → 扫描 GitHub 50-500 星的 Agent 项目，挖掘作者邮箱，输出候选清单（不发信）
 *   node scripts/outreach/agent.mjs send --file <candidates-xxx.json> --ids 1,3
 *     → 对选中候选执行：收录上架(Showcase+待认领) → 发送模板邮件 → 记账
 *   node scripts/outreach/agent.mjs optout --email someone@x.com
 *     → 把某人加入退订名单（永不发送）
 *
 * 纪律（写死在代码里）：
 * - noreply / bot / 明显无效邮箱一律跳过
 * - 已联系（ledger）与退订名单（optout）永不重发
 * - send 模式单批最多 10 人
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = path.join(ROOT, "scripts/outreach/data");
const LEDGER_FILE = path.join(DATA_DIR, "contacted.json");
const OPTOUT_FILE = path.join(DATA_DIR, "optout.json");

// ---------- 工具 ----------

function loadEnv() {
  const env = {};
  const content = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function gh(endpoint) {
  const out = execSync(`gh api "${endpoint}"`, {
    maxBuffer: 32 * 1024 * 1024,
  }).toString();
  return JSON.parse(out);
}

function ghRaw(endpoint, accept) {
  return execSync(`gh api "${endpoint}" -H "Accept: ${accept}"`, {
    maxBuffer: 32 * 1024 * 1024,
  }).toString();
}

const BAD_EMAIL =
  /noreply|no-reply|donotreply|bot@|@bots\.|example\.|localhost|@users\.noreply/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validEmail(email) {
  return !!email && EMAIL_RE.test(email) && !BAD_EMAIL.test(email);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

// ---------- 邮箱挖掘 ----------

function findAuthorEmail(repo) {
  // ① 作者主页公开邮箱
  try {
    const user = gh(`users/${repo.owner.login}`);
    if (validEmail(user.email)) {
      return { email: user.email.toLowerCase(), source: "profile" };
    }
  } catch {}
  // ② 最近 commit 的 author email
  try {
    const commits = gh(`repos/${repo.full_name}/commits?per_page=5`);
    for (const c of commits) {
      const email = c.commit?.author?.email;
      if (validEmail(email)) {
        return { email: email.toLowerCase(), source: "commit" };
      }
    }
  } catch {}
  return null;
}

// ---------- scan ----------

const QUERIES = [
  "topic:ai-agent",
  "agentic in:description",
  "AI agent in:name,description",
];

async function scan(args) {
  const pages = Number(args.pages ?? 2);
  const min = Number(args.min ?? 50);
  const max = Number(args.max ?? 500);
  const ledger = readJson(LEDGER_FILE, []);
  const optout = new Set(readJson(OPTOUT_FILE, []).map((e) => e.toLowerCase()));
  const contactedEmails = new Set(ledger.map((l) => l.email));
  const contactedRepos = new Set(ledger.map((l) => l.repo));
  const seen = new Map();

  for (const q of QUERIES) {
    for (let page = 1; page <= pages; page++) {
      console.log(`搜索: ${q} stars:${min}..${max} 第 ${page} 页`);
      const res = gh(
        `search/repositories?q=${encodeURIComponent(`${q} stars:${min}..${max}`)}&sort=updated&order=desc&per_page=30&page=${page}`
      );
      for (const repo of res.items ?? []) {
        if (seen.has(repo.full_name)) continue;
        seen.set(repo.full_name, repo);
      }
    }
  }
  console.log(`去重后候选仓库 ${seen.size} 个，开始挖掘邮箱…\n`);

  const now = Date.now();
  const candidates = [];
  let idx = 1;
  for (const repo of seen.values()) {
    // 过滤：归档 / 一年未更新 / 无简介 / 已联系过
    if (repo.archived) continue;
    if (now - new Date(repo.pushed_at).getTime() > 365 * 86_400_000) continue;
    if (!repo.description) continue;
    if (contactedRepos.has(repo.full_name)) continue;

    const found = findAuthorEmail(repo);
    if (!found || contactedEmails.has(found.email) || optout.has(found.email)) {
      continue;
    }

    candidates.push({
      id: idx++,
      repo: repo.full_name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language ?? "?",
      description: repo.description,
      author: repo.owner.login,
      email: found.email,
      emailSource: found.source,
    });
    if (candidates.length >= 30) break; // 单批上限
  }

  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(DATA_DIR, `candidates-${date}.json`);
  writeJson(file, candidates);

  console.log("候选清单（dry-run，未发送任何邮件）:");
  console.log("─".repeat(80));
  for (const c of candidates) {
    console.log(
      `#${c.id}  ${c.repo}  ★${c.stars}  [${c.language}]`
    );
    console.log(`    ${c.description?.slice(0, 90)}`);
    console.log(`    📧 ${c.email} (${c.emailSource})  👤 @${c.author}`);
  }
  console.log("─".repeat(80));
  console.log(
    `共 ${candidates.length} 位候选 → ${file}\n确认后用: node scripts/outreach/agent.mjs send --file ${path.basename(file)} --ids 1,2,3`
  );
}

// ---------- send ----------

const ENRICH_PROMPT = `你是 OpenAggit 平台的内容编辑。对每个给定的 GitHub 项目，输出上架元数据。要求：
- taglineEn：一句话英文简介，≤120 字符，客观陈述能力，禁止营销词
- scenario：从 [代码生成, 数据分析, 客服与对话, 内容创作, 办公自动化, 金融量化, 检索增强 RAG, 多智能体协作, 其他] 中选最贴近的一个（原样输出中文值）
- kind：AGENT（完整可用 Agent）/ COMPONENT（工具·Skill·Harness·框架）/ BENCHMARK（评测基准）
严格输出 JSON：{"items":[{"repo":"owner/name","taglineEn":"...","scenario":"...","kind":"..."}]}，不要输出其他内容。`;

async function llmEnrich(targets, env) {
  try {
    const key = env.DASHSCOPE_API_KEY;
    if (!key) return new Map();
    const base =
      env.LLM_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
    const model = env.LLM_MODEL ?? "qwen-plus";
    const brief = targets.map((t) => ({
      repo: t.repo,
      description: t.description,
      language: t.language,
    }));
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: ENRICH_PROMPT },
          { role: "user", content: JSON.stringify(brief) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });
    if (!res.ok) return new Map();
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return new Map((parsed.items ?? []).map((i) => [i.repo, i]));
  } catch {
    return new Map(); // LLM 不可用时静默降级为原始简介
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(args) {
  if (!args.file || !args.ids) {
    console.error("用法: send --file <candidates.json> --ids 1,2,3");
    process.exit(1);
  }
  const file = path.join(DATA_DIR, args.file);
  const candidates = readJson(file, []);
  const ids = String(args.ids)
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(Boolean);
  const targets = candidates.filter((c) => ids.includes(c.id));
  if (targets.length === 0) {
    console.error("没有匹配的候选 id");
    process.exit(1);
  }
  if (targets.length > 10) {
    console.error("单批最多 10 人（新域名声誉保护纪律），请分批");
    process.exit(1);
  }

  const env = { ...loadEnv(), ...process.env };
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  const ledger = readJson(LEDGER_FILE, []);
  const optout = new Set(readJson(OPTOUT_FILE, []).map((e) => e.toLowerCase()));

  // LLM 批量润色：英文简介 + 场景归类 + 类型判定（失败自动降级原简介）
  const enriched = await llmEnrich(targets, env);

  // 演练模式：全流程走一遍但不写库、不发信、不记账
  const dryRun = env.OUTREACH_DRYRUN === "1";

  const report = { sent: [], skipped: [], failed: [] };

  for (const t of targets) {
    if (optout.has(t.email)) {
      report.skipped.push(`${t.repo}（退订名单）`);
      continue;
    }
    if (ledger.some((l) => l.email === t.email || l.repo === t.repo)) {
      report.skipped.push(`${t.repo}（已联系过）`);
      continue;
    }

    const meta = enriched.get(t.repo) ?? {};
    const tagline = (meta.taglineEn ?? t.description ?? "").slice(0, 200);
    const scenario = meta.scenario ?? "其他";
    const kind = ["AGENT", "COMPONENT", "BENCHMARK"].includes(meta.kind)
      ? meta.kind
      : "AGENT";

    if (dryRun) {
      console.log(
        `🧪 [演练] 将收录 ${t.repo}（${kind}/${scenario}）并发信至 ${t.email}`
      );
      report.sent.push(`${t.repo} → ${t.email}（演练）`);
      continue;
    }

    // ① 收录上架（幂等：同名更新标记）
    let project;
    try {
      const readme = ghRaw(
        `repos/${t.repo}/readme`,
        "application/vnd.github.raw"
      );
      project = await prisma.project.findFirst({
        where: { name: t.repo.split("/")[1] },
      });
      if (project) {
        project = await prisma.project.update({
          where: { id: project.id },
          data: {
            tagline,
            readme,
            scenario,
            kind,
            claimable: true,
            showcase: true,
          },
        });
      } else {
        project = await prisma.project.create({
          data: {
            name: t.repo.split("/")[1],
            tagline,
            readme,
            repoUrl: t.url,
            framework: "自研框架",
            language: t.language === "?" ? "其他" : t.language,
            scenario,
            kind,
            licenseType: "MIT",
            openType: "FULL",
            claimable: true,
            showcase: true,
            ownerId: admin.id,
          },
        });
      }
      console.log(`✓ 已收录 ${t.repo} → https://openaggit.com/agents/${project.id}`);
    } catch (e) {
      report.failed.push(`${t.repo}（收录失败: ${e.message.slice(0, 80)}）`);
      continue;
    }

    // ② 发送模板邮件
    const html = `<p>Hey there,</p><p>I am the founder of OpenAggit. I came across <strong>${t.repo}</strong> on GitHub and the codebase is absolutely hardcore. We believe your project is extremely valuable and sets a true benchmark for the industry. Because of its high quality, I have featured it on our homepage as one of our "Genesis Showcase" projects.</p><p>🔗 You can check it out here: <a href="https://openaggit.com/agents/${project.id}">openaggit.com/agents/${project.id}</a></p><p>If you are interested in taking custom bounties based on your project, feel free to log in via GitHub to claim it. If you prefer not to be showcased, just let me know and I will take it down immediately.</p><p><strong>What is OpenAggit?</strong><br>We are an open-source, hacker-centric trading hall for AI Agents. We bridge the gap between hard-core developers and clients by focusing on code verification and sandbox execution, breaking the black box of traditional software outsourcing.</p><p>🎁 <strong>Early Bird:</strong> As we just launched, the first 1,000 registered developers will receive an exclusive <strong>"Genesis Founder"</strong> badge on their profile.</p><p>🛠️ <strong>Fully Open Source:</strong> We are just getting started, and the entire platform is completely open-sourced at: <a href="https://github.com/XKCCC/aggit">https://github.com/XKCCC/aggit</a>. We warmly welcome you to drop a PR and join us in building this community!</p><p>Keep building!<br>Founder, OpenAggit</p>`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM ?? "OpenAggit <official@openaggit.com>",
          to: [t.email],
          subject: "Featured your awesome Agent on OpenAggit 🚀",
          html,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        report.failed.push(`${t.repo}（发送失败: ${JSON.stringify(body).slice(0, 100)}）`);
        continue;
      }
      console.log(`✉ 已发送 ${t.email} → ${body.id}`);
      report.sent.push(`${t.repo} → ${t.email} (${body.id})`);

      // ③ 记账（防重发）
      ledger.push({
        repo: t.repo,
        email: t.email,
        sentAt: new Date().toISOString(),
        resendId: body.id,
      });
      writeJson(LEDGER_FILE, ledger);
    } catch (e) {
      report.failed.push(`${t.repo}（发送异常: ${e.message.slice(0, 80)}）`);
      continue;
    }

    // 间隔 3 秒，避免短时间爆发
    await sleep(3000);
  }

  await prisma.$disconnect();

  console.log("\n════════ 本批汇总 ════════");
  console.log(`✅ 成功 ${report.sent.length}：`);
  report.sent.forEach((s) => console.log(`   ${s}`));
  if (report.skipped.length) {
    console.log(`⊘ 跳过 ${report.skipped.length}：`);
    report.skipped.forEach((s) => console.log(`   ${s}`));
  }
  if (report.failed.length) {
    console.log(`✗ 失败 ${report.failed.length}：`);
    report.failed.forEach((s) => console.log(`   ${s}`));
  }
}

// ---------- optout ----------

function optoutAdd(args) {
  const email = String(args.email ?? "").toLowerCase();
  if (!validEmail(email)) {
    console.error("请提供有效邮箱: optout --email someone@x.com");
    process.exit(1);
  }
  const list = readJson(OPTOUT_FILE, []);
  if (!list.includes(email)) {
    list.push(email);
    writeJson(OPTOUT_FILE, list);
  }
  console.log(`✓ ${email} 已加入退订名单（永不发送）`);
}

// ---------- LLM 精选 ----------

const SELECT_CRITERIA = `你是 OpenAggit（AI Agent 悬赏交易平台）创始人的选品助手。从给定的 GitHub 候选项目中，挑出最适合收录进平台 "Genesis Showcase" 的项目。评判标准（按权重）：
1. 真项目：必须是真正的 Agent / Agent 工具 / Harness / Skill 项目，排除 awesome-list、教程、纯文档、玩具 demo
2. 工程硬核度：有真实架构和代码深度，不是一句话套壳
3. 雇主定制潜力：下沉市场的个人消费者也能基于它发悬赏定制的场景空间，个人使用者这部分是重点，需要agent能解决日常工作生活的问题，或者是有潜在的使用场景痛点；个人开发者能解决个人开发（游戏，美术，工具等）的需求；企业愿意基于它发悬赏定制的场景空间；
4. 作者响应概率：独立开发者优先，大型组织官方账号减分
5. 国际化展示：英文简介优先（平台默认英文界面）
严格输出 JSON：{"picks":[{"id":候选id,"reason":"一句话中文理由"}]}，不要输出其他内容。`;

async function llmSelect(candidates, pick, env) {
  const key = env.DASHSCOPE_API_KEY;
  if (!key) throw new Error("缺少 DASHSCOPE_API_KEY 环境变量");
  const base =
    env.LLM_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = env.LLM_MODEL ?? "qwen-plus";

  const brief = candidates.map((c) => ({
    id: c.id,
    repo: c.repo,
    stars: c.stars,
    language: c.language,
    description: c.description,
  }));

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SELECT_CRITERIA },
        {
          role: "user",
          content: `候选项目列表：\n${JSON.stringify(brief, null, 2)}\n\n请选出 ${pick} 个。`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM 调用失败 ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

async function select(args) {
  const file = path.join(DATA_DIR, args.file ?? "");
  if (!args.file || !fs.existsSync(file)) {
    console.error("用法: select --file <candidates.json> [--top 20] [--pick 5]");
    process.exit(1);
  }
  const candidates = readJson(file, []);
  const top = Number(args.top ?? 20);
  const pick = Number(args.pick ?? 5);
  const pool = candidates.slice(0, top);
  console.log(`从 ${pool.length} 个候选中让 LLM 精选 ${pick} 个…`);

  const env = { ...loadEnv(), ...process.env };
  const result = await llmSelect(pool, pick, env);
  const picks = result.picks ?? [];
  if (picks.length === 0) throw new Error("LLM 未返回有效选择");

  const shortlist = picks
    .map((p) => {
      const c = pool.find((x) => x.id === Number(p.id));
      return c ? { ...c, llmReason: p.reason ?? "" } : null;
    })
    .filter(Boolean)
    .map((c, i) => ({ ...c, id: i + 1 })); // 重编号，方便 send --ids

  const date = new Date().toISOString().slice(0, 10);
  const outFile = path.join(DATA_DIR, `shortlist-${date}.json`);
  writeJson(outFile, shortlist);

  console.log("─".repeat(80));
  for (const c of shortlist) {
    console.log(`#${c.id}  ${c.repo}  ★${c.stars}  [${c.language}]`);
    console.log(`    理由: ${c.llmReason}`);
    console.log(`    📧 ${c.email}`);
  }
  console.log("─".repeat(80));
  console.log(
    `精选 ${shortlist.length} 个 → ${outFile}\n确认发送: node scripts/outreach/agent.mjs send --file ${path.basename(outFile)} --ids ${shortlist.map((c) => c.id).join(",")}`
  );
}

// ---------- daily（全自动每日任务） ----------

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function daily() {
  console.log(`\n[${new Date().toISOString()}] ═══ 每日外联自动任务开始 ═══`);

  // ① 扫描（dry-run 产出候选清单）
  await scan({ pages: 2 });
  const candidatesFile = `candidates-${today()}.json`;
  const candidates = readJson(path.join(DATA_DIR, candidatesFile), []);
  if (candidates.length === 0) {
    console.log("今日无新候选（全部过滤或已联系），任务结束");
    return;
  }

  // ② LLM 精选
  await select({ file: candidatesFile, top: 20, pick: 5 });
  const shortlistFile = `shortlist-${today()}.json`;
  const shortlist = readJson(path.join(DATA_DIR, shortlistFile), []);
  if (shortlist.length === 0) {
    console.log("LLM 未选出候选，任务结束");
    return;
  }

  // ③ 全自动发送（内置：LLM 润色、间隔、台账、退订过滤、批次报告）
  await send({
    file: shortlistFile,
    ids: shortlist.map((c) => c.id).join(","),
  });
  console.log("═══ 每日外联自动任务完成 ═══\n");
}

// ---------- 入口 ----------

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (cmd === "scan") await scan(args);
else if (cmd === "send") await send(args);
else if (cmd === "select") await select(args);
else if (cmd === "daily") await daily();
else if (cmd === "optout") optoutAdd(args);
else {
  console.log(
    "用法: scan | select --file <f> [--top 20] [--pick 5] | send --file <f> --ids <n> | daily | optout --email <e>"
  );
}
