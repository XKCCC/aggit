import type { ReactNode } from "react";

export default function Tag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "violet";
}) {
  const cls =
    tone === "accent"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : tone === "violet"
        ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
        : "border-[#30363d] bg-[#161b22] text-zinc-400";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${cls}`}
    >
      {children}
    </span>
  );
}
