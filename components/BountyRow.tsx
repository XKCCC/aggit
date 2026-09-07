import Link from "next/link";
import type { Prisma } from "@prisma/client";
import Tag from "./Tag";
import { BOUNTY_STATUS } from "@/lib/constants";
import { formatBudget, timeAgo } from "@/lib/format";
import { getI18n } from "@/lib/i18n";

type BountyRowData = Prisma.BountyGetPayload<{
  include: {
    creator: true;
    project: true;
    _count: { select: { claims: true } };
  };
}>;

export default async function BountyRow({ bounty }: { bounty: BountyRowData }) {
  const { locale, m } = await getI18n();
  const status = BOUNTY_STATUS[bounty.status] ?? BOUNTY_STATUS.OPEN;
  const statusLabel =
    m.labels.bountyStatus[bounty.status] ?? status.label;
  const tags = bounty.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <Link
      href={`/bounties/${bounty.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-[#21262d] bg-[#0d1117] p-4 transition-colors hover:border-violet-400/40 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${status.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {statusLabel}
          </span>
          <h3 className="truncate font-medium text-zinc-100 group-hover:text-violet-300">
            {bounty.title}
          </h3>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {bounty.project && (
            <Tag tone="accent">
              <span className="font-mono">{bounty.project.name}</span>
            </Tag>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-xs text-zinc-500 sm:flex-col sm:items-end sm:gap-1">
        <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-1 font-mono text-sm font-semibold text-violet-300">
          {formatBudget(bounty.budgetMin, bounty.budgetMax, bounty.currency)}
        </span>
        <span>
          {bounty._count.claims} {m.bounties.claims} · {bounty.creator.displayName} ·{" "}
          {timeAgo(bounty.createdAt, locale)}
        </span>
      </div>
    </Link>
  );
}
