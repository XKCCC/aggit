export const FRAMEWORKS = [
  "自研框架",
  "AutoGen",
  "CrewAI",
  "LangChain",
  "Dify",
  "Flowise",
  "MetaGPT",
  "其他",
] as const;

export const SCENARIOS = [
  "代码生成",
  "数据分析",
  "客服与对话",
  "内容创作",
  "办公自动化",
  "金融量化",
  "检索增强 RAG",
  "多智能体协作",
  "其他",
] as const;

export const LANGUAGES = [
  "Python",
  "TypeScript",
  "JavaScript",
  "Go",
  "Java",
  "Rust",
  "其他",
] as const;

export const OPEN_TYPES: Record<string, string> = {
  FULL: "全源码开源",
  DOCS_ONLY: "仅开放调用文档",
};

export const BOUNTY_STATUS: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  OPEN: {
    label: "招募中",
    dot: "bg-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
  },
  COMPLETED: {
    label: "已完成",
    dot: "bg-violet-400",
    badge: "bg-violet-400/10 text-violet-300 border-violet-400/30",
  },
  CANCELLED: {
    label: "已取消",
    dot: "bg-zinc-500",
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  },
};

export const CLAIM_STATUS: Record<string, { label: string; badge: string }> = {
  ACTIVE: {
    label: "已认领",
    badge: "bg-sky-400/10 text-sky-300 border-sky-400/30",
  },
  SUBMITTED: {
    label: "已交付待验收",
    badge: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  },
  ACCEPTED: {
    label: "验收通过",
    badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
  },
  REJECTED: {
    label: "未入选",
    badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  },
};

export const ROLES: Record<string, string> = {
  DEVELOPER: "开发者",
  EMPLOYER: "需求方",
};
