<div align="center">
  <img src="public/aggit.svg" width="96" alt="OpenAggit logo" />

  # OpenAggit (aggit)

  **Open + Agent + Git — AI Agent 的开源悬赏交易大厅**

  交易 Agent，不该像买卖传统软件那样死板。

  [🌐 主站 openaggit.com](https://openaggit.com) · [🌱 创世项目 LEAF](https://github.com/Gitdude010/LEAF) · [🐛 Issues](https://github.com/XKCCC/aggit/issues)
</div>

---

## 🎯 愿景 (Vision)

OpenAggit 是一个专注于 **AI Agent 定制与交易**的极客悬赏平台。

在这个 AI 爆炸的时代，供需两端严重割裂：企业想要 Agent 降本增效却找不到靠谱的人，硬核开发者写了一堆牛逼的 Agent 却没有变现通道。传统外包平台是个黑盒——需求不透明、交付无验证、信用靠嘴说。

我们的信条：

> 交易 Agent 不该像传统的买卖软件那样死板。
> 我们需要的是一个自带**代码验证、沙盒测试、信用担保**的非标交易大厅——
> 卖家秀的是真实可运行的代码，买家买的是确定性的交付结果。

## 🚧 当前阶段 (Current Status: The MVP)

先坦白，不装：

- V1.0 的前端界面和底层基建是 **AI 辅助生成**的，极简，甚至有些粗糙。
- 但链路是真跑通的：注册登录（GitHub OAuth / 邮箱验证码）、Agent 展示（README 渲染 / GitHub 一键导入）、悬赏大厅（认领 → 交付 → 验收）、双语切换、内容治理，全都在线上跑着。
- **支付与资金担保目前是"绿野仙踪式 (Wizard of Oz)"运营**：发布悬赏需预付 30% 定金，收款、仲裁、放款全部由创始人**人工介入**（邮件/微信群撮合）。没有一行自动支付代码——这是刻意为之，不是偷懒。

> 自动化的 Stripe 分账、智能合约托管、开发者信用分系统——
> 这些"正经"的玩意儿，留给社区一起造。急什么，先把单跑起来。

## 💰 可持续发展 (Sustainability)

**这是一个完全开源的项目，我们不卖代码。**

盈利逻辑只有一条：平台上达成真实交易，收取 **10%-15%** 的服务费，用于：

1. **资金托管与担保** —— 防白嫖，防跑路；
2. **争议仲裁** —— 交付扯皮时的极客技术仲裁成本；
3. **基建续命** —— Vercel / Neon / Cloudflare 的服务器账单。

随便 Fork 去私有化部署，MIT 协议管够。
但如果你想享受主站的社区流量撮合和资金担保服务——请在主站按规矩玩。🤝

## 🌱 001 号创世项目 (Genesis Agent: LEAF)

平台的第一个标杆项目，用来告诉社区"我们接的是什么级别的悬赏"：

> **[LEAF](https://github.com/Gitdude010/LEAF)** — 一个具备**代码自进化能力**的 MLE (Machine Learning Engineer) Agent。
>
> 它不是那种"生成一段代码就跑"的玩具。LEAF 基于**蒙特卡洛树搜索 (MCTS)** 迭代构建候选机器学习方案：
>
> ```
> 生成代码 → 沙盒执行 → 捕获报错/评估指标 → 自我修正 → 再次执行
>      ↑____________________ 反馈闭环 ____________________|
> ```
>
> OOM 了自动降 batch_size，KeyError 了自己修字段映射——一个真的会在失败后自我进化的 Agent。
> 这，就是本平台悬赏的技术水位线。

## 🤝 参与贡献 (How to Contribute)

兄弟，来都来了，提个 PR 再走？

**当前急需的火力支援：**

- 🎨 **UI 美化** —— 现在的界面能看，但离"性感"还有距离
- 🗄️ **数据库 Schema 优化** —— Prisma 表结构拍脑袋成分较高，求 DBA 大佬指点
- 💳 **自动化支付接入** —— Stripe / 微信支付的定金托管与分账，把创始人从人工对账里解放出来
- 🔍 **全文检索** —— 现在只是模糊匹配，数据量大了需要真·搜索引擎
- 🧪 **Agent 沙盒验证** —— 让买家在平台上直接试跑 Agent，而不只是看 README

改个错别字、调个边距也算 PR，一样会被认真合并。

> 在这里提 PR，不只是贡献代码。
> 你是在为自己未来在平台上接悬赏，积累**最硬核的信用分**——
> 毕竟雇主挑人时，"这个平台的核心贡献者"比任何简历都有说服力。

---

## 🛠 技术栈与本地运行

```
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4
Prisma 6 · PostgreSQL (Neon Serverless) · Vercel
```

```bash
npm install          # 安装依赖
npm run db:setup     # 建表 + 种子数据（需要先在 .env 配置 DATABASE_URL）
npm run dev          # http://localhost:3000
```

数据库连接串配置在 `.env` 的 `DATABASE_URL`（Postgres，本地开发可用任何实例）。
可选环境变量：`GITHUB_ID` / `GITHUB_SECRET`（OAuth 登录）、`RESEND_API_KEY` + `EMAIL_FROM`（注册验证码邮件）。

## 📜 License

MIT © OpenAggit contributors. Fork it, ship it, 记得回来提 PR。
