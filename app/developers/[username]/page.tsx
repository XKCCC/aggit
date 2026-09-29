import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import { CLAIM_STATUS, BOUNTY_STATUS } from "@/lib/constants";
import { formatBudget, timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Tag from "@/components/Tag";
import FounderBadge from "@/components/FounderBadge";
import ProjectCard from "@/components/ProjectCard";

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { locale, m } = await getI18n();

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (!user) notFound();

  const [projects, starsReceived, claims, deliveredCount] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id, visibility: "PUBLIC" },
      include: { owner: true, _count: { select: { stars: true } } },
      orderBy: { stars: { _count: "desc" } },
    }),
    prisma.star.count({ where: { project: { ownerId: user.id } } }),
    prisma.claim.findMany({
      where: { developerId: user.id },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            status: true,
            budgetMin: true,
            budgetMax: true,
            currency: true,
            creator: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.claim.count({
      where: { developerId: user.id, status: "ACCEPTED" },
    }),
  ]);

  const stats = [
    { value: String(projects.length), label: m.dev.agents },
    { value: String(starsReceived), label: m.dev.stars },
    { value: String(deliveredCount), label: m.dev.delivered },
    { value: timeAgo(user.createdAt, locale), label: m.dev.joined },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* 身份卡 */}
      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-[#21262d] bg-gradient-to-r from-emerald-400/5 to-violet-400/5 p-6">
        <Avatar
          name={user.displayName}
          color={user.avatarColor}
          size={72}
          avatarUrl={user.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-50">
              {user.displayName}
            </h1>
            {user.isFounder && <FounderBadge title={m.founder.badge} />}
            <Tag tone={user.role === "DEVELOPER" ? "accent" : "violet"}>
              {m.labels.roles[user.role] ?? user.role}
            </Tag>
          </div>
          <p className="mt-1 font-mono text-sm text-zinc-500">
            @{user.username}
          </p>
          {user.bio && (
            <p className="mt-2 max-w-xl text-sm text-zinc-400">{user.bio}</p>
          )}
          <p className="mt-2 text-xs text-zinc-600">{m.dev.forHire}</p>
        </div>
        {user.githubUrl && (
          <a
            href={user.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-[#30363d] px-4 py-2 text-sm text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-300"
          >
            ↗ {m.dev.viewGithub}
          </a>
        )}
      </div>

      {/* 数据条 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#21262d] bg-[#0d1117] px-4 py-3.5 text-center"
          >
            <div className="font-mono text-xl font-semibold text-zinc-100">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 作品集 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {m.dev.worksTitle}
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {projects.length}
          </span>
        </h2>
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#30363d] p-8 text-center text-sm text-zinc-500">
            {m.dev.emptyAgents}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* 交付记录 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {m.dev.deliveryTitle}
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {claims.length}
          </span>
        </h2>
        {claims.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#30363d] p-8 text-center text-sm text-zinc-500">
            {m.dev.emptyDelivery}
          </p>
        ) : (
          <ul className="space-y-3">
            {claims.map((c) => {
              const cs = CLAIM_STATUS[c.status] ?? CLAIM_STATUS.ACTIVE;
              const csLabel =
                m.labels.claimStatus[c.status] ?? cs.label;
              const bs =
                BOUNTY_STATUS[c.bounty.status] ?? BOUNTY_STATUS.OPEN;
              const bsLabel =
                m.labels.bountyStatus[c.bounty.status] ?? bs.label;
              return (
                <li key={c.id}>
                  <Link
                    href={`/bounties/${c.bounty.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-[#21262d] bg-[#0d1117] p-4 hover:border-violet-400/40"
                  >
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${cs.badge}`}
                    >
                      {csLabel}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                      {c.bounty.title}
                    </span>
                    <span className="font-mono text-xs text-violet-300">
                      {formatBudget(
                        c.bounty.budgetMin,
                        c.bounty.budgetMax,
                        c.bounty.currency
                      )}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${bs.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${bs.dot}`} />
                      {bsLabel}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {timeAgo(c.createdAt, locale)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
