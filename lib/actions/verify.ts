"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { hashCode, sendCode } from "@/lib/verifycode";
import { rateLimit } from "@/lib/ratelimit";

export type VerifyFormState = { error?: string; ok?: boolean };

const MAX_ATTEMPTS = 5;

export async function verifyEmail(
  _prev: VerifyFormState,
  formData: FormData
): Promise<VerifyFormState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const code = String(formData.get("code") || "").trim();
  if (!email || !/^\d{6}$/.test(code)) return { error: "code" };

  const rec = await prisma.emailCode.findUnique({ where: { email } });
  if (!rec || rec.expiresAt < new Date() || rec.attempts >= MAX_ATTEMPTS) {
    return { error: "code" };
  }
  if (rec.codeHash !== hashCode(email, code)) {
    await prisma.emailCode.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return { error: "code" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "code" };

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });
  await prisma.emailCode.delete({ where: { email } });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function resendCode(
  _prev: VerifyFormState,
  formData: FormData
): Promise<VerifyFormState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "code" };

  // 同一邮箱每分钟最多重发 1 次
  if (!(await rateLimit(`resend:${email}`, 1, 60_000))) {
    return { error: "ratelimit" };
  }

  // 仅对存在且未验证的账号发码；无论是否存在都返回 ok，避免账号枚举
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await sendCode(email);
  }
  return { ok: true };
}
