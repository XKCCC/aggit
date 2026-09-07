// 平台收款配置（Concierge 人工托管模式）
// 使用方式：
// 1. 把下面的账户信息改成你的真实收款账户（或微信/支付宝收款说明）
// 2. 把收款码图片命名为 payment-qr.png 放到 public/ 目录下
// 3. commissionRate 为平台抽成比例（0.1 = 10%）
export const PAYMENT_INFO = {
  qrImage: "/payment-qr.png",
  accountLines: [
    "微信支付 / 支付宝：请使用上方收款码",
    "或对公转账：××银行××支行 · 户名××× · 账号 ×××× ×××× ××××",
    "转账时请备注：aggit 悬赏托管 + 悬赏标题",
  ],
  commissionRate: 0.1,
};
