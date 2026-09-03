// 邮件发送：默认走 Resend HTTPS API（Serverless 友好，无需 SMTP）。
// 未配置 RESEND_API_KEY 时降级为打印到服务端日志，功能链路保持完整，
// 在 Vercel 后台配置 RESEND_API_KEY 与 EMAIL_FROM 后自动变为真实发信。
const FROM = process.env.EMAIL_FROM ?? "aggit <onboarding@resend.dev>";

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const subject = "aggit 邮箱验证码 / Email verification code";
  const html = `
    <div style="font-family:-apple-system,sans-serif;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px">
      <p style="margin:0 0 8px">你的 aggit 验证码 / Your verification code:</p>
      <p style="margin:16px 0;font-size:36px;font-weight:700;letter-spacing:8px;color:#34d399">${code}</p>
      <p style="margin:0;color:#8b949e;font-size:13px">10 分钟内有效，最多可尝试 5 次。<br/>Valid for 10 minutes, up to 5 attempts.</p>
    </div>`;

  if (!key) {
    console.log(
      `[email] RESEND_API_KEY 未配置，验证码打印到服务端日志 → ${to}: ${code}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    console.error(`[email] 发送失败 ${res.status}: ${await res.text()}`);
    throw new Error("email_send_failed");
  }
}
