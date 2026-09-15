#!/bin/bash
# aggit 每日外联自动任务包装器
# crontab: 0 8 * * * /bin/bash /Users/xkcc/python_test/openagent/scripts/outreach/daily.sh
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
# LLM 密钥等环境（gitignore 保护）
source /Users/xkcc/python_test/openagent/scripts/outreach/data/env.sh 2>/dev/null || true
cd /Users/xkcc/python_test/openagent || exit 1
exec node scripts/outreach/agent.mjs daily
