#!/usr/bin/env node
/**
 * 展位清理器：超过 N 天仍未被认领的收录项目自动下架（隐藏，不删除）。
 * 豁免：有 Star 或评论的项目（访客互动证明其价值）。
 * 幂等，可随时重跑。用法：node scripts/outreach/cleanup.mjs [--days 30]
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
  return env;
}

const args = process.argv.slice(2);
const daysIdx = args.indexOf("--days");
const DAYS = daysIdx > 0 ? Number(args[daysIdx + 1]) : 30;

async function main() {
  const env = { ...loadEnv(), ...process.env };
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });

  const cutoff = new Date(Date.now() - DAYS * 86_400_000);
  const stale = await prisma.project.findMany({
    where: { claimable: true, createdAt: { lt: cutoff } },
    include: { _count: { select: { stars: true, comments: true } } },
  });

  console.log(
    `[cleanup] ${stale.length} 个超过 ${DAYS} 天未认领的项目待评估`
  );
  let hidden = 0;
  let kept = 0;

  for (const p of stale) {
    if (p._count.stars > 0 || p._count.comments > 0) {
      console.log(
        `  ⊘ 豁免 ${p.name}（★${p._count.stars} / 评论 ${p._count.comments}，有互动价值）`
      );
      kept++;
      continue;
    }
    // 下架不删除：作者日后出现可一键恢复
    await prisma.project.update({
      where: { id: p.id },
      data: { visibility: "HIDDEN", showcase: false, claimable: false },
    });
    console.log(`  ✓ 下架 ${p.name}（${DAYS} 天未认领，已隐藏）`);
    hidden++;
  }

  console.log(`[cleanup] 完成：下架 ${hidden}，豁免保留 ${kept}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
