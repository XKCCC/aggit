import { headers } from "next/headers";

// 轻量内存限流：同一 IP 在窗口期内超过次数即拒绝。
// 注：Vercel Serverless 多实例各自计数，不能做到全局限流，
// 但足以拦住单机乱扫的脚本；后续可换 Upstash Redis 做全局限流。
const buckets = new Map<string, number[]>();

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const hits = (buckets.get(id) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(id, hits);
    return false;
  }
  hits.push(now);
  buckets.set(id, hits);
  return true;
}
