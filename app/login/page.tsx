import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import AuthForms from "@/components/AuthForms";

export default async function LoginPage() {
  const { m } = await getI18n();
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-50">
          <span className="text-emerald-400">ag</span>git · {m.login.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">{m.login.subtitle}</p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <AuthForms labels={m.login} />
      </div>

      <p className="mt-12 rounded-xl border border-[#21262d] bg-[#161b22] p-4 text-center text-xs text-zinc-500">
        {m.login.oauthNote}
      </p>
    </div>
  );
}
