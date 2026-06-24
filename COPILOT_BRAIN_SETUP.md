# Copilot Brain — Setup Guide

This repo is your shared engineering brain. Here's how to connect it to any project so GitHub Copilot works with full context — **zero infra cost**.

---

## Option A: Git Submodule (Best — One Update, All Projects Sync)

```bash
# In any project repo
git submodule add https://github.com/YOUR_USERNAME/KD-prompts .brain

# Add to .gitignore (optional — keeps it clean)
echo ".brain/" >> .gitignore
```

Then create `.github/copilot-instructions.md` in your project:

```markdown
# Engineering Brain

See full context library at `.brain/`

## Navigation
- Agents: `.brain/agents/`
- System Designs: `.brain/system-designs/`
- Design Systems: `.brain/design-md/`
- Commands: `.brain/commands/`
- Hooks: `.brain/hooks/`

## Rules
Follow all rules in `.brain/.github/copilot-instructions.md`
```

Update all projects at once:
```bash
git submodule update --remote --merge
```

---

## Option B: Copy Instructions Only (Simplest — No Submodule)

Just copy the one file that matters most:

```bash
curl -o .github/copilot-instructions.md \
  https://raw.githubusercontent.com/YOUR_USERNAME/KD-prompts/main/.github/copilot-instructions.md
```

Limitation: design systems and agents won't be referenced inline, but rules still apply.

---

## Option C: VS Code Workspace (Multi-Root — Best for Personal Dev)

Add this repo alongside your project in a `.code-workspace` file:

```json
{
  "folders": [
    { "path": ".", "name": "My Project" },
    { "path": "../KD-prompts", "name": "Brain" }
  ]
}
```

Copilot can now reference files from both roots. Use `#file:` in chat:
```
@workspace using #file:../KD-prompts/design-md/stripe/README.md build a billing page
```

---

## How Copilot Uses This (Zero-Config Part)

GitHub Copilot automatically reads `.github/copilot-instructions.md` in any open repo.

This means:
- Every suggestion follows your cost/simplicity rules
- Security rules apply on every completion
- Design system references are available

---

## How to Use in Chat (Power Usage)

### Reference a design system:
```
build a dashboard using #file:.brain/design-md/linear.app/README.md as the design reference
```

### Channel a specific agent:
```
read #file:.brain/agents/development-team/backend-architect.md and design the auth service
```

### Use a system design as base:
```
use #file:.brain/system-designs/saas-platform.md as the architecture — implement the billing webhook
```

### Use a command template:
```
follow #file:.brain/commands/setup/setup-ci-cd-pipeline.md to create our GitHub Actions workflow
```

---

## File Map (What Copilot Can Access)

```
.brain/                              ← submodule root
│
├── .github/
│   ├── copilot-instructions.md      ← AUTO-LOADED: master brain rules
│   └── instructions/                ← AUTO-LOADED by file pattern:
│       ├── frontend.instructions.md   (*.tsx, *.jsx, *.ts, *.css)
│       ├── backend.instructions.md    (routes/, api/, services/)
│       ├── testing.instructions.md   (*.test.ts, *.spec.ts)
│       └── devops.instructions.md    (*.yml, Dockerfile, workflows/)
│
├── system-designs/                  ← Reference with #file: in chat
│   ├── INDEX.md
│   ├── saas-platform.md
│   ├── frontend-architecture.md
│   ├── backend-scalable.md
│   └── ai-integration.md
│
├── agents/                          ← Channel with #file: in chat
│   ├── development-team/
│   ├── ai-specialists/
│   ├── security/
│   └── ...
│
├── design-md/                       ← 60+ brand design systems
│   ├── vercel/README.md
│   ├── stripe/README.md
│   └── ...
│
├── commands/                        ← Reusable task templates
│   ├── setup/
│   ├── testing/
│   └── ...
│
└── skills/                          ← Deep domain knowledge
    └── ...
```

---

## Cost

| Component | Cost |
|-----------|------|
| Git submodule | $0 |
| copilot-instructions.md auto-loading | $0 (built into Copilot) |
| .instructions.md domain files | $0 (built into Copilot) |
| #file: references in chat | $0 (uses existing Copilot subscription) |
| Total extra infra | **$0** |

The only cost is your existing GitHub Copilot subscription ($10–19/month).
