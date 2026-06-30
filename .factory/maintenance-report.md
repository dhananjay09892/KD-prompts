# Agent Maintenance Report

Date: 2026-06-27 | Maintainer: Agent Maintainer | Mode: **FIX MODE (all approved findings applied) + RE-AUDIT**
Agents scanned: 26 | Config scanned: `copilot-instructions.md`, `routing.md`, `README.md`, `index/*.json`, `instructions/*`
Sources checked (dated): PlanetScale pricing — https://planetscale.com/pricing (no free tier; cheapest SKU PS-5 non-HA $5/mo, generated 2026-06-27); internal `.factory/index/agents.json` (generated 2026-06-25).
Loop iterations: **2** (fix pass → re-audit pass). Report is now **CLEAN** — 0 Critical / 0 High / 0 Medium / 0 Low outstanding.

---

## Health summary (post-fix)

| Severity | Before | After | Meaning |
|----------|--------|-------|---------|
| Critical | 1 | **0** | Broken persona reference resolved |
| High | 1 | **0** | PlanetScale free-tier drift corrected |
| Medium | 8 | **0** | Confidence/best-practices line backfilled |
| Low | 1 | **0** | README diagram updated |

All four approved fixes were applied as minimal, intent-preserving diffs and re-verified. No new findings surfaced in the re-audit.

---

## Applied changes (fix mode)

### [Critical → resolved] pf-analyst broken persona reference
Replaced the non-existent `code-archaeologist` with the verified **`code-explorer`** (confirmed in `.factory/index/agents.json:801` → `agents/development-team/code-explorer.md`; best functional match for "deeply analyze an existing project / map what it is and how it works").
- [pf-analyst.agent.md:2](.github/agents/pf-analyst.agent.md#L2) — description "Channels code-explorer, architect-reviewer, and security-auditor…"
- [pf-analyst.agent.md:17](.github/agents/pf-analyst.agent.md#L17) — body "Read and apply `code-explorer`, `architect-reviewer`, and `security-auditor`…"
- Re-validated: yes — no remaining `code-archaeologist` match in `.github/agents/`; `code-explorer` resolves in index + on disk. Confidence: 100%.

### [High → resolved] PlanetScale free-tier contradiction
Repositioned PlanetScale as a paid scale-up option (noting it has no free tier) while keeping Supabase as the free-tier default, so the managed-DB guidance no longer contradicts the "never suggest paid tooling when free-tier equivalents exist" rule.
- [copilot-instructions.md:156](.github/copilot-instructions.md#L156) — now: "Prefer **managed DB (Supabase free tier as default)** over custom DB infra for new projects; scale up to a paid DB (e.g. PlanetScale, no free tier) only when justified".
- [routing.md:29](.factory/routing.md#L29) — Web app stack hint: "Supabase (free-tier default, scale up to a paid DB like PlanetScale if needed)".
- [routing.md:107](.factory/routing.md#L107) — cross-cutting cost rule: "managed DB (Supabase free-tier default; scale up to a paid DB like PlanetScale only when justified)".
- Re-validated: yes — only two PlanetScale mentions remain in `routing.md`, both correctly framed as paid scale-up. Affects all agents honoring the cost rules (notably `pf-architect`). Confidence: 95%.

### [Medium → resolved] Confidence/best-practices rule backfilled into 8 pipeline agents
Added one explicit "Confidence, Accuracy & Best Practices" bullet to each of the 8 agents that lacked it, matching the wording/style of the 18 newer agents and placed in each agent's rules/constraints area:
- [project-factory.agent.md:16](.github/agents/project-factory.agent.md#L16) (Golden rules)
- [pf-interviewer.agent.md:12](.github/agents/pf-interviewer.agent.md#L12)
- [pf-architect.agent.md:12](.github/agents/pf-architect.agent.md#L12)
- [pf-designer.agent.md:13](.github/agents/pf-designer.agent.md#L13)
- [pf-scaffolder.agent.md:13](.github/agents/pf-scaffolder.agent.md#L13)
- [pf-builder.agent.md:13](.github/agents/pf-builder.agent.md#L13)
- [pf-quality-gate.agent.md:12](.github/agents/pf-quality-gate.agent.md#L12)
- [pf-reviewer.agent.md:12](.github/agents/pf-reviewer.agent.md#L12)
- Re-validated: yes — the rule now appears in **all 26** agents (the 8 targets confirmed individually). Confidence: 99%.

### [Low → resolved] README diagram missing agent-maintainer route
Added the `M --> AM[Agent Maintainer]` edge to the Project Manager mermaid diagram, consistent with the manager's `agents:` allowlist.
- [README.md:203](.factory/README.md#L203) (in the Project Manager flowchart).
- Re-validated: yes. Confidence: 95%.

---

## Re-audit — the four checks (post-fix)

### Axis 1 — Rule conformance — **PASS**
All 26 agents have valid YAML frontmatter (no frontmatter was edited). Worker/orchestrator tool-form convention intact (13 `pf-*` short form + `user-invocable: false`; 13 orchestrators/focused full array + `user-invocable: true`). Every agent now carries the confidence/best-practices rule (was 18/26 → now 26/26). Output Format sections, approval gates, and security non-negotiables unchanged and present.

### Axis 2 — Reference integrity — **PASS**
The only broken reference (`code-archaeologist`) is resolved; its replacement `code-explorer` is verified in `agents.json` and on disk. No new references were introduced by any edit. All `agents:` allowlists, blueprints, hooks, commands, skills, designs, and ~57 personas remain valid.

### Axis 3 — Real-world freshness — **PASS**
PlanetScale guidance now matches the verified pricing reality (no free tier). Supabase remains the free-tier default (current). No other drift found: Next.js App Router, FastAPI, Typer/Click, Cobra/Go, WCAG 2.2 all current; no pinned model/version exposure in agent files.

### Axis 4 — Index & config health — **PASS — no re-index required**
Edits touched only `.github/agents/*.agent.md`, `.github/copilot-instructions.md`, `.factory/routing.md`, and `.factory/README.md`. None of these live under the indexed library roots (`agents/`, `commands/`, `skills/`, `design-md/`, `system-designs/`) that `build-index.py` scans, so `index/manifest.json` (generated 2026-06-25) remains accurate. **`python .factory/build-index.py` is NOT needed.**

---

## Freshness log (what the real world says now)
- **PlanetScale** — no free tier; cheapest SKU PS-5 non-HA **$5/mo**. Source: planetscale.com/pricing (2026-06-27). Now framed as a paid scale-up in shared config.
- **Supabase** — free tier still offered (current). Remains the free-default managed DB.
- **Next.js App Router / FastAPI / Typer / Cobra / WCAG 2.2** — all current; no change.

---

## Recommended (not applied)
- None outstanding. Re-index not required (no indexed-library files changed).

---

<details>
<summary>Original audit pass (2026-06-27, report-only) — retained for history</summary>

Date: 2026-06-27 | Maintainer: Agent Maintainer | Mode: **AUDIT / REPORT ONLY (no fixes applied)**
Agents scanned: 26 | Config scanned: `copilot-instructions.md`, `routing.md`, `README.md`, `index/*.json`, `instructions/*`
Sources checked (dated): PlanetScale pricing — https://planetscale.com/pricing (generated 2026-06-27T18:25Z); internal `.factory/index/agents.json` (generated 2026-06-25).

> No agent files or library files were modified in this pass. This report is the only artifact written.

---

## Health summary

| Severity | Count | Meaning |
|----------|-------|---------|
| Critical | 1 | Broken library reference (persona that does not exist) |
| High | 1 | Real-world freshness drift with cost/decision impact (affects routing) |
| Medium | 8 | Convention conformance gap (missing the explicit confidence/best-practices rule line) |
| Low | 1 | Documentation inconsistency in `README.md` |

Overall: the agent system is in **good** shape. Frontmatter is valid across all 26 agents, the worker/orchestrator tool-form convention is followed consistently, every `agents:` allowlist resolves to a real agent file, and ~57 referenced personas plus all referenced blueprints, hooks, commands, skills, and designs exist — **with one exception** (`code-archaeologist`). The index is current; **no re-index is required**.

---

## Axis 1 — Rule conformance

**Pass (system-wide):**
- All 26 agents have valid YAML frontmatter. The 13 `pf-*` workers use the short tools form (`[read, search]` / `+edit` / `+execute` / `+web`) with `user-invocable: false` and no `name`/`argument-hint` (correct). The 13 orchestrators/focused agents use the full tools array with `user-invocable: true`, a `name`, and an `argument-hint` (correct).
- Every agent has a defined **Output Format** section (verified all 26).
- Orchestrators (`project-factory`, `project-evolver`, `project-manager`, `project-documentor`, `project-qa`, `project-security-auditor`) all enforce explicit per-stage **approval gates** and the "you delegate; you do not build" boundary.
- Security non-negotiables are stated where agents write code: [backend-engineer.agent.md](.github/agents/backend-engineer.agent.md#L22), [frontend-engineer.agent.md](.github/agents/frontend-engineer.agent.md#L23), [pf-builder.agent.md](.github/agents/pf-builder.agent.md#L12), [pf-scaffolder.agent.md](.github/agents/pf-scaffolder.agent.md#L10).

**Findings:**

### [Medium] 8 agents omit the explicit "Confidence, Accuracy & Best Practices" rule line
The convention (and the Agent Maintainer's own axis-1 check) requires every agent to **carry the confidence/accuracy + best-practices rule**. 18 of 26 agents carry it verbatim; the following **8 — the original Project Factory pipeline — do not** (they rely only on a general "Honor the brain rules" reference):

- [project-factory.agent.md](.github/agents/project-factory.agent.md#L14) — golden rules list 4 bullets, none is the confidence/best-practices rule.
- [pf-interviewer.agent.md](.github/agents/pf-interviewer.agent.md)
- [pf-architect.agent.md](.github/agents/pf-architect.agent.md)
- [pf-designer.agent.md](.github/agents/pf-designer.agent.md)
- [pf-scaffolder.agent.md](.github/agents/pf-scaffolder.agent.md)
- [pf-builder.agent.md](.github/agents/pf-builder.agent.md)
- [pf-quality-gate.agent.md](.github/agents/pf-quality-gate.agent.md)
- [pf-reviewer.agent.md](.github/agents/pf-reviewer.agent.md)

Evidence: a workspace search for `Confidence, Accuracy & Best Practices` returns 18 agent matches; these 8 are absent. The newer agents (pf-analyst, pf-futurist, pf-documenter, pf-task-planner, pf-qa-engineer, pf-security-auditor, and all focused/orchestrator agents) all include it.
Fix (minimal): add one bullet to each agent's rules/constraints, e.g. `- MAXIMIZE confidence & accuracy and follow best practices per `.github/copilot-instructions.md` → "Confidence, Accuracy & Best Practices": evidence-backed, explicit confidence, no bluffing.` — phrased to the agent's role.
Confidence: 99% (this is a documented convention gap, not a functional break).

---

## Axis 2 — Reference integrity

**Pass (verified to exist):**
- **Blueprints** (`system-designs/`): `saas-platform.md`, `backend-scalable.md`, `frontend-architecture.md`, `ai-integration.md`, `auth-rbac/`, `INDEX.md` — all present.
- **Hooks** (`hooks/security/`): `secret-scanner`, `security-scanner`, `env-file-protection`, `file-protection` — all present.
- **Commands** (`commands/marketing/`): `publisher-x`, `publisher-linkedin`, `publisher-medium`, `publisher-devto`, `publisher-all` — all present.
- **Skills**: `skills/creative-design/ui-ux-pro-max/data/colors.csv` — present.
- **`agents:` allowlists**: all 13 allowlists resolve to real `.github/agents/*.agent.md` basenames, including `project-manager`'s 12-agent roster.
- **Personas** referenced in agent bodies — verified present in `agents.json` (~57 names), including: code-reviewer, security-auditor, architect-reviewer, product-strategist, trend-analyst, penetration-tester, supply-chain-security, compliance-auditor, api-security-audit, qa-expert, test-automator, test-engineer, playwright-tester, accessibility-tester, load-testing-specialist, technical-writer, documentation-engineer, api-documenter, backend-architect, backend-developer, api-designer, python-pro, golang-pro, postgres-pro, database-optimizer, frontend-developer, react-specialist, nextjs-developer, typescript-pro, ui-ux-designer, code-architect, se-system-architecture-reviewer, cloud-architect, microservices-architect, database-architect, diagram-architect, business-analyst, product-manager, competitive-analyst, market-researcher, ux-researcher, content-marketer, seo-specialist, social-media-copywriter, marketing-attribution-analyst, fullstack-developer, llm-architect, ai-engineer, prompt-engineer, machine-learning-engineer, mlops-engineer, cli-developer, fintech-engineer, data-engineer, payment-integration, security-engineer.

**Finding:**

### [Critical] `code-archaeologist` persona does not exist — broken reference in pf-analyst
[pf-analyst.agent.md:17](.github/agents/pf-analyst.agent.md#L17) instructs: *"Read and apply `code-archaeologist`, `architect-reviewer`, and `security-auditor` from `agents/` (resolve paths via `.factory/index/agents.json`)."* The same name is also asserted in its description at [pf-analyst.agent.md:2](.github/agents/pf-analyst.agent.md#L2).
Evidence: `code-archaeologist` is **absent from `.factory/index/agents.json`** and **no file matches `**/code-archaeologist*`** on disk (also no `archaeolog`/`archeolog` entry anywhere). The other two personas in the same line resolve correctly. So the agent will fail to load one of its three core personas, silently degrading the analysis.
Fix (minimal): replace `code-archaeologist` with a real, indexed equivalent — recommended **`code-explorer`** (`agents.json` line 801; codebase exploration/archaeology) or **`legacy-modernizer`** (`agents/modernization/legacy-modernizer.md`, `agents.json` line 2052). Update both line 2 (description) and line 17 (body).
Confidence: 100% (verified absent in index and filesystem; replacements verified present).

---

## Axis 3 — Real-world freshness

Most agents are deliberately tech-agnostic (they reference personas and blueprints rather than pinned versions), so freshness exposure is low. Spot-checks below.

### [High] Cost rule recommends PlanetScale as a free-tier option — PlanetScale has no free tier
- [copilot-instructions.md:156](.github/copilot-instructions.md#L156): *"Prefer **Supabase/PlanetScale** over custom DB infra for new projects"*, under a "Cost Optimization" section whose sibling rule states *"Never suggest paid tooling when free-tier equivalents exist for same use case."*
- [routing.md:29](.factory/routing.md#L29) (Web app row) and [routing.md:106](.factory/routing.md#L106) (cross-cutting cost rule) both list *"Supabase or PlanetScale"* as the managed-DB default — these drive `pf-architect`'s stack choice.
- Real-world state: PlanetScale **retired its free "Hobby" tier in April 2024**; per https://planetscale.com/pricing (generated 2026-06-27), the cheapest plan is the **PS-5 non-HA at $5/month**, with **no $0 option**. Supabase, by contrast, still offers a free tier (current).
- Impact: pairing PlanetScale with a "free-tier-first" cost rule is internally contradictory and steers zero-budget/prototype projects (the factory's default audience) to a paid-only service.
Affects: `pf-architect` (consumes `routing.md`), and any agent honoring the brain cost rules.
Fix (minimal, not applied): in `routing.md` and `copilot-instructions.md`, make Supabase the free-tier default and reposition PlanetScale as a "paid scale-up" option (or replace with Neon/Turso, which retain free tiers — verify before applying).
Confidence: 95% (pricing page confirms no $0 SKU; the April-2024 Hobby-tier removal is widely reported — recommend a second citation before editing shared config).

### Freshness — no drift found (verified current)
- `routing.md` stack hints — Next.js **App Router** + TypeScript + Tailwind, FastAPI, Typer/Click, Cobra/Go — all current, recommended defaults.
- `accessibility-tester` persona targets **WCAG 2.2** (current standard).
- `frontend-engineer` "static generation over SSR when not real-time" and `pf-builder` dependency-order/test guidance — still standard best practice.
- No agent hardcodes an LLM model name or a pinned framework version, so there is no model-deprecation exposure in the agent files themselves.

---

## Axis 4 — Index & config health

**Pass — no re-index required.**
- `index/manifest.json` `generated_at` = **2026-06-25T16:45Z**; counts: agents 422, commands 341, skills 832, designs 61, system-designs 6.
- `git log` for `agents/ commands/ skills/ design-md/ system-designs/` shows a single commit (`init`, 2026-06-24), and a filesystem scan finds **no library file with `LastWriteTime` newer than the manifest**. The catalogs therefore reflect the current library.
- The `code-archaeologist` gap (Critical, above) is an **agent-file** error, not an index error — the index correctly omits a persona that does not exist.
- `routing.md` rows otherwise reference valid library entries (personas/designs/hooks/commands all verified).

**Finding:**

### [Low] `README.md` Project Manager diagram omits the `agent-maintainer` route
[.factory/README.md](.factory/README.md) — the Project Manager mermaid diagram lists 11 routed agents (factory, evolver, documentor, security, QA, architect, BE, FE, CEO, creative, marketing) but **omits `agent-maintainer`**, which *is* in the manager's `agents:` allowlist and routing table ([project-manager.agent.md:6](.github/agents/project-manager.agent.md#L6) and its roster table). Minor doc/agent drift.
Fix (minimal): add an `M --> AM[Agent Maintainer]` edge to the diagram.
Confidence: 90%.

---

## Cross-cutting / shared-rule findings
- **Shared config (`copilot-instructions.md` + `routing.md`)**: the PlanetScale freshness item (High) lives in shared rules, so a fix there propagates to **every** agent that honors the cost rules — flag for explicit review before editing.
- **Convention drift (Medium)**: the 8 missing-confidence-line agents are all the *oldest* (Project Factory pipeline), suggesting the confidence/best-practices convention was introduced after they were authored and never backfilled. A single consistent backfill closes the gap.

---

## Freshness log (what the real world says now)
- **PlanetScale** — no free tier; cheapest SKU PS-5 non-HA **$5/mo** (single node). Source: planetscale.com/pricing, generated 2026-06-27. Affects: `routing.md` rows 1 & 5, `copilot-instructions.md` cost rules, `pf-architect`.
- **Supabase** — free tier still offered (current). Safe as the free-default managed DB.
- **Next.js App Router / FastAPI / Typer / Cobra / WCAG 2.2** — all current; no change recommended.

---

## Prioritized fix list (recommended order — NOT applied)
1. **[Critical]** `pf-analyst` — replace `code-archaeologist` → `code-explorer` (lines 2 and 17). One-agent, zero-risk swap to a verified persona.
2. **[High]** Shared config — resolve the PlanetScale "free-tier" contradiction in `routing.md` (L29, L106) and `copilot-instructions.md` (L156); confirm the chosen replacement's free tier with a second dated source first. *Touches shared rules → affects all agents.*
3. **[Medium]** Backfill the explicit confidence/best-practices bullet into the 8 original pipeline agents (`project-factory` + 7 `pf-*` factory workers) for full convention conformance.
4. **[Low]** Add the `agent-maintainer` node to the Project Manager diagram in `.factory/README.md`.

---

## Applied changes (fix mode)
- None — this was an audit/report-only pass per the request.

## Recommended (not applied)
- Items 1–4 above. After fixes, re-run the relevant checks and (only if library files change) `python .factory/build-index.py`. The index itself is currently up to date.

</details>

