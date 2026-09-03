import { createHash, randomInt } from "crypto";
import { prisma } from "./db";
import { sendVerificationEmail } from "./email";

const CODE_TTL_MS = 10 * 60 * 1000;

export function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export async function sendCode(email: string): Promise<void> {
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await prisma.emailCode.upsert({
    where: { email },
    update: { codeHash: hashCode(email, code), attempts: 0, expiresAt },
    create: { email, codeHash: hashCode(email, code), expiresAt },
  });
  await sendVerificationEmail(email, code);
}
