"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/ratelimit";

export type AuthFormState = { error?: string };

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

export async function passwordLogin(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  if (!username || !password) return { error: "empty" };

  const user = await prisma.user.findUnique({ where: { username } });
  if (
    !user ||
    !user.passwordHash ||
    !verifyPassword(password, user.passwordHash)
  ) {
    return { error: "invalid" };
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

  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") || "").trim();
  const role = String(formData.get("role") || "");
  const password = String(formData.get("password") || "");
  const password2 = String(formData.get("password2") || "");

  if (
    !/^[a-z0-9_]{3,20}$/.test(username) ||
    !displayName ||
    displayName.length > 30 ||
    password.length < 8 ||
    (role !== "DEVELOPER" && role !== "EMPLOYER")
  ) {
    return { error: "format" };
  }
  if (password !== password2) return { error: "mismatch" };

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: "taken" };

  const colorIndex =
    username.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      role,
      passwordHash: hashPassword(password),
      avatarColor: AVATAR_COLORS[colorIndex],
    },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function mockLogin(formData: FormData) {
  const username = String(formData.get("username") || "");
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) redirect("/login?error=1");
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
