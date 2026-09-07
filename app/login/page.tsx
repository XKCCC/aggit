import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import AuthForms from "@/components/AuthForms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { m } = await getI18n();
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");

  const oauthError =
    sp.oauth === "blocked"
      ? m.login.errors.blocked
      : sp.oauth === "failed"
        ? m.login.errors.oauthFailed
        : sp.oauth === "state"
          ? m.login.errors.oauthState
          : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-50">
          <span className="text-emerald-400">ag</span>git · {m.login.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">{m.login.subtitle}</p>
        {oauthError && (
          <p className="mx-auto mt-4 max-w-md rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300">
            {oauthError}
          </p>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <a
          href="/api/auth/github"
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#30363d] bg-[#161b22] py-2.5 font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-[#1c2129]"
        >
          <svg viewBox="0 0 16 16" className="h-5 w-5 fill-current" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          {m.login.githubLogin}
        </a>

        <div className="my-6 flex items-center gap-4 text-xs text-zinc-600">
          <span className="h-px flex-1 bg-[#21262d]" />
          {m.login.divider}
          <span className="h-px flex-1 bg-[#21262d]" />
        </div>

        <AuthForms labels={m.login} />
      </div>
    </div>
  );
}
