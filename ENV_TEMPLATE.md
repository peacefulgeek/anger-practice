# Environment Variables

Copy these into your hosting provider's environment-variable panel
(Railway / DigitalOcean App Platform / etc).

**Bunny CDN credentials are hardcoded in `src/lib/config.ts` — no env var needed.**

```
# DeepSeek (OpenAI-compatible) — these are also hardcoded with fallbacks in config.ts,
# but setting them via env lets you override without editing code.
OPENAI_API_KEY=sk-your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-pro

# Auto-generation cron toggle (default: true)
AUTO_GEN_ENABLED=true

# Server
NODE_ENV=production
PORT=3000
```
