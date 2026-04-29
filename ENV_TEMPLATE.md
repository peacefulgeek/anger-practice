# Environment Variables

Copy these into your hosting provider's environment-variable panel
(Railway / DigitalOcean App Platform / etc).
**Never commit actual secrets to the repo.**

```
# DeepSeek (OpenAI-compatible)
OPENAI_API_KEY=sk-your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-pro

# Auto-generation cron toggle
AUTO_GEN_ENABLED=true

# Bunny CDN (40-image library lives at anger-practice.b-cdn.net/library/lib-XX.webp)
BUNNY_PULL_ZONE=anger-practice.b-cdn.net
BUNNY_STORAGE_ZONE=anger-practice
BUNNY_STORAGE_REGION=ny
BUNNY_STORAGE_PASSWORD=f5c045db-2822-4ad7-98ccba130603-6024-44fc

# GitHub (for deploy/CI if needed)
GH_PAT=

# Server
NODE_ENV=production
PORT=3000
```
