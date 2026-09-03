"use client";

import { useActionState, useEffect, useState } from "react";
import { passwordLogin, register } from "@/lib/actions/auth";
import { getCaptcha } from "@/lib/actions/captcha";
import type { Messages } from "@/lib/i18n";

type Labels = Messages["login"];

const inputCls =
  "w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50";
const labelCls = "mb-1.5 block text-sm font-medium text-zinc-300";

export default function AuthForms({ labels }: { labels: Labels }) {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-6">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-[#0d1117] p-1 text-sm">
        {(
          [
            ["login", labels.tabLogin],
            ["register", labels.tabRegister],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md py-1.5 transition-colors ${
              tab === key
                ? "bg-emerald-500 font-medium text-[#0d1117]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
      {tab === "login" ? (
        <LoginForm labels={labels} />
      ) : (
        <RegisterForm labels={labels} />
      )}
    </div>
  );
}

function ErrorTip({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
      {text}
    </p>
  );
}

function errorText(labels: Labels, key?: string) {
  if (!key) return undefined;
  return labels.errors[key as keyof typeof labels.errors] ?? key;
}

function LoginForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState(passwordLogin, {});
  return (
    <form action={action} className="space-y-4">
      <ErrorTip text={errorText(labels, state.error)} />
      <div>
        <label className={labelCls}>{labels.loginId}</label>
        <input
          name="loginId"
          required
          placeholder={labels.loginIdPlaceholder}
          autoComplete="username"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{labels.password}</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-[#0d1117] hover:bg-emerald-400 disabled:opacity-50"
      >
        {labels.loginSubmit}
      </button>
    </form>
  );
}

function RegisterForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState(register, {});
  const [cap, setCap] = useState<{ token: string; question: string } | null>(
    null
  );

  useEffect(() => {
    getCaptcha().then(setCap);
  }, []);

  return (
    <form action={action} className="space-y-4">
      <ErrorTip text={errorText(labels, state.error)} />

      {/* 蜜罐字段：对正常用户不可见，机器人填了即被静默丢弃 */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{labels.username}</label>
          <input
            name="username"
            required
            placeholder={labels.usernamePlaceholder}
            autoComplete="username"
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label className={labelCls}>{labels.displayName}</label>
          <input
            name="displayName"
            required
            placeholder={labels.displayNamePlaceholder}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>{labels.email}</label>
        <input
          name="email"
          type="email"
          required
          placeholder={labels.emailPlaceholder}
          autoComplete="email"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>{labels.role}</label>
        <select name="role" className={inputCls} defaultValue="DEVELOPER">
          <option value="DEVELOPER">{labels.roleDev}</option>
          <option value="EMPLOYER">{labels.roleEmp}</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{labels.password}</label>
          <input
            name="password"
            type="password"
            required
            placeholder={labels.passwordPlaceholder}
            autoComplete="new-password"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{labels.passwordConfirm}</label>
          <input
            name="password2"
            type="password"
            required
            autoComplete="new-password"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>{labels.captcha}</label>
        <input type="hidden" name="captchaToken" value={cap?.token ?? ""} />
        <div className="flex items-center gap-2">
          <span className="flex h-9 shrink-0 items-center rounded-lg border border-[#30363d] bg-[#0d1117] px-3 font-mono text-sm font-semibold tracking-wider text-emerald-300 select-none">
            {cap?.question ?? "…"}
          </span>
          <input
            name="captcha"
            required
            inputMode="numeric"
            placeholder={labels.captchaPlaceholder}
            autoComplete="off"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => getCaptcha().then(setCap)}
            className="shrink-0 rounded-lg border border-[#30363d] px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            {labels.captchaRefresh}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || !cap}
        className="w-full rounded-lg bg-emerald-500 py-2.5 font-medium text-[#0d1117] hover:bg-emerald-400 disabled:opacity-50"
      >
        {labels.registerSubmit}
      </button>
    </form>
  );
}
