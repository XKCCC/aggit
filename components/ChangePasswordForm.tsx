"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/auth";
import type { Messages } from "@/lib/i18n";

const inputCls =
  "w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50";

export default function ChangePasswordForm({
  labels,
  errors,
}: {
  labels: Messages["dashboard"];
  errors: Messages["login"]["errors"];
}) {
  const [state, action, pending] = useActionState(changePassword, {});

  return (
    <form action={action} className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-200">
        {labels.changePassword}
      </h3>
      {state.ok && (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
          {labels.pwdChanged}
        </p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {errors[state.error as keyof typeof errors] ?? state.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          name="oldPassword"
          type="password"
          required
          placeholder={labels.oldPassword}
          autoComplete="current-password"
          className={inputCls}
        />
        <input
          name="newPassword"
          type="password"
          required
          placeholder={labels.newPassword}
          autoComplete="new-password"
          className={inputCls}
        />
        <input
          name="newPassword2"
          type="password"
          required
          placeholder={labels.newPassword2}
          autoComplete="new-password"
          className={inputCls}
        />
      </div>
      <div className="text-right">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-[#30363d] px-4 py-1.5 text-sm text-zinc-300 hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-50"
        >
          {labels.changePassword}
        </button>
      </div>
    </form>
  );
}
