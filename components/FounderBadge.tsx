// 金色金属光泽 Founder 徽章：前 1000 名注册用户 / 冷启动收录项目开发者专属
export default function FounderBadge({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full align-middle text-[9px] font-bold text-[#5b3a00] select-none"
      style={{
        background:
          "linear-gradient(135deg,#f9e589 0%,#e8b923 35%,#a8720a 68%,#f6e27a 100%)",
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(120,72,0,0.45), 0 1px 2px rgba(0,0,0,0.5)",
      }}
    >
      ★
    </span>
  );
}
