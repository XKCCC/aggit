import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import AgentForm from "@/components/AgentForm";

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { m } = await getI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-50">{m.agentNew.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{m.agentNew.subtitle}</p>
      {sp.error && (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300">
          {m.agentNew.errorRequired}
        </p>
      )}
      <div className="mt-8">
        <AgentForm
          labels={m.agentNew}
          submittingLabel={m.common.submitting}
          optLabels={{
            ...m.labels.frameworks,
            ...m.labels.scenarios,
            ...m.labels.options,
          }}
        />
      </div>
    </div>
  );
}
