#!/usr/bin/env node
/**
 * 商业话术卡生成器：为没有 pitch 的项目用 LLM 生成"适合谁/解决什么/定制示例"（中英双语）
 * 幂等：只处理 pitch 为空的公开项目，可随时重跑。
 * 用法：node scripts/outreach/pitch_gen.mjs [--limit 20]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function loadEnv() {
  const env = {};
  for (const line of fs
    .readFileSync(path.join(ROOT, ".env"), "utf8")
    .split("\n")) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  // cron/launchd 环境的补充密钥
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

const PROMPT = `你是面向非技术企业主的产品文案写手。给定一个开源 Agent 项目的名称、简介和 README 片段，输出一张"商业话术卡"，中英双语。要求：
- audience：这个项目最适合的 1-2 类客户（用业务身份描述，如"跨境电商小团队"，禁止技术词）
- problem：一句话说清它帮客户省什么钱/省什么力（从客户视角，禁止技术词）
- examples：3 条定制需求示例，用客户第一人称口语（"帮我……"），每条 ≤30 字，必须具体可落地
严格输出 JSON（不要输出其他内容）：
{"audience_zh":"...","audience_en":"...","problem_zh":"...","problem_en":"...","examples_zh":["...","...","..."],"examples_en":["...","...","..."]}`;

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const limit = limitIdx > 0 ? Number(args[limitIdx + 1]) : 20;

async function main() {
  const env = { ...loadEnv(), ...process.env };
  if (!env.DASHSCOPE_API_KEY) throw new Error("缺少 DASHSCOPE_API_KEY");
  const base =
    env.LLM_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = env.LLM_MODEL ?? "qwen-plus";

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });

  const projects = await prisma.project.findMany({
    where: { visibility: "PUBLIC", pitch: null },
    orderBy: { showcase: "desc" },
    take: limit,
  });
  console.log(`待生成话术卡的项目：${projects.length} 个`);

  for (const p of projects) {
    const brief = {
      name: p.name,
      tagline: p.tagline,
      readme: p.readme.slice(0, 3500),
    };
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: PROMPT },
            { role: "user", content: JSON.stringify(brief) },
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
        }),
      });
      if (!res.ok) throw new Error(`LLM ${res.status}`);
      const data = await res.json();
      const pitch = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
      if (!pitch.problem_zh || !pitch.problem_en) throw new Error("内容不完整");
      await prisma.project.update({
        where: { id: p.id },
        data: { pitch: JSON.stringify(pitch) },
      });
      console.log(`✓ ${p.name}: ${pitch.problem_zh.slice(0, 50)}…`);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.error(`✗ ${p.name}: ${e.message.slice(0, 100)}`);
    }
  }
  await prisma.$disconnect();
  console.log("完成");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
