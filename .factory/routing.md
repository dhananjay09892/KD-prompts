# Project Factory — Routing Defaults

Sensible starting points so the orchestrator doesn't have to scan 422 agents on
every run. These are **defaults, not locks** — the architect/designer stages may
override based on the interview. All names below are verified entries in
`.factory/index/*.json`. Re-run `python .factory/build-index.py` after adding
library files.

## How stages use this file
- **pf-architect** → reads the *Blueprint* + *Stack hint* columns.
- **pf-designer** → reads the *Design* column (a `design-md/` brand) and the
  *Palette row* (a line in `skills/creative-design/ui-ux-pro-max/data/colors.csv`).
- **pf-builder** → reads the *Primary builder agents* + *Key skills* columns and
  loads those agent files from `agents/` as personas.
- **pf-quality-gate** → always uses the *Hooks* column.

The **Project Evolver** track (analyze → enhance → work → document) reuses the
same five rows: pf-analyst classifies the project into one of them, then that
row's *Primary builder agents*, *Key skills*, and *Hooks* drive the build/quality
stages. The evolve-only personas are listed under "Evolve track" below.

---

## 1. Web app (React / Next.js + backend)

| Aspect | Default |
|--------|---------|
| Blueprint | `system-designs/saas-platform.md` (or `frontend-architecture.md` for static/SPA) |
| Stack hint | Next.js (App Router) + TypeScript + Tailwind; Supabase (free-tier default, scale up to a paid DB like PlanetScale if needed); Vercel deploy |
| Design | `design-md/vercel/` (default), `design-md/linear.app/`, `design-md/stripe/` |
| Palette row | colors.csv `#1 SaaS (General)` or `#17 Productivity Tool` |
| Primary builder agents | `frontend-developer`, `nextjs-developer`, `react-specialist`, `typescript-pro`, `backend-architect`, `fullstack-developer` |
| Key skills | `web-development/*`, `design-to-code/*`, `creative-design/ui-ux-pro-max` |
| Auth | `system-designs/auth-rbac/` + agent `security-engineer` |
| Hooks | `hooks/security/`, `hooks/quality-gates/`, `hooks/testing/` |
| Setup cmds | `commands/setup/`, `commands/nextjs-vercel/` |

## 2. API / backend service

| Aspect | Default |
|--------|---------|
| Blueprint | `system-designs/backend-scalable.md` |
| Stack hint | FastAPI (Python) or Node/Express + TypeScript; Postgres; Docker |
| Design | n/a (API) — generate OpenAPI + docs instead |
| Primary builder agents | `backend-architect`, `backend-developer`, `api-designer`, `python-pro`, `golang-pro`, `postgres-pro`, `database-optimizer` |
| Key skills | `development/*`, `database/*` |
| Auth | `system-designs/auth-rbac/` + `security-engineer` |
| Hooks | `hooks/security/`, `hooks/quality-gates/`, `hooks/testing/` |
| Setup cmds | `commands/setup/`, `commands/database/` |

## 3. AI / LLM app

| Aspect | Default |
|--------|---------|
| Blueprint | `system-designs/ai-integration.md` |
| Stack hint | Python + FastAPI backend, Next.js chat UI; vector DB; provider via env var |
| Design | `design-md/vercel/` or `design-md/supabase/` (dark dev-tool feel) |
| Palette row | colors.csv `#19 AI/Chatbot Platform` or `#86 Cybersecurity` for terminal vibe |
| Primary builder agents | `llm-architect`, `ai-engineer`, `prompt-engineer`, `machine-learning-engineer`, `mlops-engineer`, `backend-architect` |
| Key skills | `ai-research/*`, `ai-maestro/*` |
| MCPs | `mcps/research/`, `mcps/web/`, `mcps/database/` (vector store) |
| Hooks | `hooks/security/` (secret scan for API keys is critical here) |

## 4. CLI tool / script

| Aspect | Default |
|--------|---------|
| Blueprint | `system-designs/INDEX.md` (cli pattern) — keep it single-file simple |
| Stack hint | Python (Typer/Click) or Go (Cobra); stdlib-first; zero infra |
| Design | n/a — focus on `--help` UX and clear output |
| Primary builder agents | `cli-developer`, `python-pro`, `golang-pro`, `backend-developer` |
| Key skills | `development/*`, `utilities/*` |
| Hooks | `hooks/quality-gates/`, `hooks/testing/` |
| Setup cmds | `commands/setup/`, `commands/utilities/` |

## 5. Data / finance tool

| Aspect | Default |
|--------|---------|
| Blueprint | `system-designs/backend-scalable.md` + `ai-integration.md` (if modeling) |
| Stack hint | Python (pandas/polars) + FastAPI; websocket ingest (see repo `download.py`); Postgres/Timescale |
| Design | `design-md/stripe/` (financial precision) |
| Palette row | colors.csv `#7 Financial Dashboard`, `#15 Fintech/Crypto`, `#44 Banking` |
| Primary builder agents | `fintech-engineer`, `data-engineer`, `payment-integration`, `python-pro`, `backend-architect`, `postgres-pro` |
| Key skills | `analytics/*`, `database/*`, `scientific/*` |
| Hooks | `hooks/security/`, `hooks/quality-gates/` |
| Setup cmds | `commands/database/`, `commands/setup/` |

---

## Cross-cutting (every project)
- **Reviewer stage** always uses agents `code-reviewer` + `security-auditor` and
  writes a report to `docs/code_review.md` (mirrors your `raw prompts.txt` flow).
- **Focused security audit** (deeper than the reviewer): the **Project Security
  Auditor** orchestrator runs `pf-security-auditor`, which channels
  `security-auditor`, `penetration-tester`, `supply-chain-security`, and (when
  regulated) `compliance-auditor`, runs `hooks/security/` read-only, and writes
  `docs/analysis/security-audit.md`.
- **Testing** always uses agent `test-automator` + `hooks/testing/`.
- **Focused QA** (deeper than the quality gate): the **Project QA** orchestrator
  runs `pf-qa-engineer`, which channels `qa-expert`, `test-automator`,
  `test-engineer`, `playwright-tester`, and `accessibility-tester`, maps coverage
  gaps, writes real tests, and writes `docs/analysis/qa-report.md`.
- **Security non-negotiables** from `.github/copilot-instructions.md` apply to
  every stage: env-var secrets, parameterized queries, input validation, HTTPS.
- **Cost rule**: prefer static generation, managed DB (Supabase free-tier
  default; scale up to a paid DB like PlanetScale only when justified),
  and a single service over microservices unless the interview says otherwise.

---

## Evolve track (existing projects — Project Evolver)

For analyzing and improving a project that already exists. Reuses the five rows
above for the build/quality stages; these are the extra personas each
evolve-only stage loads (paths verified in `.factory/index/agents.json`).

| Stage | Agent | Writes | Personas it channels |
|-------|-------|--------|----------------------|
| Analyze | `pf-analyst` | `docs/analysis/project-analysis.md` | `code-archaeologist`, `architect-reviewer`, `security-auditor` |
| Future enhancements (≥95% confidence) | `pf-futurist` | `docs/analysis/enhancement-roadmap.md` | `product-strategist`, `architect-reviewer`, `trend-analyst` |
| Specific work plan | `pf-task-planner` | `docs/analysis/work-plan.md` | row's *Primary builder agents* + `test-automator` |
| Build the work | `pf-builder` (reused) | project code | row's *Primary builder agents* + *Key skills* |
| Quality gate | `pf-quality-gate` (reused) | runs checks | — (uses *Hooks* column) |
| Document (human + AI) | `pf-documenter` | one human file (`README.md` or `docs/DOCUMENTATION.md`) + AI tree (`AGENTS.md`, `docs/ai/index.md`, `docs/ai/**`) | `technical-writer`, `documentation-engineer`, `api-documenter` |

- **95% bar**: pf-futurist keeps an enhancement only if it is ≥95% likely to be
  both buildable with proven tech today *and* genuinely useful in the real world;
  anything weaker is reshaped or cut (and logged under "Cut").
- **Dual docs**: pf-documenter produces **one consolidated human-readable file**
  *and* a **modular AI tree** — `docs/ai/index.md` routes an agent to small
  single-concern subsections (`docs/ai/modules/*`, conventions, glossary, …) so it
  loads only what the current task needs instead of one giant context blob.

## Fallback when a project type doesn't match
If the idea fits none of the five rows, the orchestrator searches
`.factory/index/agents.json` and `designs.json` by keyword from the interview
spec and proposes a custom routing for your approval before building.
