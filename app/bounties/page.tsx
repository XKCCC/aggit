import Link from "next/link";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n";
import BountyRow from "@/components/BountyRow";
import { BOUNTY_STATUS } from "@/lib/constants";

export default async function BountiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { m } = await getI18n();
  const status = sp.status ?? "";

  const bounties = await prisma.bounty.findMany({
    where: status ? { status } : {},
    include: {
      creator: true,
      project: true,
      _count: { select: { claims: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tabs = [
    { key: "", label: m.bounties.statusAll },
    ...Object.entries(BOUNTY_STATUS).map(([key, v]) => ({
      key,
      label: v.label,
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">
            {m.bounties.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{m.bounties.subtitle}</p>
        </div>
        <Link
          href="/bounties/new"
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-[#0d1117] hover:bg-violet-400"
        >
          {m.bounties.post}
        </Link>
      </div>

      <div className="mt-6 flex gap-2 border-b border-[#21262d] pb-3">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/bounties?status=${t.key}` : "/bounties"}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              status === t.key
                ? "border-violet-400/50 bg-violet-400/10 text-violet-300"
                : "border-[#30363d] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {bounties.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-[#30363d] p-12 text-center text-sm text-zinc-500">
          {m.bounties.empty}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {bounties.map((b) => (
            <BountyRow key={b.id} bounty={b} />
          ))}
        </div>
      )}
    </div>
  );
}
