import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import VerifyForm from "@/components/VerifyForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const email = (sp.email ?? "").trim().toLowerCase();
  const { m } = await getI18n();
  const current = await getCurrentUser();
  if (current) redirect("/dashboard");
  if (!email) redirect("/login");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-50">{m.verify.title}</h1>
        <p className="mt-3 text-sm text-zinc-400">
          {m.verify.subtitle}{" "}
          <span className="font-mono text-emerald-300">{email}</span>
        </p>
      </div>
      <div className="mt-8 rounded-xl border border-[#21262d] bg-[#161b22] p-6">
        <VerifyForm email={email} labels={m.verify} />
      </div>
    </div>
  );
}
