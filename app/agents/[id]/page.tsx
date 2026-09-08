import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Tag from "@/components/Tag";
import FounderBadge from "@/components/FounderBadge";
import Markdown from "@/components/Markdown";
import StarButton from "@/components/StarButton";
import CommentSection from "@/components/CommentSection";
import PendingSubmit from "@/components/PendingSubmit";
import DeleteButton from "@/components/DeleteButton";
import {
  setProjectVisibility,
  deleteProject,
} from "@/lib/actions/moderation";
import {
  setProjectClaimable,
  claimProject,
  setProjectShowcase,
} from "@/lib/actions/project";
import { parseGithubUrl } from "@/lib/github";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, m } = await getI18n();
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { stars: true } },
    },
  });
  if (!project) notFound();

  const isOwner = user?.id === project.ownerId;
  const isAdmin = !!user?.isAdmin;
  // 隐藏项目仅作者本人与管理员可见
  if (project.visibility === "HIDDEN" && !isOwner && !isAdmin) notFound();

  // 认领资格：项目待认领 + 用户 GitHub 登录名与仓库所有者一致
  const repoOwner = project.repoUrl
    ? parseGithubUrl(project.repoUrl)?.owner
    : undefined;
  const canClaim =
    project.claimable &&
    !!user?.githubLogin &&
    !!repoOwner &&
    user.githubLogin.toLowerCase() === repoOwner.toLowerCase();

  const starred = user
    ? !!(await prisma.star.findUnique({
        where: { userId_projectId: { userId: user.id, projectId: id } },
      }))
    : false;

  const infoRows: Array<[string, string]> = [
    [
      m.agents.kind,
      project.kind === "COMPONENT"
        ? m.agents.kindComponent
        : project.kind === "BENCHMARK"
          ? m.agents.kindBenchmark
          : m.agents.kindAgent,
    ],
    [
      m.agentDetail.framework,
      m.labels.frameworks[project.framework] ?? project.framework,
    ],
    [m.agentDetail.language, project.language],
    [
      m.agentDetail.scenario,
      m.labels.scenarios[project.scenario] ?? project.scenario,
    ],
    [
      m.agentDetail.license,
      m.labels.options[project.licenseType] ?? project.licenseType,
    ],
    [
      m.agentDetail.openType,
      m.labels.openTypes[project.openType] ?? project.openType,
    ],
    [m.agentDetail.createdAt, timeAgo(project.createdAt, locale)],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/agents" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← {m.nav.explore}
      </Link>

      {/* 头部 */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-[#21262d] pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-zinc-50">
              {project.name}
            </h1>
            <Tag tone={project.openType === "FULL" ? "accent" : "violet"}>
              {m.labels.openTypes[project.openType] ?? project.openType}
            </Tag>
            {project.kind !== "AGENT" && (
              <Tag>
                {project.kind === "COMPONENT"
                  ? m.agents.kindComponent
                  : project.kind === "BENCHMARK"
                    ? m.agents.kindBenchmark
                    : project.kind}
              </Tag>
            )}
            {project.claimable && <Tag tone="accent">{m.claim.badge}</Tag>}
            {project.visibility === "HIDDEN" && (
              <Tag tone="violet">{m.moderation.hidden}</Tag>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {project.tagline}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
            <Avatar
              name={project.owner.displayName}
              color={project.owner.avatarColor}
              size={22}
              avatarUrl={project.owner.avatarUrl}
            />
            <span className="text-zinc-300">{project.owner.displayName}</span>
            {project.owner.isFounder && <FounderBadge title={m.founder.badge} />}
            <span className="font-mono text-xs">
              @{project.owner.username}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StarButton
            projectId={project.id}
            count={project._count.stars}
            starred={starred}
            labels={{ star: m.agentDetail.star, starred: m.agentDetail.starred }}
          />
          <Link
            href={`/bounties/new?project=${project.id}`}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
          >
            {m.agentDetail.requestCustom}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* 主栏：README + 讨论 */}
        <div className="min-w-0">
          <div className="rounded-xl border border-[#21262d] bg-[#0d1117] p-6">
            <Markdown content={project.readme} />
          </div>

          <CommentSection
            comments={project.comments}
            projectId={project.id}
            loggedIn={!!user}
            labels={{
              title: m.agentDetail.discussion,
              placeholder: m.agentDetail.commentPlaceholder,
              submit: m.agentDetail.commentSubmit,
              loginToComment: m.agentDetail.loginToComment,
              empty: m.agentDetail.emptyComments,
            }}
          />
        </div>

        {/* 侧栏：项目信息 */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <h2 className="text-sm font-semibold text-zinc-200">
              {m.agentDetail.info}
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              {infoRows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-zinc-500">{k}</dt>
                  <dd className="text-right text-zinc-300">{v}</dd>
                </div>
              ))}
            </dl>
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-lg border border-[#30363d] px-3 py-2 text-center font-mono text-xs text-emerald-300 hover:border-emerald-400/40"
              >
                ↗ {m.agentDetail.repo}
              </a>
            )}
          </div>

          {/* 待认领面板：原作者 GitHub 登录后一键过户 */}
          {project.claimable && (
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
              <h2 className="text-sm font-semibold text-sky-300">
                {m.claim.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {m.claim.hint}
              </p>
              {user ? (
                canClaim ? (
                  <>
                    <p className="mt-3 text-xs text-sky-300">{m.claim.match}</p>
                    <form
                      action={claimProject.bind(null, project.id)}
                      className="mt-3"
                    >
                      <PendingSubmit
                        label={m.claim.claim}
                        pendingLabel={m.common.submitting}
                        className="w-full rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-sky-400"
                      />
                    </form>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">
                    {user.githubLogin ? m.claim.mismatch : m.claim.needGithub}
                  </p>
                )
              ) : (
                <a
                  href="/api/auth/github"
                  className="mt-3 block rounded-md bg-sky-500 px-3 py-1.5 text-center text-sm font-medium text-[#0d1117] hover:bg-sky-400"
                >
                  {m.claim.loginFirst}
                </a>
              )}
            </div>
          )}

          {/* 作者 / 管理员：可见性与删除 */}
          {(isOwner || isAdmin) && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
              <h2 className="text-sm font-semibold text-amber-300">
                {m.moderation.manage}
              </h2>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-zinc-400">{m.moderation.visibility}</span>
                <span
                  className={
                    project.visibility === "HIDDEN"
                      ? "text-amber-300"
                      : "text-emerald-300"
                  }
                >
                  {project.visibility === "HIDDEN"
                    ? m.moderation.hidden
                    : m.moderation.public}
                </span>
              </div>
              <form
                action={setProjectVisibility.bind(
                  null,
                  project.id,
                  project.visibility === "HIDDEN" ? "PUBLIC" : "HIDDEN"
                )}
                className="mt-3"
              >
                <PendingSubmit
                  label={
                    project.visibility === "HIDDEN"
                      ? m.moderation.unhide
                      : m.moderation.hide
                  }
                  pendingLabel={m.common.submitting}
                  className="w-full rounded-md border border-amber-400/40 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-400/10"
                />
              </form>
              {isAdmin && (
                <>
                  <form
                    action={setProjectClaimable.bind(
                      null,
                      project.id,
                      !project.claimable
                    )}
                    className="mt-2"
                  >
                    <PendingSubmit
                      label={
                        project.claimable
                          ? m.claim.unmarkClaimable
                          : m.claim.markClaimable
                      }
                      pendingLabel={m.common.submitting}
                      className="w-full rounded-md border border-sky-400/40 px-3 py-1.5 text-sm text-sky-300 hover:bg-sky-400/10"
                    />
                  </form>
                  <form
                    action={setProjectShowcase.bind(
                      null,
                      project.id,
                      !project.showcase
                    )}
                    className="mt-2"
                  >
                    <PendingSubmit
                      label={
                        project.showcase
                          ? m.showcase.unmark
                          : m.showcase.mark
                      }
                      pendingLabel={m.common.submitting}
                      className="w-full rounded-md border border-emerald-400/40 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-400/10"
                    />
                  </form>
                  <form
                    action={deleteProject.bind(null, project.id)}
                    className="mt-2"
                  >
                    <DeleteButton
                      label={m.moderation.delete}
                      confirmText={m.moderation.confirmDelete}
                      className="w-full rounded-md border border-red-400/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-400/10"
                    />
                  </form>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
