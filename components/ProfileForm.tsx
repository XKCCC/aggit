"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import Avatar from "./Avatar";
import type { Messages } from "@/lib/i18n";

const COLORS = [
  "#10b981",
  "#38bdf8",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#34d399",
  "#f472b6",
  "#60a5fa",
];

const inputCls =
  "w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50";

export default function ProfileForm({
  labels,
  user,
}: {
  labels: Messages["dashboard"];
  user: {
    displayName: string;
    avatarColor: string;
    avatarUrl: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const [name, setName] = useState(user.displayName);
  const [color, setColor] = useState(user.avatarColor);
  const [url, setUrl] = useState(user.avatarUrl ?? "");

  return (
    <form action={action} className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-200">{labels.profile}</h3>

      {state.ok && (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
          {labels.saved}
        </p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {labels.formatError}
        </p>
      )}

      <div className="flex items-center gap-4">
        <Avatar name={name} color={color} size={56} avatarUrl={url || null} />
        <div className="flex-1 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              {labels.displayName}
            </label>
            <input
              name="displayName"
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          {labels.avatarColor}
        </label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label
              key={c}
              className={`h-8 w-8 cursor-pointer rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? "border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            >
              <input
                type="radio"
                name="avatarColor"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          {labels.avatarUrl}
        </label>
        <input
          name="avatarUrl"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://avatars.githubusercontent.com/u/..."
          className={`${inputCls} font-mono text-xs`}
        />
        <p className="mt-1.5 text-xs text-zinc-600">{labels.avatarUrlHint}</p>
      </div>

      <div className="text-right">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-[#0d1117] hover:bg-emerald-400 disabled:opacity-50"
        >
          {labels.save}
        </button>
      </div>
    </form>
  );
}
