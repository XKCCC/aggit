# aggit — Agent 开源集市

AI Agent 的开源发布与悬赏交易平台（V1 原型）：

- **类 GitHub 的 Agent 仓库展示**：README Markdown 渲染、框架/语言/场景标签、Star、GitHub 仓库一键导入
- **类 Gitcoin 的悬赏大厅**：需求方发布带预算的悬赏，开发者认领 → 交付 → 验收完成
- 讨论区、工作台、中英文切换、模拟登录（预留 GitHub OAuth 接入点）

## 技术栈

Next.js 16（App Router）+ TypeScript + Tailwind CSS 4 + Prisma 6 + SQLite

## 快速开始

```bash
npm install          # 安装依赖
npm run db:setup     # 建表 + 写入种子数据（演示账号与示例内容）
npm run dev          # 启动，访问 http://localhost:3000
```

> 数据库文件在 `prisma/dev.db`，想重置数据随时再跑一遍 `npm run db:setup`。

## 演示账号

访问 `/login` 一键切换身份（V1 模拟登录，无密码）：

| 身份 | 账号 | 角色 |
| --- | --- | --- |
| 开发者 | @xkcc | mle-evolver 作者 |
| 开发者 | @ling_dev | LangChain/RAG 方向 |
| 开发者 | @alex_zhou | Dify/Flowise 低代码玩家 |
| 需求方 | @boss_chen | 跨境电商创始人 |
| 需求方 | @wang_quant | 量化私募技术负责人 |

建议体验路径：用 **@wang_quant** 登录发布悬赏 → 切 **@ling_dev** 认领 → 标记交付 → 切回 @wang_quant 验收通过。

## 切换真实 GitHub OAuth（V2 预留）

接入点见 `lib/auth.ts` 底部注释：注册 GitHub OAuth App 拿到 Client ID/Secret 后，
新增回调路由换取用户 profile，写入 User 表并调用 `createSession()` 即可，
其余页面只依赖 `getCurrentUser()`，无需改动。

## 目录结构

```
app/            页面（首页/探索/悬赏/工作台/登录）
components/     UI 组件（导航栏/卡片/Markdown/评论/Star）
lib/            业务层：db、auth、i18n、GitHub 导入、Server Actions
prisma/         schema.prisma（7 表）+ seed.js
```

## V1 边界（后续迭代方向）

- 无在线支付与资金托管：悬赏金额仅展示，交付验收后双方线下结算
- Agent 不提供在线试用：README 教程 + BYOK（自带 Key）体验
- 平台抽成、开发者信用评级、纠纷仲裁：待交易跑通后迭代
