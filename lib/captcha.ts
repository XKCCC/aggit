import { createHmac, randomInt, timingSafeEqual } from "crypto";

// 无状态人机验证：服务端签发「答案+过期时间」的 HMAC 签名令牌，
// 校验时用用户提交的答案重算签名比对，无需存储、无需外部服务。
// 密钥优先取 CAPTCHA_SECRET，缺省派生自 DATABASE_URL（仅服务端可见，公开仓库中不存在）。
const TTL_MS = 10 * 60 * 1000;

function secretKey(): string {
  return (
    process.env.CAPTCHA_SECRET ?? process.env.DATABASE_URL ?? "aggit-dev-only"
  );
}

function sign(answer: number, expiry: number): string {
  return createHmac("sha256", secretKey())
    .update(`${answer}.${expiry}`)
    .digest("hex")
    .slice(0, 32);
}

export function newCaptcha(): { token: string; question: string } {
  const a = randomInt(2, 12);
  const b = randomInt(2, 12);
  const expiry = Date.now() + TTL_MS;
  return {
    token: `${expiry}.${sign(a + b, expiry)}`,
    question: `${a} + ${b} = ?`,
  };
}

export function verifyCaptcha(token: string, answerInput: string): boolean {
  const [expStr, sig] = token.split(".");
  const expiry = Number(expStr);
  if (!expiry || !sig || Date.now() > expiry) return false;
  const answer = Number(answerInput.trim());
  if (!Number.isInteger(answer)) return false;
  const expected = Buffer.from(sign(answer, expiry), "hex");
  const actual = Buffer.from(sig, "hex");
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}
