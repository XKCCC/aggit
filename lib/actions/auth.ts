"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendCode } from "@/lib/verifycode";

export type AuthFormState = { error?: string; ok?: boolean };

const AVATAR_COLORS = [
  "#10b981",
  "#38bdf8",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#34d399",
  "#f472b6",
  "#60a5fa",
];

// 平台保留用户名：普通注册永不开放，管理员账号只能通过数据库脚本创建
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "official",
  "moderator",
  "mod",
  "owner",
  "aggit",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function passwordLogin(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const loginId = String(formData.get("loginId") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  if (!loginId || !password) return { error: "empty" };

  if (!(await rateLimit("login", 10, 60_000))) {
    return { error: "ratelimit" };
  }

  // 支持用户名或邮箱登录
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: loginId }, { email: loginId }] },
  });
  if (
    !user ||
    !user.passwordHash ||
    !verifyPassword(password, user.passwordHash)
  ) {
    return { error: "invalid" };
  }
  if (user.blocked) return { error: "blocked" };

  // 邮箱未验证：补发验证码并引导去验证页
  if (user.email && !user.emailVerified) {
    await sendCode(user.email);
    redirect(`/verify?email=${encodeURIComponent(user.email)}`);
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function register(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  // 蜜罐：正常用户看不到 website 字段，填了的一律按机器人处理（静默丢弃）
  if (String(formData.get("website") || "").trim()) {
    redirect("/");
  }
  // 注册接口是全站唯一的匿名入口：同一 IP 每分钟最多注册 3 次，防脚本灌库
  if (!(await rateLimit("register", 3, 60_000))) {
    return { error: "ratelimit" };
  }
  // 人机验证
  const captchaToken = String(formData.get("captchaToken") || "");
  const captchaAnswer = String(formData.get("captcha") || "");
  if (!verifyCaptcha(captchaToken, captchaAnswer)) {
    return { error: "captcha" };
  }

  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") || "");
  const password = String(formData.get("password") || "");
  const password2 = String(formData.get("password2") || "");

  if (
    !/^[a-z0-9_]{3,20}$/.test(username) ||
    RESERVED_USERNAMES.has(username) ||
    !displayName ||
    displayName.length > 30 ||
    !EMAIL_RE.test(email) ||
    password.length < 8 ||
    (role !== "DEVELOPER" && role !== "EMPLOYER")
  ) {
    return { error: "format" };
  }
  if (password !== password2) return { error: "mismatch" };

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing && existing.emailVerified) return { error: "taken" };

  const colorIndex =
    username.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    AVATAR_COLORS.length;

  if (existing) {
    // 此前注册过但没完成邮箱验证：允许用新信息覆盖并重新发码
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        username,
        displayName,
        email,
        role,
        passwordHash: hashPassword(password),
      },
    });
  } else {
    await prisma.user.create({
      data: {
        username,
        displayName,
        email,
        role,
        passwordHash: hashPassword(password),
        avatarColor: AVATAR_COLORS[colorIndex],
        // isAdmin / blocked / emailVerified 走 schema 默认值 false，注册通道无法触碰
      },
    });
  }

  await sendCode(email);
  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function changePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const oldPassword = String(formData.get("oldPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const newPassword2 = String(formData.get("newPassword2") || "");

  if (
    !user.passwordHash ||
    !verifyPassword(oldPassword, user.passwordHash)
  ) {
    return { error: "invalid" };
  }
  if (newPassword.length < 8) return { error: "format" };
  if (newPassword !== newPassword2) return { error: "mismatch" };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });
  return { ok: true };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
