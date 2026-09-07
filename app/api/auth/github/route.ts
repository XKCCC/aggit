import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getGithubAuthorizeUrl, githubOAuthEnabled } from "@/lib/auth";

export async function GET(request: Request) {
  if (!githubOAuthEnabled()) {
    return new NextResponse(
      "GitHub OAuth 未配置：缺少 GITHUB_ID / GITHUB_SECRET 环境变量",
      { status: 500 }
    );
  }
  // state 防 CSRF：写入 httpOnly cookie，回调时校验
  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("aggit_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(getGithubAuthorizeUrl(origin, state));
}
