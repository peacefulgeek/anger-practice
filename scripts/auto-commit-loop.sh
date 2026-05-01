#!/bin/bash
# Auto-commit any new articles every 10 minutes and push to GitHub.
# Runs as long as the bulk-seed process is alive.
cd /home/ubuntu/anger-practice
export GIT_AUTHOR_NAME="peacefulgeek"
export GIT_AUTHOR_EMAIL="peacefulgeek@users.noreply.github.com"
export GIT_COMMITTER_NAME="peacefulgeek"
export GIT_COMMITTER_EMAIL="peacefulgeek@users.noreply.github.com"

while pgrep -f "bulk-seed.mjs" > /dev/null; do
  sleep 600
  COUNT=$(ls data/articles/*.json 2>/dev/null | wc -l)
  cd /home/ubuntu/anger-practice
  # Recompile bundle so committed state is consistent
  node scripts/compile-articles.mjs 2>/dev/null || true
  git add data/articles/ data/topics-queue.json data/seed-log.jsonl client/src/data/articles.json 2>/dev/null
  if ! git diff --cached --quiet; then
    git commit -m "auto-seed: $COUNT articles total" >> /tmp/auto-commit.log 2>&1
    git push github main >> /tmp/auto-commit.log 2>&1
    echo "[$(date)] committed and pushed at count=$COUNT" >> /tmp/auto-commit.log
  fi
done

# Final commit when the seed process ends
COUNT=$(ls /home/ubuntu/anger-practice/data/articles/*.json 2>/dev/null | wc -l)
cd /home/ubuntu/anger-practice
node scripts/compile-articles.mjs 2>/dev/null || true
git add data/articles/ data/topics-queue.json data/seed-log.jsonl client/src/data/articles.json 2>/dev/null
git commit -m "seed complete: $COUNT articles total" >> /tmp/auto-commit.log 2>&1
git push github main >> /tmp/auto-commit.log 2>&1
echo "[$(date)] FINAL commit at count=$COUNT" >> /tmp/auto-commit.log
