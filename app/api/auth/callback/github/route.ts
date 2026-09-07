import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSession,
  fetchGithubUser,
  githubOAuthEnabled,
  upsertGithubUser,
} from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!githubOAuthEnabled()) {
    return new NextResponse("GitHub OAuth 未配置", { status: 500 });
  }

  const store = await cookies();
  const savedState = store.get("aggit_oauth_state")?.value;
  store.delete("aggit_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/login?oauth=state", url.origin));
  }

  const profile = await fetchGithubUser(code, url.origin);
  if (!profile) {
    return NextResponse.redirect(new URL("/login?oauth=failed", url.origin));
  }

  const user = await upsertGithubUser(profile);
  if (user.blocked) {
    return NextResponse.redirect(new URL("/login?oauth=blocked", url.origin));
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
