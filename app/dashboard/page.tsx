import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { BOUNTY_STATUS, CLAIM_STATUS, ROLES } from "@/lib/constants";
import { formatBudget, timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Tag from "@/components/Tag";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { m } = await getI18n();

  const [myProjects, myBounties, myClaims] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { stars: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bounty.findMany({
      where: { creatorId: user.id },
      include: { _count: { select: { claims: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.claim.findMany({
      where: { developerId: user.id },
      include: { bounty: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sectionCls =
    "rounded-xl border border-[#21262d] bg-[#0d1117] p-5";
  const emptyCls =
    "rounded-lg border border-dashed border-[#30363d] p-6 text-center text-sm text-zinc-600";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* 身份卡 */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#21262d] bg-gradient-to-r from-emerald-400/5 to-violet-400/5 p-5">
        <Avatar name={user.displayName} color={user.avatarColor} size={48} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-50">
              {user.displayName}
            </h1>
            <Tag tone={user.role === "DEVELOPER" ? "accent" : "violet"}>
              {ROLES[user.role] ?? user.role}
            </Tag>
          </div>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">
            @{user.username}
          </p>
          {user.bio && (
            <p className="mt-1 text-sm text-zinc-400">{user.bio}</p>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Link
            href="/agents/new"
            className="rounded-md border border-[#30363d] px-3 py-1.5 text-sm text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-300"
          >
            {m.dashboard.newAgent}
          </Link>
          <Link
            href="/bounties/new"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
          >
            {m.dashboard.newBounty}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* 我发布的 Agent */}
        <section className={sectionCls}>
          <h2 className="mb-4 font-semibold text-zinc-100">
            {m.dashboard.myAgents}
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {myProjects.length}
            </span>
          </h2>
          {myProjects.length === 0 ? (
            <p className={emptyCls}>{m.dashboard.emptyAgents}</p>
          ) : (
            <ul className="space-y-3">
              {myProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/agents/${p.id}`}
                    className="flex items-center gap-3 rounded-lg border border-[#21262d] p-3 hover:border-emerald-400/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-medium text-zinc-200">
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {p.tagline}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      <span className="text-amber-300">★</span>{" "}
                      {p._count.stars} · {timeAgo(p.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 我认领的悬赏 */}
        <section className={sectionCls}>
          <h2 className="mb-4 font-semibold text-zinc-100">
            {m.dashboard.myClaims}
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {myClaims.length}
            </span>
          </h2>
          {myClaims.length === 0 ? (
            <p className={emptyCls}>{m.dashboard.emptyClaims}</p>
          ) : (
            <ul className="space-y-3">
              {myClaims.map((c) => {
                const cs = CLAIM_STATUS[c.status] ?? CLAIM_STATUS.ACTIVE;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/bounties/${c.bountyId}`}
                      className="flex items-center gap-3 rounded-lg border border-[#21262d] p-3 hover:border-violet-400/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-200">
                          {c.bounty.title}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-violet-300">
                          {formatBudget(
                            c.bounty.budgetMin,
                            c.bounty.budgetMax,
                            c.bounty.currency
                          )}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${cs.badge}`}
                      >
                        {cs.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 我发布的悬赏 */}
        <section className={`${sectionCls} lg:col-span-2`}>
          <h2 className="mb-4 font-semibold text-zinc-100">
            {m.dashboard.myBounties}
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {myBounties.length}
            </span>
          </h2>
          {myBounties.length === 0 ? (
            <p className={emptyCls}>{m.dashboard.emptyBounties}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {myBounties.map((b) => {
                const st = BOUNTY_STATUS[b.status] ?? BOUNTY_STATUS.OPEN;
                return (
                  <li key={b.id}>
                    <Link
                      href={`/bounties/${b.id}`}
                      className="flex h-full flex-col gap-2 rounded-lg border border-[#21262d] p-3 hover:border-violet-400/40"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${st.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${st.dot}`}
                          />
                          {st.label}
                        </span>
                        <span className="truncate text-sm font-medium text-zinc-200">
                          {b.title}
                        </span>
                      </span>
                      <span className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-mono text-violet-300">
                          {formatBudget(b.budgetMin, b.budgetMax, b.currency)}
                        </span>
                        <span>
                          {b._count.claims} {m.bounties.claims} ·{" "}
                          {timeAgo(b.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* 账号安全 */}
      <section className="mt-6 rounded-xl border border-[#21262d] bg-[#0d1117] p-5">
        <h2 className="mb-1 font-semibold text-zinc-100">
          {m.dashboard.security}
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          {m.dashboard.boundEmail}：{" "}
          {user.email ? (
            <span className="text-zinc-300">{user.email}</span>
          ) : (
            <span className="text-zinc-600">{m.dashboard.noEmail}</span>
          )}
        </p>
        <ChangePasswordForm labels={m.dashboard} errors={m.login.errors} />
      </section>
    </div>
  );
}
