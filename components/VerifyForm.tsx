"use client";

import { useActionState } from "react";
import { verifyEmail, resendCode } from "@/lib/actions/verify";
import type { Messages } from "@/lib/i18n";

const inputCls =
  "w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50";

export default function VerifyForm({
  email,
  labels,
}: {
  email: string;
  labels: Messages["verify"];
}) {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmail,
    {}
  );
  const [resendState, resendAction, resending] = useActionState(
    resendCode,
    {}
  );

  return (
    <div className="space-y-4">
      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        {verifyState.error && (
          <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
            {labels.errorCode}
          </p>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            {labels.codeLabel}
          </label>
          <input
            name="code"
            required
            inputMode="numeric"
            maxLength={6}
            placeholder={labels.codePlaceholder}
            autoComplete="one-time-code"
            className={`${inputCls} text-center font-mono text-lg tracking-[0.5em]`}
          />
          <p className="mt-1.5 text-xs text-zinc-600">{labels.tip}</p>
        </div>
        <button
          type="submit"
          disabled={verifying}
          className="w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-[#0d1117] hover:bg-emerald-400 disabled:opacity-50"
        >
          {labels.submit}
        </button>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={resending}
          className="text-xs text-zinc-500 hover:text-emerald-300 disabled:opacity-50"
        >
          {labels.resend}
        </button>
        {resendState.ok && (
          <span className="ml-2 text-xs text-emerald-400">
            {labels.resent}
          </span>
        )}
        {resendState.error === "ratelimit" && (
          <span className="ml-2 text-xs text-amber-400">
            {labels.errorRatelimit}
          </span>
        )}
      </form>
    </div>
  );
}
