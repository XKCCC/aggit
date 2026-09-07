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
  if (session.user.blocked) return null; // 被封禁用户视为未登录
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
// GitHub OAuth
// 流程：/api/auth/github 跳转 GitHub 授权页 → /api/auth/callback/github
// 用 code 换 access_token → 拉取用户 profile → upsert User → createSession()
// 环境变量：GITHUB_ID / GITHUB_SECRET（仅服务端，绝不进仓库）
// ---------------------------------------------------------------------------

export interface GithubProfile {
  githubId: string;
  login: string;
  name: string | null;
  email: string | null;
}

export function githubOAuthEnabled(): boolean {
  return !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
}

export function getGithubAuthorizeUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_ID!,
    redirect_uri: `${origin}/api/auth/callback/github`,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function fetchGithubUser(
  code: string,
  origin: string
): Promise<GithubProfile | null> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_ID,
      client_secret: process.env.GITHUB_SECRET,
      code,
      redirect_uri: `${origin}/api/auth/callback/github`,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${tokenData.access_token}`,
    "User-Agent": "aggit-app",
    Accept: "application/vnd.github+json",
  };
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) return null;
  const profile = await userRes.json();

  let email: string | null = profile.email ?? null;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers,
    });
    if (emailsRes.ok) {
      const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
        await emailsRes.json();
      const primary =
        emails.find((e) => e.primary && e.verified) ??
        emails.find((e) => e.verified);
      email = primary?.email ?? null;
    }
  }

  return {
    githubId: String(profile.id),
    login: profile.login ?? "github_user",
    name: profile.name ?? null,
    email,
  };
}

const GITHUB_AVATAR_COLORS = [
  "#10b981",
  "#38bdf8",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#34d399",
  "#f472b6",
  "#60a5fa",
];

export async function upsertGithubUser(profile: GithubProfile) {
  // 1) githubId 直接命中：老用户登录
  const byGithubId = await prisma.user.findUnique({
    where: { githubId: profile.githubId },
  });
  if (byGithubId) return byGithubId;

  // 2) 邮箱命中：为已有账号绑定 GitHub，同时视为邮箱已验证
  if (profile.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { githubId: profile.githubId, emailVerified: true },
      });
    }
  }

  // 3) 新用户：以 GitHub login 生成合法唯一用户名
  const base =
    profile.login
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 17) || "gh_user";
  const stem = base.length >= 3 ? base : `${base}_gh`;
  let username = stem;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${stem}${randomBytes(2).toString("hex")}`;
  }

  const colorIndex =
    profile.githubId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    GITHUB_AVATAR_COLORS.length;

  return prisma.user.create({
    data: {
      username,
      displayName: profile.name ?? profile.login,
      role: "DEVELOPER",
      githubId: profile.githubId,
      githubUrl: `https://github.com/${profile.login}`,
      email: profile.email,
      emailVerified: !!profile.email,
      avatarColor: GITHUB_AVATAR_COLORS[colorIndex],
      // passwordHash 留空：GitHub 注册的用户无密码，只能走 OAuth 登录
    },
  });
}
