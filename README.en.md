<div align="center">
  <img src="public/aggit.svg" width="96" alt="OpenAggit logo" />
  <h1>OpenAggit (aggit)</h1>
  <p><b>Open + Agent + Git — The open-source bounty hall for AI agents</b></p>
  <p>Trading agents shouldn't feel like buying legacy software.</p>
  <p>
    <a href="https://openaggit.com">🌐 Live Site</a> ·
    <a href="https://github.com/Gitdude010/LEAF">🌱 Genesis Project LEAF</a> ·
    <a href="https://github.com/XKCCC/aggit/issues">🐛 Issues</a>
  </p>
  <p>
    <a href="README.md">中文</a> · <b>English</b>
  </p>
</div>

---

## 🎯 Why OpenAggit?

AI agents are not traditional CRUD software. They hallucinate, they need context, and they depend on specific runtimes. Traditional outsourcing platforms are black boxes — they can neither test an agent nor handle this kind of non-standard delivery.

The vision of OpenAggit is simple: build a geek-grade trading hall with **code verification, sandbox testing, and escrow-backed credit**. Let developers speak with code; let buyers pay for deterministic delivery.

## 🚧 Current Status: The MVP

This is the V1.0 minimal version (partially AI-assisted).
The core loop is live: GitHub OAuth login, agent showcase (GitHub import), and the full bounty lifecycle (post / claim / deliver / accept).

**On payments & escrow:**
We're running a "Wizard of Oz" model. Deposit escrow, delivery arbitration, and payouts are currently **handled manually by humans**. We chose to close the real business loop first, rather than writing tens of thousands of lines of Stripe auto-split code before the first transaction exists.
Fully automated escrow and sandbox infrastructure are left for the community to build together.

## 💰 Business Model & Open Source

The core code of OpenAggit is open source forever (MIT). Feel free to fork it and deploy a private, internal version.

But if you post or claim bounties on the main site `openaggit.com`, the platform charges a **10%-15%** service fee. That money doesn't buy code — it buys services:
1. **Escrow**: anti-free-riding, anti-ghosting.
2. **Arbitration**: technical arbitration when deliveries are disputed.
3. **Infrastructure**: the Vercel / Neon / Cloudflare bills.

## 🌱 Genesis Project 001: LEAF

We use project 001 to define the technical bar of this platform:
**[LEAF](https://github.com/Gitdude010/LEAF)** — an MLE (Machine Learning Engineer) agent with **self-evolving code**.

It's not a toy that "calls an API and stops". LEAF builds candidate solutions via Monte Carlo Tree Search (MCTS):
`generate code → run in sandbox → capture errors (OOM / KeyError) → self-reflect & fix → run again`
An agent that genuinely evolves after failure.

## 🤝 Contributing

OpenAggit is at day zero and everything needs help. Fire support wanted:
- 🎨 **UI/UX**: strip away the rough AI-generated look, rebuild geekier components.
- 🗄️ **Schema**: the current Prisma schema is primitive and needs a DBA-grade refactor.
- 💳 **Payments & Sandbox**: the future core — automated payment splitting and an online code-run environment.

Even fixing a typo or nudging a margin is a contribution to the open-source ecosystem.
**Note: core contribution records in the OpenAggit repo will be your strongest credit endorsement when claiming high-value bounties on the platform.**

---

## 🛠 Run Locally

```bash
# Tech Stack: Next.js · TypeScript · Tailwind CSS · Prisma · Neon Serverless PostgreSQL

npm install
npm run db:setup     # initialize database (configure DATABASE_URL in .env first)
npm run dev          # localhost:3000
```

## 📜 License

MIT © OpenAggit contributors. Fork it, ship it — and don't forget to send a PR back.
