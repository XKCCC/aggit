/* aggit 种子数据：演示账号 + 示例 Agent + 示例悬赏（内容取自平台定位讨论） */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MLE_README = `# MLE Evolver

面向机器学习工程师的自主 Agent：**生成代码 → 沙盒执行 → 捕获报错与指标 → 自我修正 → 再次执行**，形成完整的自进化闭环。

## 为什么不一样

市面上的"AI 写代码"大多是单次生成（zero-shot），跑挂了还得人来擦屁股。MLE Evolver 的核心是一个反馈闭环（Feedback Loop）：

1. 根据任务描述生成可运行的训练 / 评估脚本
2. 在沙盒中真实执行，捕获 stderr 与模型指标
3. 定位问题并自我修正：
   - \`KeyError\` → 自动修复字段映射
   - 显存溢出（OOM）→ 自动调小 batch_size 重试
   - 指标不达标 → 调整特征工程策略再来一轮
4. 输出最终可复现的代码与实验报告

## 快速开始（BYOK）

本项目不提供在线试用，请自带任意兼容 OpenAI 协议的 API Key（各家都有免费额度）：

\`\`\`bash
cp .env.example .env   # 填入你的 API Key
docker compose up -d   # 启动隔离沙盒（重要！Agent 会真实执行代码）
python -m mle_evolver run --task examples/titanic.yaml
\`\`\`

> ⚠️ 安全提示：Agent 具备代码执行能力，**务必在 Docker 沙盒中运行**，不要在宿主机直接执行。

## 架构

\`\`\`
Planner Agent → Coder Agent → Sandbox Runner → Critic Agent
      ↑__________________________________________|
                    （失败反馈自进化循环）
\`\`\`

## 可定制方向

- 对接私有数据源 / 特征平台
- 自定义评估指标与早停策略
- 金融时序、CV、NLP 等垂直任务的工具链扩展

有定制需求？点右上角「求定制」发布悬赏。
`;

const POLYGLOT_README = `# Polyglot Seller

跨境电商多语言客服 Agent，基于 LangChain 编排，支持中英日韩西五国语言自动识别与回复。

## 能力

- 多语言意图识别：买家用任何语言提问，自动识别并保持同语言回复
- 商品知识注入：接入商品库 JSON，自动回答规格、物流、退换政策
- 情绪升级策略：检测到买家情绪负面时自动转人工并生成安抚话术

## 快速开始（BYOK）

\`\`\`bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...   # 自带 Key
python demo.py --shop examples/shop.json
\`\`\`

## 已知边界

- 目前只做了文本客服，未接入语音
- 平台 API（Shopee / 速卖通）需要自行申请开发者权限
`;

const KB_README = `# KB Oracle

企业知识库 RAG 问答 Agent，基于 Flowise 可视化编排，**本仓库仅开放调用文档与编排 DSL**，引擎代码闭源。

## 它能做什么

把企业 100+ 份产品手册、内部 wiki、历史工单喂给它，得到一个 7x24 小时精准作答的专属客服。

## 交付物

- Flowise 编排文件（chatflow JSON）
- 文档切分与向量化配置
- 企业微信 / 飞书接入示例代码

## 接入方式

见 \`docs/integration.md\`，支持 API 调用与 iframe 嵌入两种模式。
`;

const INVOICE_README = `# Invoice Raven

发票信息提取 Agent，基于 Dify 工作流编排。**仅开放 DSL 配置与调用文档**。

## 能力

- 增值税发票 / 火车票 / 出租车票的字段级提取（购方、销方、金额、税率、发票号）
- 提取准确率约 95%，置信度低的字段自动标记人工复核
- 输出结构化 JSON，可直接对接财务系统

## 使用

导入 \`invoice_raven.yml\` 到你的 Dify 实例，配置模型 Key 即可使用。

## 定制方向

- 私有化部署与内网适配
- 对接用友 / 金蝶等财务软件
`;

const PAPER_README = `# Paper Scout

基于 AutoGen 的论文调研多智能体系统：给定研究课题，三个 Agent 分工协作产出调研报告。

## 角色分工

- **Searcher**：检索 arXiv / Semantic Scholar，筛选高引与最新工作
- **Reader**：精读关键论文，提取方法、数据、结论
- **Writer**：汇总成结构化调研报告（含对比表格与参考文献）

## 快速开始（BYOK）

\`\`\`bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
python scout.py "mixture of experts for edge deployment"
\`\`\`
`;

async function main() {
  // 清空旧数据（顺序受外键约束）
  await prisma.comment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.star.deleteMany();
  await prisma.bounty.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ---------- 用户 ----------
  const xk = await prisma.user.create({
    data: {
      username: "xkcc",
      displayName: "XK",
      role: "DEVELOPER",
      avatarColor: "#10b981",
      bio: "ML 工程师，在做会自我进化代码的 MLE Agent",
      githubUrl: "https://github.com/xkcc",
    },
  });
  const ling = await prisma.user.create({
    data: {
      username: "ling_dev",
      displayName: "林小满",
      role: "DEVELOPER",
      avatarColor: "#38bdf8",
      bio: "LangChain / RAG 方向，接各类 Agent 定制",
      githubUrl: "https://github.com/lingdev",
    },
  });
  const alex = await prisma.user.create({
    data: {
      username: "alex_zhou",
      displayName: "Alex Zhou",
      role: "DEVELOPER",
      avatarColor: "#fbbf24",
      bio: "全栈工程师，Dify / Flowise 低代码编排玩家",
      githubUrl: "https://github.com/alexzhou",
    },
  });
  const chen = await prisma.user.create({
    data: {
      username: "boss_chen",
      displayName: "陈远航",
      role: "EMPLOYER",
      avatarColor: "#a78bfa",
      bio: "跨境电商公司创始人，急需 AI 降本增效",
    },
  });
  const wang = await prisma.user.create({
    data: {
      username: "wang_quant",
      displayName: "王既明",
      role: "EMPLOYER",
      avatarColor: "#fb7185",
      bio: "量化私募技术负责人，为策略团队寻找工程化 Agent",
    },
  });

  // ---------- Agent 项目 ----------
  const mle = await prisma.project.create({
    data: {
      name: "mle-evolver",
      tagline: "会自我进化代码的机器学习工程师 Agent：生成 → 执行 → 纠错 → 再执行",
      readme: MLE_README,
      repoUrl: "https://github.com/xkcc/mle-evolver",
      framework: "自研框架",
      language: "Python",
      scenario: "代码生成",
      licenseType: "MIT",
      openType: "FULL",
      ownerId: xk.id,
    },
  });
  const seller = await prisma.project.create({
    data: {
      name: "polyglot-seller",
      tagline: "跨境电商多语言客服 Agent，五国语言自动识别回复",
      readme: POLYGLOT_README,
      repoUrl: "https://github.com/lingdev/polyglot-seller",
      framework: "LangChain",
      language: "Python",
      scenario: "客服与对话",
      licenseType: "Apache-2.0",
      openType: "FULL",
      ownerId: ling.id,
    },
  });
  const kb = await prisma.project.create({
    data: {
      name: "kb-oracle",
      tagline: "企业知识库 RAG 问答：吃透 100 份产品手册的专属客服",
      readme: KB_README,
      framework: "Flowise",
      language: "TypeScript",
      scenario: "检索增强 RAG",
      licenseType: "其他",
      openType: "DOCS_ONLY",
      ownerId: alex.id,
    },
  });
  const invoice = await prisma.project.create({
    data: {
      name: "invoice-raven",
      tagline: "发票字段级信息提取 Agent，准确率 95%，低置信度自动转人工",
      readme: INVOICE_README,
      framework: "Dify",
      language: "Python",
      scenario: "办公自动化",
      licenseType: "其他",
      openType: "DOCS_ONLY",
      ownerId: alex.id,
    },
  });
  const paper = await prisma.project.create({
    data: {
      name: "paper-scout",
      tagline: "AutoGen 论文调研多智能体：检索、精读、写报告一条龙",
      readme: PAPER_README,
      repoUrl: "https://github.com/lingdev/paper-scout",
      framework: "AutoGen",
      language: "Python",
      scenario: "多智能体协作",
      licenseType: "MIT",
      openType: "FULL",
      ownerId: ling.id,
    },
  });

  // ---------- Star ----------
  await prisma.star.createMany({
    data: [
      { userId: ling.id, projectId: mle.id },
      { userId: alex.id, projectId: mle.id },
      { userId: chen.id, projectId: mle.id },
      { userId: xk.id, projectId: seller.id },
      { userId: chen.id, projectId: seller.id },
      { userId: xk.id, projectId: kb.id },
      { userId: wang.id, projectId: kb.id },
      { userId: wang.id, projectId: invoice.id },
      { userId: xk.id, projectId: paper.id },
    ],
  });

  // ---------- 悬赏 ----------
  const b1 = await prisma.bounty.create({
    data: {
      title: "给多语言客服 Agent 接入飞书 API",
      description:
        "## 背景\n\n我们客服团队全部在飞书上办公，希望买家消息能直接进入飞书会话。\n\n## 需求\n\n- 基于开源项目 **polyglot-seller** 做定制\n- 买家消息 → 飞书群 / 客服单聊，回复原路返回\n- 负面情绪消息自动 @值班客服\n\n## 验收标准\n\n- 提供可运行的部署文档与录屏演示\n- 飞书侧消息延迟 < 3 秒\n\n## 备注\n\n飞书开放平台企业自建应用凭证由我方提供。",
      budgetMin: 300,
      budgetMax: 800,
      currency: "CNY",
      tags: "飞书,API集成,客服",
      status: "OPEN",
      creatorId: chen.id,
      projectId: seller.id,
    },
  });
  const b2 = await prisma.bounty.create({
    data: {
      title: "MLE Agent 对接内部量化回测框架",
      description:
        "## 背景\n\n策略团队目前手工写回测脚本，效率低且容易出错。希望引入 **mle-evolver** 的自进化能力。\n\n## 需求\n\n- 将 MLE Evolver 接入我们的事件驱动回测框架（Python，提供接口文档）\n- Agent 需理解回测结果指标（夏普、最大回撤、换手率）并据此迭代策略代码\n- 订单簿数据量级在千万行/日，注意内存控制\n\n## 验收标准\n\n- 在我们提供的样例数据集上端到端跑通\n- 至少演示一次「报错 → 自我修正 → 跑通」的完整闭环\n\n预算可谈，质量优先。",
      budgetMin: 3000,
      budgetMax: 8000,
      currency: "CNY",
      tags: "金融量化,回测,Python",
      status: "OPEN",
      creatorId: wang.id,
      projectId: mle.id,
    },
  });
  await prisma.bounty.create({
    data: {
      title: "定制前置日志清洗 Agent：对接旧系统乱码日志",
      description:
        "## 背景\n\n工厂设备日志分布在多个旧系统中，格式混乱且含大量乱码，无法直接喂给 MLE Agent 建模。\n\n## 需求\n\n- 定制一个前置 Data Cleaning Agent，输出标准化 CSV\n- 需处理 GBK/UTF-8 混合编码与时间戳对齐\n- 清洗后字段需匹配我们提供的建模模板\n\n## 验收标准\n\n- 对提供的 3 个样例日志文件完成清洗\n- 输出字段完整率 ≥ 98%",
      budgetMin: 1500,
      budgetMax: 3000,
      currency: "CNY",
      tags: "数据清洗,制造业,ETL",
      status: "OPEN",
      creatorId: wang.id,
      projectId: mle.id,
    },
  });
  const b4 = await prisma.bounty.create({
    data: {
      title: "知识库客服接入企业微信",
      description:
        "## 需求\n\n基于 **kb-oracle** 的 RAG 能力，接入企业微信客服消息接口。\n\n## 验收标准\n\n- 企微侧收发消息正常\n- 命中知识库的问题直接作答，未命中转人工\n\n已完成的项目可参考此单流程。",
      budgetMin: 800,
      budgetMax: 2000,
      currency: "CNY",
      tags: "企业微信,RAG,客服",
      status: "COMPLETED",
      creatorId: chen.id,
      projectId: kb.id,
    },
  });
  const b5 = await prisma.bounty.create({
    data: {
      title: "发票提取 Agent 私有化部署与内网适配",
      description:
        "## 背景\n\n财务数据敏感，必须私有化部署，且公司内网无法访问公网大模型 API。\n\n## 需求\n\n- 基于 **invoice-raven** 的 Dify DSL，改造为本地模型（Qwen2-VL）推理\n- 提供 Docker Compose 一键部署包\n- 内网环境离线安装文档\n\n## 验收标准\n\n- 提供 50 张样例发票的提取准确率报告（≥ 92%）",
      budgetMin: 5000,
      budgetMax: 10000,
      currency: "CNY",
      tags: "私有化部署,财税,Docker",
      status: "OPEN",
      creatorId: wang.id,
      projectId: invoice.id,
    },
  });

  // ---------- 认领 ----------
  await prisma.claim.create({
    data: {
      bountyId: b2.id,
      developerId: ling.id,
      message:
        "做过两个事件驱动回测引擎的 LLM 工具化封装，千万行级订单簿建议先入 DuckDB 做列存。预计 2 周交付，第一周出端到端 demo。",
      status: "ACTIVE",
    },
  });
  await prisma.claim.create({
    data: {
      bountyId: b4.id,
      developerId: alex.id,
      message:
        "kb-oracle 是我发布的项目，企微接入有现成模块，3 天交付。",
      status: "ACCEPTED",
    },
  });
  await prisma.claim.create({
    data: {
      bountyId: b5.id,
      developerId: alex.id,
      message:
        "invoice-raven 作者本人接单。已在本机验证 Qwen2-VL-7B 提取效果，准确率 93.1%，部署包已做完。",
      status: "SUBMITTED",
    },
  });
  await prisma.claim.create({
    data: {
      bountyId: b1.id,
      developerId: ling.id,
      message:
        "polyglot-seller 作者本人，飞书事件订阅+消息卡片上周刚在另一个项目做过，轻车熟路。",
      status: "ACTIVE",
    },
  });

  // ---------- 评论 ----------
  await prisma.comment.create({
    data: {
      bountyId: b2.id,
      userId: wang.id,
      body: "补充：回测框架接口文档已放在需求附件，订单簿按交易日切片存储，单日峰值约 1200 万行。",
    },
  });
  await prisma.comment.create({
    data: {
      bountyId: b2.id,
      userId: xk.id,
      body: "建议认领的同学注意：自进化循环里需要加内存监控指标，OOM 时除了降 batch 还可以切换分块回测。",
    },
  });
  await prisma.comment.create({
    data: {
      bountyId: b1.id,
      userId: chen.id,
      body: "飞书测试租户已开通，认领后私信提供 App ID 和 Secret。",
    },
  });
  await prisma.comment.create({
    data: {
      projectId: mle.id,
      userId: alex.id,
      body: "沙盒默认的 CPU / 内存限制配置在哪个文件？想 fork 一版跑 CV 训练任务。",
    },
  });
  await prisma.comment.create({
    data:
    {
      projectId: mle.id,
      userId: xk.id,
      body: "在 sandbox/compose.yaml 的 deploy.resources 里，默认 4C8G。跑 CV 建议把内存上限调到 16G，OOM 自进化策略会更稳。",
    },
  });

  console.log("✓ 种子数据写入完成：5 用户 / 5 Agent / 5 悬赏 / 4 认领 / 5 评论");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
