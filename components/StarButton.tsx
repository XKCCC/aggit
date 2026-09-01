"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleStar } from "@/lib/actions/project";

export default function StarButton({
  projectId,
  count,
  starred,
  labels,
}: {
  projectId: string;
  count: number;
  starred: boolean;
  labels: { star: string; starred: string };
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleStar(projectId);
          router.refresh();
        })
      }
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
        starred
          ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
          : "border-[#30363d] bg-[#161b22] text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
      }`}
    >
      <span aria-hidden>★</span>
      {starred ? labels.starred : labels.star}
      <span className="text-zinc-500">· {count}</span>
    </button>
  );
}
