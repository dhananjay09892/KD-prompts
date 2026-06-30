"""Project Factory — Library Indexer.

Scans the KD-prompts library and emits compact JSON catalogs that the
multi-agent pipeline (.github/agents/*.agent.md) uses to route a project
idea to the right agents, commands, skills, and design systems.

Run from the repo root:

    python .factory/build-index.py

Outputs to .factory/index/:
    agents.json, commands.json, skills.json, designs.json, system-designs.json
    manifest.json  (counts + generated-at timestamp)

Pure standard library — no external dependencies, no network calls.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
INDEX_DIR = Path(__file__).resolve().parent / "index"

DESC_MAX = 280  # truncate long descriptions to keep catalogs small

# ---------------------------------------------------------------------------
# Frontmatter / text helpers
# ---------------------------------------------------------------------------
_FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_EXAMPLE_RE = re.compile(r"<example>.*?</example>", re.DOTALL | re.IGNORECASE)
_COMMENTARY_RE = re.compile(r"<commentary>.*?</commentary>", re.DOTALL | re.IGNORECASE)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        try:
            return path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            return ""


def split_frontmatter(text: str) -> tuple[str, str]:
    """Return (frontmatter_block, body). Empty frontmatter if none found."""
    match = _FM_RE.match(text)
    if not match:
        return "", text
    return match.group(1), text[match.end():]


def parse_simple_yaml(block: str) -> dict[str, str]:
    """Minimal frontmatter parser for top-level `key: value` pairs.

    Handles quoted values and values that continue across following indented
    or non-key lines (enough for `name`, `description`, `argument-hint`,
    `tools`, `model`). Not a full YAML parser by design.
    """
    fields: dict[str, str] = {}
    current_key: str | None = None
    key_re = re.compile(r"^([A-Za-z][A-Za-z0-9_-]*):\s?(.*)$")

    for raw in block.splitlines():
        line = raw.rstrip("\n")
        match = key_re.match(line)
        if match and not line.startswith((" ", "\t", "-")):
            current_key = match.group(1).strip().lower()
            fields[current_key] = match.group(2).strip()
        elif current_key is not None and line.strip():
            # continuation of the previous value (folded)
            fields[current_key] += " " + line.strip()

    return fields


def clean_desc(value: str) -> str:
    """Strip example/commentary blocks, quotes, and escape noise; truncate."""
    if not value:
        return ""
    value = _EXAMPLE_RE.sub("", value)
    value = _COMMENTARY_RE.sub("", value)
    value = value.replace("\\n", " ").replace("\\t", " ").replace('\\"', '"')
    value = value.strip().strip('"').strip("'").strip()
    value = re.sub(r"\s+", " ", value)
    if len(value) > DESC_MAX:
        value = value[: DESC_MAX - 1].rstrip() + "\u2026"
    return value


def rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def category_of(path: Path, root_name: str) -> str:
    """First path segment under the given root folder."""
    parts = path.relative_to(REPO_ROOT / root_name).parts
    return parts[0] if len(parts) > 1 else ""


# ---------------------------------------------------------------------------
# Collectors
# ---------------------------------------------------------------------------
def index_frontmatter_dir(root_name: str, *, name_fallback_from_filename: bool) -> list[dict]:
    """Index every *.md under a root folder, reading name/description from frontmatter."""
    root = REPO_ROOT / root_name
    if not root.exists():
        return []
    entries: list[dict] = []
    for path in sorted(root.rglob("*.md")):
        text = read_text(path)
        fm, _ = split_frontmatter(text)
        fields = parse_simple_yaml(fm)
        name = fields.get("name") or (path.stem if name_fallback_from_filename else "")
        entry = {
            "name": name,
            "category": category_of(path, root_name),
            "description": clean_desc(fields.get("description", "")),
            "path": rel(path),
        }
        if fields.get("argument-hint"):
            entry["argument_hint"] = clean_desc(fields["argument-hint"])
        if fields.get("tools"):
            entry["tools"] = clean_desc(fields["tools"])
        entries.append(entry)
    return entries


def index_skills() -> list[dict]:
    """Index every SKILL.md (folder == skill)."""
    root = REPO_ROOT / "skills"
    if not root.exists():
        return []
    entries: list[dict] = []
    for path in sorted(root.rglob("SKILL.md")):
        text = read_text(path)
        fm, _ = split_frontmatter(text)
        fields = parse_simple_yaml(fm)
        rel_parts = path.relative_to(root).parts
        entries.append({
            "name": fields.get("name") or path.parent.name,
            "category": rel_parts[0] if rel_parts else "",
            "description": clean_desc(fields.get("description", "")),
            "path": rel(path),
        })
    return entries


def index_designs() -> list[dict]:
    """Index design-md brand README.md files (no frontmatter -> use H1 + theme)."""
    root = REPO_ROOT / "design-md"
    if not root.exists():
        return []
    entries: list[dict] = []
    for brand_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        readme = brand_dir / "README.md"
        if not readme.exists():
            continue
        text = read_text(readme)
        # H1 title
        h1 = next((ln[2:].strip() for ln in text.splitlines() if ln.startswith("# ")), brand_dir.name)
        # first meaningful paragraph after any heading
        theme = ""
        for ln in text.splitlines():
            s = ln.strip()
            if s and not s.startswith(("#", "-", "*", "|", "`", ">")):
                theme = s
                break
        entries.append({
            "name": brand_dir.name,
            "title": h1,
            "description": clean_desc(theme),
            "path": rel(readme),
        })
    return entries


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    catalogs = {
        "agents": index_frontmatter_dir("agents", name_fallback_from_filename=True),
        "commands": index_frontmatter_dir("commands", name_fallback_from_filename=True),
        "skills": index_skills(),
        "designs": index_designs(),
        "system-designs": index_frontmatter_dir("system-designs", name_fallback_from_filename=True),
    }

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "counts": {key: len(value) for key, value in catalogs.items()},
        "color_palettes": "skills/creative-design/ui-ux-pro-max/data/colors.csv",
    }

    for key, value in catalogs.items():
        out = INDEX_DIR / f"{key}.json"
        out.write_text(json.dumps(value, indent=1, ensure_ascii=False), encoding="utf-8")

    (INDEX_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print("Project Factory index built ->", INDEX_DIR.relative_to(REPO_ROOT).as_posix())
    for key, count in manifest["counts"].items():
        print(f"  {key:16} {count:>5}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
