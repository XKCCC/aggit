import type { Prisma } from "@prisma/client";
import Link from "next/link";
import Avatar from "./Avatar";
import { addComment } from "@/lib/actions/comment";
import { timeAgo } from "@/lib/format";

type CommentData = Prisma.CommentGetPayload<{ include: { user: true } }>;

export default function CommentSection({
  comments,
  bountyId,
  projectId,
  loggedIn,
  labels,
}: {
  comments: CommentData[];
  bountyId?: string;
  projectId?: string;
  loggedIn: boolean;
  labels: {
    title: string;
    placeholder: string;
    submit: string;
    loginToComment: string;
    empty: string;
  };
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">
        {labels.title}
        <span className="ml-2 text-sm font-normal text-zinc-500">
          {comments.length}
        </span>
      </h2>

      {loggedIn ? (
        <form
          action={addComment}
          className="rounded-xl border border-[#21262d] bg-[#0d1117] p-4"
        >
          {bountyId && <input type="hidden" name="bountyId" value={bountyId} />}
          {projectId && (
            <input type="hidden" name="projectId" value={projectId} />
          )}
          <textarea
            name="body"
            required
            rows={3}
            placeholder={labels.placeholder}
            className="w-full resize-y rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50"
          />
          <div className="mt-3 text-right">
            <button
              type="submit"
              className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-emerald-400"
            >
              {labels.submit}
            </button>
          </div>
        </form>
      ) : (
        <Link
          href="/login"
          className="block rounded-xl border border-dashed border-[#30363d] p-4 text-center text-sm text-zinc-500 hover:border-emerald-400/40 hover:text-emerald-300"
        >
          {labels.loginToComment} →
        </Link>
      )}

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">{labels.empty}</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar
                name={c.user.displayName}
                color={c.user.avatarColor}
                size={32}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {c.user.displayName}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-400">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
