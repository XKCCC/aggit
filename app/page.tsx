import Link from "next/link";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import ProjectCard from "@/components/ProjectCard";
import BountyRow from "@/components/BountyRow";

export default async function Home() {
  const { m } = await getI18n();
  const [
    agentCount,
    openBountyCount,
    budgetAgg,
    showcase,
    recentCandidates,
    latestBounties,
  ] = await Promise.all([
    prisma.project.count({ where: { visibility: "PUBLIC" } }),
    prisma.bounty.count({
      where: { status: "OPEN", visibility: "PUBLIC" },
    }),
    prisma.bounty.aggregate({
      _sum: { budgetMax: true },
      where: { status: "OPEN", visibility: "PUBLIC" },
    }),
    // Community Showcase：admin 精选
    prisma.project.findMany({
      where: { visibility: "PUBLIC", showcase: true },
      include: { owner: true, _count: { select: { stars: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    // Agent 榜候选：最近上传，随后按「星星×10 - 上线天数」加权排序
    prisma.project.findMany({
      where: { visibility: "PUBLIC" },
      include: { owner: true, _count: { select: { stars: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    prisma.bounty.findMany({
      where: { status: "OPEN", visibility: "PUBLIC" },
      include: {
        creator: true,
        project: true,
        _count: { select: { claims: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const totalBudget = budgetAgg._sum.budgetMax ?? 0;

  // 加权：1 个 Star 抵 10 天新鲜度
  const freshAgents = recentCandidates
    .map((p) => ({
      p,
      score:
        p._count.stars * 10 -
        Math.floor((Date.now() - p.createdAt.getTime()) / 86_400_000),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.p);

  const sections = [
    {
      key: "showcase",
      show: showcase.length > 0,
      title: m.showcase.title,
      href: "/agents?showcase=1",
      projects: showcase,
      cols: "md:grid-cols-3",
    },
    {
      key: "agents",
      show: true,
      title: m.home.agentsTitle,
      href: "/agents",
      projects: freshAgents,
      cols: "md:grid-cols-2 lg:grid-cols-4",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#21262d]">
        <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 right-1/4 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center">
          <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            {m.home.badge}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
            {m.home.titleA}
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-violet-300 bg-clip-text text-transparent">
              {m.home.titleB}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-zinc-400">
            {m.home.subtitle}
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
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

          <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 divide-x divide-[#21262d] rounded-xl border border-[#21262d] bg-[#0d1117]/80">
            {[
              { value: String(agentCount), label: m.home.statsAgents },
              { value: String(openBountyCount), label: m.home.statsBounties },
              {
                value: `$${totalBudget.toLocaleString()}`,
                label: m.home.statsBudget,
              },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3.5">
                <div className="font-mono text-xl font-semibold text-zinc-100">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase + Agent 榜 */}
      {sections
        .filter((s) => s.show)
        .map((s) => (
          <section key={s.key} className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">{s.title}</h2>
              <Link
                href={s.href}
                className="text-sm text-emerald-400 hover:underline"
              >
                {m.home.viewAll} →
              </Link>
            </div>
            {s.projects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#30363d] p-8 text-center text-sm text-zinc-500">
                {m.home.emptyAgents}
              </p>
            ) : (
              <div className={`grid gap-4 ${s.cols}`}>
                {s.projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </section>
        ))}

      {/* 最新悬赏 */}
      <section className="mx-auto max-w-6xl px-4 pt-2 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">
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
    </div>
  );
}
