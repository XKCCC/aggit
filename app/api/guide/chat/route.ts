import { NextResponse } from "next/server";
import { hitsBanned, runGuide, SAFE_REPLY_EN, SAFE_REPLY_ZH } from "@/lib/guide";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  // 匿名公开接口（会消耗 LLM 额度）：同 IP 每分钟最多 15 次
  if (!(await rateLimit("guide", 15, 60_000))) {
    return NextResponse.json(
      { reply: "你问得太快啦，喝口水休息一下再聊～", actions: [] },
      { status: 429 }
    );
  }

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reply: "……", actions: [] }, { status: 400 });
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  // 只保留合法角色，最多 20 条，每条截断 1000 字
  const messages = raw
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ reply: "……", actions: [] }, { status: 400 });
  }

  // 输入违禁词拦截：直接返回安全语句，不消耗 LLM
  if (hitsBanned(lastUser.content)) {
    const isZh = /[\u4e00-\u9fff]/.test(lastUser.content);
    return NextResponse.json({
      reply: isZh ? SAFE_REPLY_ZH : SAFE_REPLY_EN,
      actions: [],
    });
  }

  const result = await runGuide(messages);

  // 输出违禁词兜底：模型万一说错话，整段替换
  if (hitsBanned(result.reply)) {
    const isZh = /[\u4e00-\u9fff]/.test(lastUser.content);
    return NextResponse.json({
      reply: isZh ? SAFE_REPLY_ZH : SAFE_REPLY_EN,
      actions: [],
    });
  }

  return NextResponse.json(result);
}
