import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "./db";

export const SESSION_COOKIE = "aggit_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 天

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// GitHub OAuth 接入点（V2 预留）
//
// 切换真实 GitHub 登录的步骤：
// 1. GitHub → Settings → Developer settings → OAuth Apps 注册应用，
//    回调地址填 {HOST}/api/auth/github/callback，拿到 Client ID / Secret
// 2. 在 .env 配置 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
// 3. 新增 /api/auth/github 路由：跳转 GitHub 授权页 → 回调换取 access_token
//    → 拉取用户 profile → upsert User（githubUrl 字段已预留）→ createSession()
// 4. 登录页把模拟登录入口替换为 "Sign in with GitHub" 按钮即可，
//    其余所有页面只依赖 getCurrentUser()，无需改动
// ---------------------------------------------------------------------------
