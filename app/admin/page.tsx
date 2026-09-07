import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Tag from "@/components/Tag";
import PendingSubmit from "@/components/PendingSubmit";
import DeleteButton from "@/components/DeleteButton";
import { setUserBlocked, setEscrowStatus } from "@/lib/actions/admin";
import {
  setProjectVisibility,
  deleteProject,
  setBountyVisibility,
  deleteBounty,
} from "@/lib/actions/moderation";
import { formatBudget } from "@/lib/format";
import Link from "next/link";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) notFound();
  const { locale, m } = await getI18n();

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { projects: true, bounties: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const projects = await prisma.project.findMany({
    include: { owner: true, _count: { select: { stars: true } } },
    orderBy: { createdAt: "desc" },
  });
  const bounties = await prisma.bounty.findMany({
    include: { creator: true, _count: { select: { claims: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-50">{m.admin.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {m.admin.users} · {users.length}
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-[#21262d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#21262d] bg-[#161b22] text-left text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">{m.admin.email}</th>
              <th className="px-4 py-3 font-medium">{m.admin.agents} / {m.admin.bounties}</th>
              <th className="px-4 py-3 font-medium">{m.admin.joined}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[#21262d] last:border-0 hover:bg-[#161b22]/60"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={u.displayName}
                      color={u.avatarColor}
                      size={30}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-zinc-100">
                          {u.displayName}
                        </span>
                        {u.isAdmin && (
                          <Tag tone="accent">{m.admin.badge}</Tag>
                        )}
                        {u.blocked && <Tag tone="violet">{m.admin.blocked}</Tag>}
                      </div>
                      <div className="font-mono text-xs text-zinc-500">
                        @{u.username} · {m.labels.roles[u.role] ?? u.role}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {u.email ?? (
                    <span className="text-zinc-600">{m.admin.noEmail}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-400">
                  {u._count.projects} / {u._count.bounties}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {timeAgo(u.createdAt, locale)}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.isAdmin ? (
                    <span className="text-xs text-zinc-600">
                      {m.admin.protectedTip}
                    </span>
                  ) : u.blocked ? (
                    <form action={setUserBlocked.bind(null, u.id, false)}>
                      <button
                        type="submit"
                        className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-400/20"
                      >
                        {m.admin.unblock}
                      </button>
                    </form>
                  ) : (
                    <form action={setUserBlocked.bind(null, u.id, true)}>
                      <button
                        type="submit"
                        className="rounded-md border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs text-red-300 hover:bg-red-400/20"
                      >
                        {m.admin.block}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Agent 管理 */}
      <h2 className="mt-12 mb-4 text-lg font-semibold text-zinc-100">
        {m.moderation.agentMgmt}
        <span className="ml-2 text-sm font-normal text-zinc-500">
          {projects.length}
        </span>
      </h2>
      <div className="overflow-hidden rounded-xl border border-[#21262d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#21262d] bg-[#161b22] text-left text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.moderation.agentMgmt}</th>
              <th className="px-4 py-3 font-medium">{m.moderation.owner}</th>
              <th className="px-4 py-3 font-medium">★</th>
              <th className="px-4 py-3 font-medium">{m.moderation.visibility}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#21262d] last:border-0 hover:bg-[#161b22]/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/agents/${p.id}`}
                    className="font-mono text-zinc-100 hover:text-emerald-300"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-0.5 max-w-xs truncate text-xs text-zinc-500">
                    {p.tagline}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {p.owner.displayName}
                </td>
                <td className="px-4 py-3 font-mono text-zinc-400">
                  {p._count.stars}
                </td>
                <td className="px-4 py-3">
                  {p.visibility === "HIDDEN" ? (
                    <Tag tone="violet">{m.moderation.hidden}</Tag>
                  ) : (
                    <Tag tone="accent">{m.moderation.public}</Tag>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <form
                      action={setProjectVisibility.bind(
                        null,
                        p.id,
                        p.visibility === "HIDDEN" ? "PUBLIC" : "HIDDEN"
                      )}
                    >
                      <PendingSubmit
                        label={
                          p.visibility === "HIDDEN"
                            ? m.moderation.unhide
                            : m.moderation.hide
                        }
                        pendingLabel={m.common.submitting}
                        className="rounded-md border border-amber-400/40 px-3 py-1 text-xs text-amber-300 hover:bg-amber-400/10"
                      />
                    </form>
                    <form action={deleteProject.bind(null, p.id)}>
                      <DeleteButton
                        label={m.moderation.delete}
                        confirmText={m.moderation.confirmDelete}
                        className="rounded-md border border-red-400/40 px-3 py-1 text-xs text-red-300 hover:bg-red-400/10"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 悬赏管理 */}
      <h2 className="mt-12 mb-4 text-lg font-semibold text-zinc-100">
        {m.moderation.bountyMgmt}
        <span className="ml-2 text-sm font-normal text-zinc-500">
          {bounties.length}
        </span>
      </h2>
      <div className="overflow-hidden rounded-xl border border-[#21262d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#21262d] bg-[#161b22] text-left text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">{m.moderation.bountyMgmt}</th>
              <th className="px-4 py-3 font-medium">{m.moderation.owner}</th>
              <th className="px-4 py-3 font-medium">{m.bountyDetail.budget}</th>
              <th className="px-4 py-3 font-medium">{m.moderation.visibility}</th>
              <th className="px-4 py-3 font-medium">{m.escrow.status}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {bounties.map((b) => (
              <tr
                key={b.id}
                className="border-b border-[#21262d] last:border-0 hover:bg-[#161b22]/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/bounties/${b.id}`}
                    className="text-zinc-100 hover:text-violet-300"
                  >
                    {b.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {b._count.claims} {m.bounties.claims} · {timeAgo(b.createdAt, locale)}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {b.creator.displayName}
                </td>
                <td className="px-4 py-3 font-mono text-violet-300">
                  {formatBudget(b.budgetMin, b.budgetMax, b.currency)}
                </td>
                <td className="px-4 py-3">
                  {b.visibility === "HIDDEN" ? (
                    <Tag tone="violet">{m.moderation.hidden}</Tag>
                  ) : (
                    <Tag tone="accent">{m.moderation.public}</Tag>
                  )}
                </td>
                <td className="px-4 py-3">
                  {b.escrowStatus === "NONE" ? (
                    <span className="text-xs text-zinc-600">—</span>
                  ) : (
                    <Tag
                      tone={
                        b.escrowStatus === "RELEASED"
                          ? "accent"
                          : b.escrowStatus === "DEPOSITED"
                            ? "violet"
                            : "default"
                      }
                    >
                      {b.escrowStatus === "RELEASED"
                        ? m.escrow.released
                        : b.escrowStatus === "DEPOSITED"
                          ? m.escrow.deposited
                          : m.escrow.awaiting}
                    </Tag>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {b.escrowStatus === "AWAITING" && (
                      <form
                        action={setEscrowStatus.bind(null, b.id, "DEPOSITED")}
                      >
                        <PendingSubmit
                          label={m.escrow.markDeposited}
                          pendingLabel={m.common.submitting}
                          className="rounded-md border border-emerald-400/40 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10"
                        />
                      </form>
                    )}
                    {b.escrowStatus === "DEPOSITED" && (
                      <form
                        action={setEscrowStatus.bind(null, b.id, "RELEASED")}
                      >
                        <PendingSubmit
                          label={m.escrow.markReleased}
                          pendingLabel={m.common.submitting}
                          className="rounded-md border border-emerald-400/40 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10"
                        />
                      </form>
                    )}
                    <form
                      action={setBountyVisibility.bind(
                        null,
                        b.id,
                        b.visibility === "HIDDEN" ? "PUBLIC" : "HIDDEN"
                      )}
                    >
                      <PendingSubmit
                        label={
                          b.visibility === "HIDDEN"
                            ? m.moderation.unhide
                            : m.moderation.hide
                        }
                        pendingLabel={m.common.submitting}
                        className="rounded-md border border-amber-400/40 px-3 py-1 text-xs text-amber-300 hover:bg-amber-400/10"
                      />
                    </form>
                    <form action={deleteBounty.bind(null, b.id)}>
                      <DeleteButton
                        label={m.moderation.delete}
                        confirmText={m.moderation.confirmDelete}
                        className="rounded-md border border-red-400/40 px-3 py-1 text-xs text-red-300 hover:bg-red-400/10"
                      />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
