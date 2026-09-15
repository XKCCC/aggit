"use client";

import { useEffect, useRef, useState } from "react";

// ---------- Q 版机器人（SVG + CSS 动画） ----------
function RobotBuddy({ size = 64 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className="guide-robot"
      aria-hidden
    >
      <style>{`
        .guide-robot { overflow: visible; }
        .rb-body { animation: rb-bob 3s ease-in-out infinite; }
        @keyframes rb-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .rb-eye { transform-origin: center; animation: rb-blink 4s ease-in-out infinite; }
        @keyframes rb-blink { 0%, 92%, 100% { transform: scaleY(1); } 95%, 97% { transform: scaleY(0.1); } }
        .rb-ball { animation: rb-glow 2s ease-in-out infinite; }
        @keyframes rb-glow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .rb-arm-l { transform-origin: 22px 78px; animation: rb-wave 3.5s ease-in-out infinite; }
        @keyframes rb-wave { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-18deg); } }
      `}</style>
      <g className="rb-body">
        {/* 天线 */}
        <line x1="60" y1="18" x2="60" y2="32" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
        <circle className="rb-ball" cx="60" cy="13" r="6" fill="#34d399" />
        {/* 头 */}
        <rect x="25" y="32" width="70" height="52" rx="20" fill="#e8f0ee" stroke="#0d1117" strokeWidth="3" />
        {/* 眼睛 */}
        <g className="rb-eye">
          <circle cx="45" cy="55" r="7.5" fill="#0d1117" />
          <circle cx="47.5" cy="52.5" r="2.5" fill="#ffffff" />
        </g>
        <g className="rb-eye">
          <circle cx="75" cy="55" r="7.5" fill="#0d1117" />
          <circle cx="77.5" cy="52.5" r="2.5" fill="#ffffff" />
        </g>
        {/* 腮红 + 嘴 */}
        <circle cx="36" cy="67" r="4" fill="#f9a8d4" opacity="0.7" />
        <circle cx="84" cy="67" r="4" fill="#f9a8d4" opacity="0.7" />
        <path d="M50 68 Q60 77 70 68" stroke="#0d1117" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* 身体 */}
        <rect x="38" y="86" width="44" height="26" rx="12" fill="#34d399" stroke="#0d1117" strokeWidth="3" />
        <circle cx="60" cy="99" r="5" fill="#0d1117" />
        {/* 手臂 */}
        <g className="rb-arm-l">
          <rect x="14" y="72" width="14" height="7" rx="3.5" fill="#e8f0ee" stroke="#0d1117" strokeWidth="3" />
        </g>
        <rect x="92" y="72" width="14" height="7" rx="3.5" fill="#e8f0ee" stroke="#0d1117" strokeWidth="3" />
      </g>
    </svg>
  );
}

// ---------- 聊天主组件 ----------
interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  actions?: Array<{
    type: string;
    title: string;
    publishUrl: string;
  }>;
}

export default function GuideWidget({
  labels,
}: {
  labels: {
    name: string;
    tagline: string;
    welcome: string;
    suggestions: string[];
    placeholder: string;
    send: string;
    typing: string;
    goPublish: string;
    error: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply ?? labels.error,
          actions: data.actions,
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: labels.error },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {/* 对话框 */}
      {open && (
        <div className="flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-[#30363d] bg-[#0d1117] shadow-2xl shadow-black/60">
          {/* 头部 */}
          <div className="flex items-center gap-3 border-b border-[#21262d] bg-[#161b22] px-4 py-3">
            <div className="h-9 w-9 shrink-0">
              <RobotBuddy size={36} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-100">
                {labels.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {labels.tagline}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md p-1 text-zinc-500 hover:bg-[#21262d] hover:text-zinc-200"
              aria-label="close"
            >
              ✕
            </button>
          </div>

          {/* 消息区 */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {/* 欢迎语 + 建议 */}
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#161b22] px-3.5 py-2.5 text-sm text-zinc-200">
              {labels.welcome}
            </div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-400/15"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-500 px-3.5 py-2.5 text-sm whitespace-pre-wrap text-[#0d1117]"
                >
                  {m.content}
                </div>
              ) : (
                <div key={i} className="max-w-[85%] space-y-2">
                  <div className="rounded-2xl rounded-tl-sm bg-[#161b22] px-3.5 py-2.5 text-sm whitespace-pre-wrap text-zinc-200">
                    {m.content}
                  </div>
                  {m.actions?.map((a, j) => (
                    <a
                      key={j}
                      href={a.publishUrl}
                      className="block rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-xs text-violet-300 hover:bg-violet-400/20"
                    >
                      📝 {a.title} → <span className="underline">{labels.goPublish}</span>
                    </a>
                  ))}
                </div>
              )
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0.3s]" />
                {labels.typing}
              </div>
            )}
          </div>

          {/* 输入区 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-[#21262d] bg-[#161b22] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={labels.placeholder}
              maxLength={500}
              className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-400/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-[#0d1117] hover:bg-emerald-400 disabled:opacity-50"
            >
              {labels.send}
            </button>
          </form>
        </div>
      )}

      {/* 机器人本体（点击开关对话框） */}
      <button
        onClick={() => setOpen(!open)}
        className="group relative rounded-full transition-transform hover:scale-105"
        aria-label={labels.name}
      >
        <RobotBuddy size={64} />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-[#0d1117] bg-emerald-400" />
        </span>
      </button>
    </div>
  );
}
