import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { createBounty } from "@/lib/actions/bounty";
import PendingSubmit from "@/components/PendingSubmit";

export default async function NewBountyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { m } = await getI18n();

  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });
  const presetProject = sp.project ?? "";

  const inputCls =
    "w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-400/50";
  const labelCls = "mb-1.5 block text-sm font-medium text-zinc-300";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-50">{m.bountyNew.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{m.bountyNew.subtitle}</p>
      <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-300">
        {m.bountyNew.depositNote}
      </p>
      {sp.error && (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300">
          {m.bountyNew.errorInvalid}
        </p>
      )}

      <form action={createBounty} className="mt-8 space-y-5">
        <div>
          <label className={labelCls}>{m.bountyNew.name} *</label>
          <input
            name="title"
            required
            placeholder={m.bountyNew.namePlaceholder}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{m.bountyNew.description} *</label>
          <textarea
            name="description"
            required
            rows={10}
            placeholder={m.bountyNew.descriptionHint}
            className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className={labelCls}>{m.bountyNew.budgetMin} *</label>
            <input
              name="budgetMin"
              type="number"
              min={1}
              required
              placeholder="500"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>{m.bountyNew.budgetMax} *</label>
            <input
              name="budgetMax"
              type="number"
              min={1}
              required
              placeholder="2000"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>{m.bountyNew.currency}</label>
            <select name="currency" className={inputCls} defaultValue="USD">
              <option value="USD">USD ($)</option>
              <option value="CNY">CNY (¥)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{m.bountyNew.tags}</label>
            <input
              name="tags"
              placeholder={m.bountyNew.tagsPlaceholder}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{m.bountyNew.linkedAgent}</label>
            <select
              name="projectId"
              className={inputCls}
              defaultValue={presetProject}
            >
              <option value="">{m.bountyNew.noLink}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#21262d] pt-5">
          <PendingSubmit
            label={m.bountyNew.submit}
            pendingLabel={m.common.submitting}
            className="rounded-lg bg-violet-500 px-6 py-2.5 font-medium text-[#0d1117] hover:bg-violet-400"
          />
        </div>
      </form>
    </div>
  );
}
