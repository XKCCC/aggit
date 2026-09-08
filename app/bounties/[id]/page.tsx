import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { BOUNTY_STATUS, CLAIM_STATUS } from "@/lib/constants";
import { formatBudget, timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Tag from "@/components/Tag";
import FounderBadge from "@/components/FounderBadge";
import Markdown from "@/components/Markdown";
import CommentSection from "@/components/CommentSection";
import PendingSubmit from "@/components/PendingSubmit";
import DeleteButton from "@/components/DeleteButton";
import { PLATFORM } from "@/lib/payment";
import {
  setBountyVisibility,
  deleteBounty,
} from "@/lib/actions/moderation";
import {
  claimBounty,
  submitClaim,
  acceptClaim,
  cancelBounty,
} from "@/lib/actions/bounty";

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, m } = await getI18n();
  const user = await getCurrentUser();

  const bounty = await prisma.bounty.findUnique({
    where: { id },
    include: {
      creator: true,
      project: { include: { owner: true } },
      claims: {
        include: { developer: true },
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!bounty) notFound();

  const status = BOUNTY_STATUS[bounty.status] ?? BOUNTY_STATUS.OPEN;
  const tags = bounty.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const isCreator = user?.id === bounty.creatorId;
  const isAdmin = !!user?.isAdmin;
  // 隐藏或待付定金的悬赏仅发布方与管理员可见
  if (
    (bounty.visibility === "HIDDEN" || bounty.status === "PENDING") &&
    !isCreator &&
    !isAdmin
  ) {
    notFound();
  }
  const myClaim = user
    ? bounty.claims.find((c) => c.developerId === user.id)
    : undefined;
  const canClaim = !!user && !isCreator && bounty.status === "OPEN";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/bounties"
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        ← {m.nav.bounties}
      </Link>

      {/* 头部 */}
      <div className="mt-3 border-b border-[#21262d] pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${status.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {m.labels.bountyStatus[bounty.status] ?? status.label}
          </span>
          {bounty.visibility === "HIDDEN" && (
            <Tag tone="violet">{m.moderation.hidden}</Tag>
          )}
          <h1 className="text-2xl font-bold text-zinc-50">{bounty.title}</h1>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
          <span className="font-mono text-lg font-semibold text-violet-300">
            {formatBudget(bounty.budgetMin, bounty.budgetMax, bounty.currency)}
          </span>
          <span className="flex items-center gap-1.5">
            <Avatar
              name={bounty.creator.displayName}
              color={bounty.creator.avatarColor}
              size={20}
              avatarUrl={bounty.creator.avatarUrl}
            />
            {bounty.creator.displayName}
            {bounty.creator.isFounder && (
              <FounderBadge title={m.founder.badge} />
            )}
          </span>
          <span>
            {m.bountyDetail.createdAt} · {timeAgo(bounty.createdAt, locale)}
          </span>
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {/* 需求描述 */}
          <div className="rounded-xl border border-[#21262d] bg-[#0d1117] p-6">
            <Markdown content={bounty.description} />
          </div>

          {/* 认领列表 */}
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">
              {m.bountyDetail.claims}
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {bounty.claims.length}
              </span>
            </h2>
            {bounty.claims.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#30363d] p-6 text-center text-sm text-zinc-500">
                {m.bountyDetail.noClaims}
              </p>
            ) : (
              <ul className="space-y-3">
                {bounty.claims.map((claim) => {
                  const cs = CLAIM_STATUS[claim.status] ?? CLAIM_STATUS.ACTIVE;
                  return (
                    <li
                      key={claim.id}
                      className="rounded-xl border border-[#21262d] bg-[#161b22] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Avatar
                          name={claim.developer.displayName}
                          color={claim.developer.avatarColor}
                          size={26}
                          avatarUrl={claim.developer.avatarUrl}
                        />
                        <span className="text-sm font-medium text-zinc-200">
                          {claim.developer.displayName}
                        </span>
                        {claim.developer.isFounder && (
                          <FounderBadge title={m.founder.badge} />
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${cs.badge}`}
                        >
                          {m.labels.claimStatus[claim.status] ?? cs.label}
                        </span>
                        <span className="ml-auto text-xs text-zinc-600">
                          {timeAgo(claim.createdAt, locale)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-400">
                        {claim.message}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {isCreator &&
                          bounty.status === "OPEN" &&
                          claim.status === "SUBMITTED" && (
                            <form action={acceptClaim.bind(null, claim.id)}>
                              <PendingSubmit
                                label={m.bountyDetail.accept}
                                pendingLabel={m.common.submitting}
                                className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-medium text-[#0d1117] hover:bg-emerald-400"
                              />
                            </form>
                          )}
                        {user?.id === claim.developerId &&
                          claim.status === "ACTIVE" && (
                            <form action={submitClaim.bind(null, claim.id)}>
                              <PendingSubmit
                                label={m.bountyDetail.markDelivered}
                                pendingLabel={m.common.submitting}
                                className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 hover:bg-amber-400/20"
                              />
                            </form>
                          )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* 认领入口 */}
            {canClaim && !myClaim && (
              <form
                action={claimBounty}
                className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4"
              >
                <input type="hidden" name="bountyId" value={bounty.id} />
                <h3 className="text-sm font-semibold text-emerald-300">
                  {m.bountyDetail.claimTitle}
                </h3>
                <textarea
                  name="message"
                  required
                  rows={3}
                  placeholder={m.bountyDetail.claimPlaceholder}
                  className="mt-3 w-full resize-y rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50"
                />
                <div className="mt-3 text-right">
                  <PendingSubmit
                    label={m.bountyDetail.claimSubmit}
                    pendingLabel={m.common.submitting}
                    className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
                  />
                </div>
              </form>
            )}
            {canClaim && myClaim && (
              <p className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm text-sky-300">
                {m.bountyDetail.alreadyClaimed} ·{" "}
                {m.labels.claimStatus[myClaim.status] ??
                  (CLAIM_STATUS[myClaim.status] ?? CLAIM_STATUS.ACTIVE).label}
              </p>
            )}
            {!user && bounty.status === "OPEN" && (
              <Link
                href="/login"
                className="mt-4 block rounded-xl border border-dashed border-[#30363d] p-4 text-center text-sm text-zinc-500 hover:border-emerald-400/40 hover:text-emerald-300"
              >
                {m.bountyDetail.loginToClaim} →
              </Link>
            )}
          </section>

          <CommentSection
            comments={bounty.comments}
            bountyId={bounty.id}
            loggedIn={!!user}
            labels={{
              title: m.bountyDetail.discussion,
              placeholder: m.bountyDetail.commentPlaceholder,
              submit: m.bountyDetail.commentSubmit,
              loginToComment: m.bountyDetail.loginToComment,
              empty: m.bountyDetail.emptyComments,
            }}
          />
        </div>

        {/* 侧栏 */}
        <aside className="space-y-4">
          {bounty.project && (
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
              <h2 className="text-xs font-medium text-zinc-500">
                {m.bountyDetail.linkedAgent}
              </h2>
              <Link
                href={`/agents/${bounty.project.id}`}
                className="mt-2 block font-mono text-sm font-semibold text-emerald-300 hover:underline"
              >
                {bounty.project.name}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {bounty.project.tagline}
              </p>
            </div>
          )}

          {isCreator && bounty.status === "OPEN" && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
              <form action={cancelBounty.bind(null, bounty.id)}>
                <PendingSubmit
                  label={m.bountyDetail.cancelBounty}
                  pendingLabel={m.common.submitting}
                  className="w-full rounded-md border border-red-400/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-400/10"
                />
              </form>
            </div>
          )}

          {/* 发布方：定金托管面板（待付定金 / 已完成） */}
          {isCreator &&
            (bounty.status === "PENDING" || bounty.status === "COMPLETED") && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                <h2 className="text-sm font-semibold text-emerald-300">
                  {m.escrow.title}
                </h2>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{m.escrow.status}</span>
                  <span className="text-emerald-300">
                    {bounty.escrowStatus === "RELEASED"
                      ? m.escrow.released
                      : bounty.escrowStatus === "DEPOSITED"
                        ? m.escrow.deposited
                        : m.escrow.awaiting}
                  </span>
                </div>
                {bounty.escrowStatus === "AWAITING" && (
                  <div className="mt-3">
                    <p className="text-xs leading-relaxed text-zinc-400">
                      {m.escrow.creatorTip}
                    </p>
                    <a
                      href={`mailto:${PLATFORM.contactEmail}?subject=${encodeURIComponent(`${m.escrow.mailSubject}: ${bounty.title}`)}`}
                      className="mt-3 block rounded-md bg-emerald-500 px-3 py-2 text-center text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
                    >
                      {m.escrow.contactLabel} · {PLATFORM.contactEmail}
                    </a>
                    <p className="mt-3 border-t border-emerald-400/10 pt-2 text-xs text-zinc-500">
                      {m.escrow.depositAmount}：
                      <span className="font-mono text-violet-300">
                        {formatBudget(
                          Math.round(bounty.budgetMin * 0.3),
                          Math.round(bounty.budgetMax * 0.3),
                          bounty.currency
                        )}
                      </span>
                      {" · "}
                      {m.escrow.commission} {PLATFORM.commissionRate * 100}%
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* 中标的开发者：托管状态提示 */}
          {myClaim?.status === "ACCEPTED" &&
            bounty.escrowStatus !== "NONE" && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                <h2 className="text-sm font-semibold text-emerald-300">
                  {m.escrow.title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {bounty.escrowStatus === "RELEASED"
                    ? m.escrow.devReleased
                    : bounty.escrowStatus === "DEPOSITED"
                      ? m.escrow.devDeposited
                      : m.escrow.awaiting}
                </p>
              </div>
            )}

          {/* 发布方 / 管理员：可见性与删除 */}
          {(isCreator || isAdmin) && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
              <h2 className="text-sm font-semibold text-amber-300">
                {m.moderation.manage}
              </h2>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-zinc-400">{m.moderation.visibility}</span>
                <span
                  className={
                    bounty.visibility === "HIDDEN"
                      ? "text-amber-300"
                      : "text-emerald-300"
                  }
                >
                  {bounty.visibility === "HIDDEN"
                    ? m.moderation.hidden
                    : m.moderation.public}
                </span>
              </div>
              <form
                action={setBountyVisibility.bind(
                  null,
                  bounty.id,
                  bounty.visibility === "HIDDEN" ? "PUBLIC" : "HIDDEN"
                )}
                className="mt-3"
              >
                <PendingSubmit
                  label={
                    bounty.visibility === "HIDDEN"
                      ? m.moderation.unhide
                      : m.moderation.hide
                  }
                  pendingLabel={m.common.submitting}
                  className="w-full rounded-md border border-amber-400/40 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-400/10"
                />
              </form>
              {isAdmin && (
                <form
                  action={deleteBounty.bind(null, bounty.id)}
                  className="mt-2"
                >
                  <DeleteButton
                    label={m.moderation.delete}
                    confirmText={m.moderation.confirmDelete}
                    className="w-full rounded-md border border-red-400/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-400/10"
                  />
                </form>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
