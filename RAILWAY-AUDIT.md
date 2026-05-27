# Railway gotchas audit (from user's prior deploy fight)

- [x] 1. railway.json builder switched from NIXPACKS → RAILPACK; nixpacks.toml deleted
- [x] 2. patches/wouter@3.7.1.patch present in repo; no .dockerignore exists
- [x] 3. packageManager pinned to pnpm@10.4.1+sha512 in package.json
- [x] 4. Crash handlers as first lines of server/index.ts; server.on('error') wired
- [x] 5. PORT default changed 3000 → 8080
- [x] 6. healthcheckPath/healthcheckTimeout removed from railway.json
- [x] 7. No Dockerfile in repo; no startCommand in railway.json — single path via package.json start script under Railpack
- [x] 8. No Dockerfile means no stale Docker layer cache; Railpack rebuilds on every push
- [x] 9. DNS gotcha documented in DEPLOY-RAILWAY.md (delete-and-recreate stale records)
