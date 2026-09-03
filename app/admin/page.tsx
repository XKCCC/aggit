import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { ROLES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Tag from "@/components/Tag";
import { setUserBlocked } from "@/lib/actions/admin";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) notFound();
  const { m } = await getI18n();

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { projects: true, bounties: true } },
    },
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
                        @{u.username} · {ROLES[u.role] ?? u.role}
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
                  {timeAgo(u.createdAt)}
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
    </div>
  );
}
