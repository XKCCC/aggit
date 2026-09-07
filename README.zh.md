<div align="center">
  <img src="public/aggit.svg" width="96" alt="OpenAggit logo" />
  <h1>OpenAggit (aggit)</h1>
  <p><b>Open + Agent + Git — AI Agent 的开源悬赏交易大厅</b></p>
  <p>交易 Agent，不应该像传统买卖软件那样死板。</p>
  <p>
    <a href="https://openaggit.com">🌐 主站</a> ·
    <a href="https://github.com/Gitdude010/LEAF">🌱 创世项目 LEAF</a> ·
    <a href="https://github.com/XKCCC/aggit/issues">🐛 Issues</a>
  </p>
  <p>
    <b>中文</b> · <a href="README.md">English</a>
  </p>
</div>

---

## 🎯 为什么做 OpenAggit?

AI Agent 不是传统的 CRUD 软件。它有幻觉、需要上下文，且高度依赖特定的 Runtime。传统的商业外包平台像个黑盒，既无法测试 Agent，也无法处理这种非标交付。

OpenAggit 的愿景很简单：构建一个自带 **代码验证、沙盒测试、信用担保** 的极客交易大厅。让开发者拿代码说话，让买家为确定性的交付结果买单。

## 🚧 当前阶段: The MVP

当前为 V1.0 极简版（部分由 AI 辅助生成）。
我们跑通了最核心的链路：GitHub OAuth 登录、Agent 接入展示、以及悬赏的发包/接包状态流转。

**关于支付与担保：**
初期我们采用 "Wizard of Oz (绿野仙踪)" 模式。定金托管、交付仲裁和尾款发放，目前**由人工介入处理**。我们选择优先跑通真实的商业闭环，而不是在没有交易前去堆砌几万行 Stripe 的自动分账代码。
全自动的资金托管与沙盒基建，留给社区在未来一起造。

## 💰 商业模式与开源

OpenAggit 的核心代码永久开源 (MIT)。你完全可以 Fork 走去部署一个内部私有版。

但如果你在 `openaggit.com` 主站接单或发包，平台会收取 **10%-15%** 的服务费。这笔钱不卖代码，而是买服务：
1. **资金托管**：防白嫖，防跑路。
2. **争议仲裁**：交付产生分歧时的技术仲裁。
3. **云端基建**：Vercel / Neon / Cloudflare 的服务器账单。

## 🌱 001 号创世项目：LEAF

我们用 001 号项目，来定义平台期待的技术水位线：
**[LEAF](https://github.com/Gitdude010/LEAF)** — 一个具备**代码自进化能力**的 MLE (Machine Learning Engineer) Agent。

它不是那种“调一下 API 就结束”的玩具。LEAF 基于蒙特卡洛树搜索 (MCTS) 构建候选方案：
`生成代码 → 沙盒执行 → 捕获报错(如 OOM/KeyError) → 自我反思修正 → 再次执行`
一个真的会在失败后自我进化的 Agent。

## 🤝 参与贡献

OpenAggit 还在最早期，百废待兴。我们急需以下火力支援：
- 🎨 **UI 交互**：剥离粗糙的 AI 痕迹，重构更极客的组件。
- 🗄️ **Schema 优化**：当前的 Prisma 表结构比较原始，需要 DBA 视角的重构。
- 💳 **支付与沙盒**：未来核心——集成自动化分账与在线代码试跑环境。

哪怕只是改个错别字、调个边距，也是对开源生态的贡献。
**注：在 OpenAggit 仓库的核心贡献记录，将是你未来在平台上接高价悬赏时的最强信用背书。**

---

## 🛠 本地运行

```bash
# Tech Stack: Next.js · TypeScript · Tailwind CSS · Prisma · Neon Serverless PostgreSQL

npm install
npm run db:setup     # 初始化数据库（需在 .env 中配置 DATABASE_URL）
npm run dev          # 启动: localhost:3000