#!/bin/bash
# aggit 每日外联自动任务包装器
# launchd: com.openaggit.outreach（每天 11:00）
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
# LLM 密钥等环境（gitignore 保护）
source /Users/xkcc/python_test/openagent/scripts/outreach/data/env.sh 2>/dev/null || true
cd /Users/xkcc/python_test/openagent || exit 1
node scripts/outreach/agent.mjs daily
# 需求侧：GitHub Issues 定制需求信号外联（每日增量，≤5 人）
node scripts/outreach/demand.mjs daily
# 为新收录的项目补商业话术卡（幂等，只处理 pitch 为空的）
node scripts/outreach/pitch_gen.mjs
# 清理 30 天未认领且无互动的收录项目（下架不删除）
node scripts/outreach/cleanup.mjs --days 30
