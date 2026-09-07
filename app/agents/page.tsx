import Link from "next/link";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import ProjectCard from "@/components/ProjectCard";
import { FRAMEWORKS, SCENARIOS } from "@/lib/constants";

function buildHref(params: Record<string, string>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `/agents?${s}` : "/agents";
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { m } = await getI18n();
  const q = sp.q?.trim() ?? "";
  const framework = sp.framework ?? "";
  const scenario = sp.scenario ?? "";
  const kind = sp.kind ?? "";
  const sort = sp.sort ?? "new";

  const projects = await prisma.project.findMany({
    where: {
      AND: [
        { visibility: "PUBLIC" },
        q
          ? {
              // 大小写不敏感的模糊匹配：名称/简介/README/框架/场景/语言
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { tagline: { contains: q, mode: "insensitive" } },
                { readme: { contains: q, mode: "insensitive" } },
                { framework: { contains: q, mode: "insensitive" } },
                { scenario: { contains: q, mode: "insensitive" } },
                { language: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        framework ? { framework } : {},
        scenario ? { scenario } : {},
        kind ? { kind } : {},
      ],
    },
    include: { owner: true, _count: { select: { stars: true } } },
    orderBy:
      sort === "stars"
        ? { stars: { _count: "desc" } }
        : { createdAt: "desc" },
  });

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition-colors ${
      active
        ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
        : "border-[#30363d] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{m.agents.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{m.agents.subtitle}</p>
        </div>
        <Link
          href="/agents/new"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
        >
          {m.agents.publish}
        </Link>
      </div>

      {/* 搜索 + 排序 */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form action="/agents" method="get" className="flex gap-2">
          {framework && (
            <input type="hidden" name="framework" value={framework} />
          )}
          {scenario && <input type="hidden" name="scenario" value={scenario} />}
          {kind && <input type="hidden" name="kind" value={kind} />}
          {sort !== "new" && <input type="hidden" name="sort" value={sort} />}
          <input
            name="q"
            defaultValue={q}
            placeholder={m.agents.searchPlaceholder}
            className="w-64 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50"
          />
          <button
            type="submit"
            className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
          >
            {m.common.search}
          </button>
        </form>
        <div className="ml-auto flex gap-2 text-xs">
          <Link
            href={buildHref({ q, framework, scenario, kind, sort: "new" })}
            className={chip(sort !== "stars")}
          >
            {m.common.sortNew}
          </Link>
          <Link
            href={buildHref({ q, framework, scenario, kind, sort: "stars" })}
            className={chip(sort === "stars")}
          >
            {m.common.sortStars}
          </Link>
        </div>
      </div>

      {/* 标签筛选 */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-xs text-zinc-600">
            {m.agents.kind}
          </span>
          <Link
            href={buildHref({ q, framework, scenario, sort, kind: "" })}
            className={chip(!kind)}
          >
            {m.common.all}
          </Link>
          <Link
            href={buildHref({ q, framework, scenario, sort, kind: "AGENT" })}
            className={chip(kind === "AGENT")}
          >
            {m.agents.kindAgent}
          </Link>
          <Link
            href={buildHref({
              q,
              framework,
              scenario,
              sort,
              kind: "COMPONENT",
            })}
            className={chip(kind === "COMPONENT")}
          >
            {m.agents.kindComponent}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-xs text-zinc-600">
            {m.agents.framework}
          </span>
          <Link
            href={buildHref({ q, scenario, sort, kind, framework: "" })}
            className={chip(!framework)}
          >
            {m.common.all}
          </Link>
          {FRAMEWORKS.map((f) => (
            <Link
              key={f}
              href={buildHref({ q, scenario, sort, kind, framework: f })}
              className={chip(framework === f)}
            >
              {m.labels.frameworks[f] ?? f}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-xs text-zinc-600">
            {m.agents.scenario}
          </span>
          <Link
            href={buildHref({ q, framework, sort, kind, scenario: "" })}
            className={chip(!scenario)}
          >
            {m.common.all}
          </Link>
          {SCENARIOS.map((s) => (
            <Link
              key={s}
              href={buildHref({ q, framework, sort, kind, scenario: s })}
              className={chip(scenario === s)}
            >
              {m.labels.scenarios[s] ?? s}
            </Link>
          ))}
        </div>
      </div>

      {/* 列表 */}
      {projects.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[#30363d] p-12 text-center text-sm text-zinc-500">
          {m.agents.empty}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
