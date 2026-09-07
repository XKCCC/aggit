import Link from "next/link";
import type { Prisma } from "@prisma/client";
import Avatar from "./Avatar";
import Tag from "./Tag";
import { timeAgo } from "@/lib/format";
import { getI18n } from "@/lib/i18n";

type ProjectCardData = Prisma.ProjectGetPayload<{
  include: { owner: true; _count: { select: { stars: true } } };
}>;

export default async function ProjectCard({
  project,
}: {
  project: ProjectCardData;
}) {
  const { locale, m } = await getI18n();
  return (
    <Link
      href={`/agents/${project.id}`}
      className="group flex flex-col rounded-xl border border-[#21262d] bg-[#0d1117] p-5 transition-colors hover:border-emerald-400/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-base font-semibold text-zinc-100 group-hover:text-emerald-300">
          {project.name}
        </h3>
        <div className="flex shrink-0 gap-1.5">
          {project.kind === "COMPONENT" && <Tag>{m.agents.kindComponent}</Tag>}
          <Tag tone={project.openType === "FULL" ? "accent" : "violet"}>
            {m.labels.openTypes[project.openType] ?? project.openType}
          </Tag>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-zinc-400">
        {project.tagline}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag>{m.labels.frameworks[project.framework] ?? project.framework}</Tag>
        <Tag>{project.language}</Tag>
        <Tag>{m.labels.scenarios[project.scenario] ?? project.scenario}</Tag>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-[#21262d] pt-3 text-xs text-zinc-500">
        <Avatar
          name={project.owner.displayName}
          color={project.owner.avatarColor}
          size={20}
        />
        <span className="text-zinc-400">{project.owner.displayName}</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="text-amber-300">★</span>
          {project._count.stars}
        </span>
        <span>· {timeAgo(project.createdAt, locale)}</span>
      </div>
    </Link>
  );
}
