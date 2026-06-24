---
applyTo: "**/*.{yml,yaml},**/Dockerfile,**/docker-compose*,**/.github/workflows/**,**/terraform/**,**/k8s/**"
---

# DevOps / Infrastructure Rules

Channel: `agents/development-team/devops-engineer.md`

## CI/CD Rules
- Every PR triggers: lint → type-check → test → build (in that order, fail fast)
- Secrets via GitHub Actions secrets — never in workflow YAML
- Preview deployments for every PR (Vercel/Netlify native)
- Production deploy only from `main` branch with passing checks

## Docker Rules
- Multi-stage builds — dev dependencies never in production image
- Non-root user in final stage
- `.dockerignore` excludes: `node_modules`, `.env*`, `.git`, test files
- Pin base image versions (not `node:latest`)

## Environment Strategy
```
local → staging (auto on PR merge) → production (manual gate or tag-based)
```

## Secret Management
- Local: `.env.local` (gitignored)
- CI: GitHub Actions secrets
- Production: platform-native (Vercel env vars, Railway, etc.)
- Never: hardcoded, committed `.env`, or logged

## Monitoring Baseline
- Error tracking: Sentry (free tier for < 5K errors/month)
- Uptime: Better Uptime or UptimeRobot (free)
- Logs: structured JSON to stdout, platform aggregates (Vercel, Railway, etc.)
- Alerts: PagerDuty-free or email on critical errors

## Command Reference
- Setup CI/CD: `commands/setup/setup-ci-cd-pipeline.md`
- Docker setup: `commands/setup/setup-docker-containers.md`
- Monitoring: `commands/setup/setup-monitoring-observability.md`
