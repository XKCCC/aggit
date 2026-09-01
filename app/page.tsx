import Link from "next/link";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import ProjectCard from "@/components/ProjectCard";
import BountyRow from "@/components/BountyRow";

export default async function Home() {
  const { m } = await getI18n();
  const [agentCount, openBountyCount, budgetAgg, featured, latestBounties] =
    await Promise.all([
      prisma.project.count(),
      prisma.bounty.count({ where: { status: "OPEN" } }),
      prisma.bounty.aggregate({
        _sum: { budgetMax: true },
        where: { status: "OPEN" },
      }),
      prisma.project.findMany({
        include: { owner: true, _count: { select: { stars: true } } },
        orderBy: { stars: { _count: "desc" } },
        take: 3,
      }),
      prisma.bounty.findMany({
        where: { status: "OPEN" },
        include: {
          creator: true,
          project: true,
          _count: { select: { claims: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const totalBudget = budgetAgg._sum.budgetMax ?? 0;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#21262d]">
        <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 right-1/4 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            {m.home.badge}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            {m.home.titleA}
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-violet-300 bg-clip-text text-transparent">
              {m.home.titleB}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-zinc-400">
            {m.home.subtitle}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/agents"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-[#0d1117] hover:bg-emerald-400"
            >
              {m.home.ctaExplore}
            </Link>
            <Link
              href="/bounties/new"
              className="rounded-lg border border-[#30363d] px-5 py-2.5 font-medium text-zinc-200 hover:border-violet-400/50 hover:text-violet-300"
            >
              {m.home.ctaBounty}
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 divide-x divide-[#21262d] rounded-xl border border-[#21262d] bg-[#0d1117]/80">
            {[
              { value: String(agentCount), label: m.home.statsAgents },
              { value: String(openBountyCount), label: m.home.statsBounties },
              {
                value: `¥${totalBudget.toLocaleString()}`,
                label: m.home.statsBudget,
              },
            ].map((s) => (
              <div key={s.label} className="px-4 py-4">
                <div className="font-mono text-xl font-semibold text-zinc-100">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 精选 Agent */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">
            {m.home.featuredAgents}
          </h2>
          <Link
            href="/agents"
            className="text-sm text-emerald-400 hover:underline"
          >
            {m.home.viewAll} →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#30363d] p-8 text-center text-sm text-zinc-500">
            {m.home.emptyAgents}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* 最新悬赏 */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">
            {m.home.latestBounties}
          </h2>
          <Link
            href="/bounties"
            className="text-sm text-violet-300 hover:underline"
          >
            {m.home.viewAll} →
          </Link>
        </div>
        {latestBounties.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#30363d] p-8 text-center text-sm text-zinc-500">
            {m.home.emptyBounties}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {latestBounties.map((b) => (
              <BountyRow key={b.id} bounty={b} />
            ))}
          </div>
        )}
      </section>

      {/* 如何运作 */}
      <section className="border-t border-[#21262d] bg-[#0d1117]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-xl font-semibold text-zinc-100">
            {m.home.howTitle}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/5 to-transparent p-6">
              <h3 className="font-semibold text-emerald-300">
                {m.home.forDevs}
              </h3>
              <ol className="mt-4 space-y-3">
                {[m.home.devStep1, m.home.devStep2, m.home.devStep3].map(
                  (step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-300">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 font-mono text-xs text-emerald-300">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  )
                )}
              </ol>
            </div>
            <div className="rounded-xl border border-violet-400/20 bg-gradient-to-b from-violet-400/5 to-transparent p-6">
              <h3 className="font-semibold text-violet-300">
                {m.home.forEmployers}
              </h3>
              <ol className="mt-4 space-y-3">
                {[m.home.empStep1, m.home.empStep2, m.home.empStep3].map(
                  (step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-300">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-400/40 font-mono text-xs text-violet-300">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  )
                )}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
