#!/usr/bin/env node
/**
 * 需求侧外联 agent（demand agent）
 * 信号源：热门 Agent 仓库 GitHub Issues 中"已说出口"的定制/部署/商用需求
 * 用法：
 *   node scripts/outreach/demand.mjs scan [--days 30]
 *     → 扫描 issue，LLM 过滤真需求，挖公开邮箱，输出候选清单（不发信）
 *   node scripts/outreach/demand.mjs send --file <f> --ids 1,2
 *     → 对选中候选发送需求侧邀约邮件并记账
 *   node scripts/outreach/demand.mjs daily
 *     → 全自动：scan → send（≤5 人）
 * 纪律：只看公开邮箱、台账防重发、optout 永不发、单批 ≤5
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = path.join(ROOT, "scripts/outreach/data");
const LEDGER_FILE = path.join(DATA_DIR, "demand_ledger.json");
const OPTOUT_FILE = path.join(DATA_DIR, "optout.json");

// 热门 Agent 生态仓库（雇主高频出没区）
const REPOS = [
  "langchain-ai/langchain",
  "microsoft/autogen",
  "crewAIInc/crewAI",
  "langgenius/dify",
  "FlowiseAI/Flowise",
  "n8n-io/n8n",
  "Significant-Gravitas/AutoGPT",
  "langchain-ai/langgraph",
];

// 需求信号关键词（标题/正文命中其一即进入 LLM 复审）
const KEYWORDS = [
  "custom", "customize", "integrate", "integration", "deploy",
  "deployment", "production", "commercial", "business use", "our company",
  "our team", "enterprise", "use case", "商用", "部署", "定制", "接入", "企业",
];

function loadEnv() {
  const env = {};
  for (const line of fs
    .readFileSync(path.join(ROOT, ".env"), "utf8")
    .split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  try {
    for (const line of fs
      .readFileSync(path.join(ROOT, "scripts/outreach/data/env.sh"), "utf8")
      .split("\n")) {
      const m = line.match(/^(?:export\s+)?([A-Z_]+)="?(.*?)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {}
  return env;
}

function gh(endpoint) {
  const out = execSync(`gh api "${endpoint}"`, {
    maxBuffer: 32 * 1024 * 1024,
  }).toString();
  return JSON.parse(out);
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BAD_EMAIL = /noreply|no-reply|bot@|example\.|localhost/i;
function validEmail(email) {
  return !!email && EMAIL_RE.test(email) && !BAD_EMAIL.test(email);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      args[argv[i].slice(2)] =
        argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    } else args._.push(argv[i]);
  }
  return args;
}

// ---------- LLM 需求判断 ----------
const JUDGE_PROMPT = `你在为一个 AI Agent 定制悬赏平台做需求信号过滤。给定一个 GitHub issue 的标题和内容片段，判断它是否是"真实的企业定制/部署/集成需求"——即发问者想把这个工具用在自己公司/团队/商业场景里（这类人可以转化为悬赏雇主）。
判定为真需求的例子：想部署到生产环境、想集成进自家产品、想商用、问定制可能性、为公司评估落地。
判为非需求的例子：报 bug、提 feature request、问用法、报错求助、纯学习讨论。
严格输出 JSON：{"convertible":true或false,"summary":"一句英文概括其需求（≤15词）","reason":"一句中文理由"}，不要输出其他内容。`;

async function llmJudge(issue, env) {
  const base =
    env.LLM_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = env.LLM_MODEL ?? "qwen-plus";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: JUDGE_PROMPT },
        {
          role: "user",
          content: `仓库：${issue.repo}\n标题：${issue.title}\n内容：${issue.body}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!res.ok) return { convertible: false };
  const data = await res.json();
  try {
    return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return { convertible: false };
  }
}

// ---------- scan ----------
async function scan(args) {
  const days = Number(args.days ?? 30);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const env = { ...loadEnv(), ...process.env };
  const ledger = readJson(LEDGER_FILE, []);
  const optout = new Set(readJson(OPTOUT_FILE, []).map((e) => e.toLowerCase()));
  const seenIssues = new Set(ledger.map((l) => l.issueUrl));
  const seenEmails = new Set(ledger.map((l) => l.email));

  const hits = [];
  for (const repo of REPOS) {
    let issues = [];
    try {
      issues = gh(
        `repos/${repo}/issues?state=open&since=${since}&per_page=50&sort=created&direction=desc`
      );
    } catch (e) {
      console.error(`拉取 ${repo} 失败: ${String(e.message).slice(0, 80)}`);
      continue;
    }
    for (const issue of issues) {
      if (issue.pull_request) continue; // issues 接口混有 PR，剔除
      if (seenIssues.has(issue.html_url)) continue;
      const text = `${issue.title}\n${issue.body ?? ""}`.toLowerCase();
      if (!KEYWORDS.some((k) => text.includes(k.toLowerCase()))) continue;
      hits.push({
        repo,
        title: issue.title,
        body: (issue.body ?? "").slice(0, 1200),
        issueUrl: issue.html_url,
        author: issue.user?.login ?? "",
      });
    }
    console.log(`${repo}: 累计命中 ${hits.length}`);
  }
  console.log(`\n关键词命中 ${hits.length} 条 issue，LLM 复审中…`);

  const candidates = [];
  let idx = 1;
  for (const h of hits) {
    if (candidates.length >= 15) break;
    const verdict = await llmJudge(h, env);
    if (!verdict.convertible) continue;
    // 挖作者公开邮箱
    let email = null;
    try {
      const u = gh(`users/${h.author}`);
      if (validEmail(u.email)) email = u.email.toLowerCase();
    } catch {}
    if (!email || seenEmails.has(email) || optout.has(email)) continue;
    candidates.push({
      id: idx++,
      ...h,
      email,
      summary: verdict.summary ?? "",
      reason: verdict.reason ?? "",
    });
  }

  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(DATA_DIR, `demand-candidates-${date}.json`);
  writeJson(file, candidates);

  console.log("─".repeat(80));
  console.log("需求候选（dry-run，未发送）:");
  for (const c of candidates) {
    console.log(`#${c.id}  [${c.repo}] ${c.title.slice(0, 60)}`);
    console.log(`    需求: ${c.summary}`);
    console.log(`    📧 ${c.email}  👤 @${c.author}  🔗 ${c.issueUrl}`);
  }
  console.log("─".repeat(80));
  console.log(
    `共 ${candidates.length} 位 → ${file}\n发送: node scripts/outreach/demand.mjs send --file ${path.basename(file)} --ids 1,2`
  );
}

// ---------- send ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendTargets(targets, env) {
  const ledger = readJson(LEDGER_FILE, []);
  const optout = new Set(readJson(OPTOUT_FILE, []).map((e) => e.toLowerCase()));
  const report = { sent: [], skipped: [], failed: [] };

  for (const t of targets) {
    if (optout.has(t.email)) {
      report.skipped.push(`${t.author}（退订）`);
      continue;
    }
    if (ledger.some((l) => l.email === t.email || l.issueUrl === t.issueUrl)) {
      report.skipped.push(`${t.author}（已联系）`);
      continue;
    }

    const firstName = t.author;
    const html = `<p>Hey ${firstName},</p><p>I noticed your issue on <strong>${t.repo}</strong>: "${t.title}" — sounds like you're looking to ${t.summary || "put this into real production use"}.</p><p>I'm the founder of OpenAggit (<a href="https://openaggit.com">openaggit.com</a>), an open-source marketplace where verified agent developers take on exactly this kind of customization work.</p><p>Instead of waiting for an answer in a busy issue tracker, you can post it as a <strong>bounty</strong>: verified devs claim it, deliver the work, and the payment stays in escrow until you accept it. Typical customization bounties run $100–$2,000 depending on scope.</p><p>👉 <a href="https://openaggit.com/bounties/new">Post a bounty (2 min)</a> — describe what you need, set your budget, done.</p><p>We're fully open source: <a href="https://github.com/XKCCC/aggit">github.com/XKCCC/aggit</a>. This is a one-time note — if it's not relevant, just ignore it and you'll never hear from me again.</p><p>Keep building!<br>Founder, OpenAggit</p>`;

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
          subject: "Someone on aggit can build that for you 🤖",
          html,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        report.failed.push(`${t.author}（${JSON.stringify(body).slice(0, 80)}）`);
        continue;
      }
      console.log(`✉ 已发送 ${t.email}（${t.repo}）→ ${body.id}`);
      report.sent.push(`${t.author} → ${t.email}`);
      ledger.push({
        author: t.author,
        email: t.email,
        issueUrl: t.issueUrl,
        repo: t.repo,
        sentAt: new Date().toISOString(),
        resendId: body.id,
      });
      writeJson(LEDGER_FILE, ledger);
    } catch (e) {
      report.failed.push(`${t.author}（${e.message.slice(0, 80)}）`);
      continue;
    }
    await sleep(3000);
  }
  return report;
}

async function send(args) {
  if (!args.file || !args.ids) {
    console.error("用法: send --file <f> --ids 1,2");
    process.exit(1);
  }
  const candidates = readJson(path.join(DATA_DIR, args.file), []);
  const ids = String(args.ids)
    .split(",")
    .map((s) => Number(s.trim()))
    .filter(Boolean);
  const targets = candidates.filter((c) => ids.includes(c.id));
  if (targets.length === 0) {
    console.error("没有匹配候选");
    process.exit(1);
  }
  if (targets.length > 5) {
    console.error("需求侧单批最多 5 人");
    process.exit(1);
  }
  const env = { ...loadEnv(), ...process.env };
  const report = await sendTargets(targets, env);
  console.log("\n═══ 本批汇总 ═══");
  console.log(`✅ ${report.sent.length} 成功 / ⊘ ${report.skipped.length} 跳过 / ✗ ${report.failed.length} 失败`);
  report.sent.forEach((s) => console.log(`   ${s}`));
  report.skipped.forEach((s) => console.log(`   ${s}`));
  report.failed.forEach((s) => console.log(`   ${s}`));
}

// ---------- daily ----------
async function daily() {
  console.log(`\n[${new Date().toISOString()}] ═══ 需求侧每日外联开始 ═══`);
  await scan({ days: 2 }); // 每日增量：只看近 2 天
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(DATA_DIR, `demand-candidates-${date}.json`);
  const candidates = readJson(file, []);
  if (candidates.length === 0) {
    console.log("今日无新需求信号，收工");
    return;
  }
  const env = { ...loadEnv(), ...process.env };
  const targets = candidates.slice(0, 5); // 每日 ≤5
  const report = await sendTargets(targets, env);
  console.log(`═══ 需求侧完成：发 ${report.sent.length} / 跳 ${report.skipped.length} / 败 ${report.failed.length} ═══\n`);
}

// ---------- 入口 ----------
const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (cmd === "scan") await scan(args);
else if (cmd === "send") await send(args);
else if (cmd === "daily") await daily();
else console.log("用法: scan [--days N] | send --file <f> --ids <n> | daily");
