"use client";

import { useState, useTransition } from "react";
import { createProject, importGithubRepo } from "@/lib/actions/project";
import { FRAMEWORKS, LANGUAGES, SCENARIOS } from "@/lib/constants";
import type { Messages } from "@/lib/i18n";
import PendingSubmit from "./PendingSubmit";

const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "其他"];

export default function AgentForm({
  labels,
  submittingLabel,
}: {
  labels: Messages["agentNew"];
  submittingLabel: string;
}) {
  const [ghUrl, setGhUrl] = useState("");
  const [importMsg, setImportMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [importing, startImport] = useTransition();

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const [repoUrl, setRepoUrl] = useState("");
  const [readme, setReadme] = useState("");

  const inputCls =
    "w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50";
  const labelCls = "mb-1.5 block text-sm font-medium text-zinc-300";

  return (
    <div className="space-y-8">
      {/* GitHub 导入 */}
      <section className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
        <h2 className="text-sm font-semibold text-zinc-200">
          {labels.importTitle}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{labels.importHint}</p>
        <div className="mt-3 flex gap-2">
          <input
            value={ghUrl}
            onChange={(e) => setGhUrl(e.target.value)}
            placeholder={labels.importPlaceholder}
            className={`${inputCls} font-mono`}
          />
          <button
            type="button"
            disabled={importing || !ghUrl.trim()}
            onClick={() =>
              startImport(async () => {
                setImportMsg(null);
                const res = await importGithubRepo(ghUrl);
                if (res.error || !res.data) {
                  setImportMsg({ text: res.error ?? "failed", ok: false });
                } else {
                  setName(res.data.name);
                  setTagline(res.data.description);
                  setRepoUrl(res.data.repoUrl);
                  setReadme(res.data.readme);
                  if (
                    (LANGUAGES as readonly string[]).includes(
                      res.data.language
                    )
                  ) {
                    setLanguage(res.data.language);
                  }
                  setImportMsg({
                    text: `✓ ${res.data.name} · ★${res.data.stars}`,
                    ok: true,
                  });
                }
              })
            }
            className="shrink-0 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 text-sm text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50"
          >
            {importing ? labels.importing : labels.importButton}
          </button>
        </div>
        {importMsg && (
          <p
            className={`mt-2 font-mono text-xs ${importMsg.ok ? "text-emerald-400" : "text-red-400"}`}
          >
            {importMsg.text}
          </p>
        )}
      </section>

      {/* 项目信息表单 */}
      <form action={createProject} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{labels.name} *</label>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls}>{labels.repoUrl}</label>
            <input
              name="repoUrl"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>{labels.tagline} *</label>
          <input
            name="tagline"
            required
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={labels.taglinePlaceholder}
            className={inputCls}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className={labelCls}>{labels.framework}</label>
            <select name="framework" className={inputCls} defaultValue={FRAMEWORKS[0]}>
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{labels.language}</label>
            <select
              name="language"
              className={inputCls}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{labels.scenario}</label>
            <select name="scenario" className={inputCls} defaultValue={SCENARIOS[0]}>
              {SCENARIOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>{labels.openType}</label>
            <div className="flex gap-4 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="radio"
                  name="openType"
                  value="FULL"
                  defaultChecked
                  className="accent-emerald-400"
                />
                {labels.openFull}
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="radio"
                  name="openType"
                  value="DOCS_ONLY"
                  className="accent-violet-400"
                />
                {labels.openDocs}
              </label>
            </div>
          </div>
          <div>
            <label className={labelCls}>{labels.license}</label>
            <select name="licenseType" className={inputCls} defaultValue="MIT">
              {LICENSES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>{labels.readme} *</label>
          <textarea
            name="readme"
            required
            rows={14}
            value={readme}
            onChange={(e) => setReadme(e.target.value)}
            placeholder={labels.readmeHint}
            className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
          />
        </div>

        <div className="flex justify-end border-t border-[#21262d] pt-5">
          <PendingSubmit
            label={labels.submit}
            pendingLabel={submittingLabel}
            className="rounded-lg bg-emerald-500 px-6 py-2.5 font-medium text-[#0d1117] hover:bg-emerald-400"
          />
        </div>
      </form>
    </div>
  );
}
