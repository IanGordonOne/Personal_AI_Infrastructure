# Obsidian Backend Profile

## Identity

- **Name:** Obsidian
- **Marker:** `.obsidian/` config directory at vault root
- **Type:** Local markdown vault with flat prose structure

## Discovery

```bash
# Common Obsidian vault locations (macOS)
for dir in "$HOME/Documents" "$HOME/Obsidian" \
  "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents" \
  "$HOME/Desktop" "$HOME/Dropbox"; do
  find "$dir" -maxdepth 3 -name ".obsidian" -type d 2>/dev/null | while read odir; do
    VAULT_ROOT="$(dirname "$odir")"
    echo "$(basename "$VAULT_ROOT")|Obsidian|$VAULT_ROOT"
  done
done
```

Output format: `{name}|Obsidian|{path}` — one line per discovered vault.

## Graph Root Structure

```
$GRAPH_ROOT/
  .obsidian/        # Obsidian config directory
  Daily Notes/      # Default daily notes folder (configurable)
  Templates/        # User templates (optional)
  Attachments/      # Attached files (optional)
  *.md              # Pages at vault root or in user-defined folders
```

Note: Obsidian does not enforce a `pages/` directory. Pages may live at the vault root or in user-defined folders.

## Pages Directory

`$GRAPH_ROOT/` (vault root by default)

If the user has organized their vault with a dedicated knowledge folder, detect it:

```bash
for folder in "Knowledge" "Notes" "Pages" "Zettelkasten"; do
  if [ -d "$GRAPH_ROOT/$folder" ]; then
    echo "$GRAPH_ROOT/$folder"
    break
  fi
done
```

If none found, use vault root. Users can override in the skill customization file.

## Property Format

Obsidian uses **YAML frontmatter** between `---` fences at the top of the file:

```yaml
---
type: knowledge
category: Technical Architecture
short: One-sentence summary here
related:
  - "[[Page One]]"
  - "[[Page Two]]"
tags:
  - event-sourcing
  - ddd
  - architecture-patterns
source: session
project: My Project
created: 2026-03-04
last-updated: 2026-03-04
---
```

Rules:
- Wrapped in `---` fences (opening and closing)
- YAML syntax: `key: value`
- List values use YAML list syntax (one item per line, prefixed with `  - `)
- `related` values are wikilinks wrapped in quotes: `"[[Page Name]]"`
- `tags` values are plain kebab-case strings (no brackets, no hashes) — Obsidian auto-recognizes frontmatter tags
- Dates are plain strings: `YYYY-MM-DD` (no wikilink wrapping)

**Reading properties:** Parse YAML between `---` fences. Match `^{key}:\s*(.+)$` for scalar values, or parse YAML list for array values.

## Section Format

Obsidian uses **standard markdown** — flat prose with ATX headings:

```markdown
## Heading

Paragraph text as regular prose.

Another paragraph.

### Sub-heading

Sub-content as regular prose or bullet lists.

- Bullet item one
- Bullet item two
```

Rules:
- Headings use `## `, `### ` etc. with no prefix
- Body text is regular markdown paragraphs
- Bullet lists use standard `- ` markdown list syntax
- Blank lines separate paragraphs and sections
- No tab-indentation hierarchy for non-list content

## Tag Format

**In frontmatter:** Tags are plain kebab-case strings in the `tags` YAML list:
```yaml
tags:
  - event-sourcing
  - ddd
```

**Inline:** Tags use `#tag-name` syntax in body text:
```markdown
This relates to #event-sourcing and #cqrs patterns.
```

Use frontmatter for the primary tag list; use inline `#tags` sparingly for emphasis.

## Date Format

Plain date strings: `YYYY-MM-DD` (no wikilink wrapping)

```yaml
created: 2026-03-04
last-updated: 2026-03-04
```

## Link Format

`[[Page Name]]` — standard wikilinks, same as LogSeq. Obsidian supports these natively.

Obsidian also supports display text: `[[Page Name|Display Text]]`.

## Filename Convention

- Spaces remain as spaces: `Cloud Architecture.md`
- Slashes in titles become dashes: `Cloud Architecture - AWS.md`
- Avoid `\ / :` in filenames (OS restrictions)
- Case is preserved (Obsidian is case-insensitive for link resolution but case-preserving for filenames)

## Journal Path

- **Directory:** `Daily Notes/` (Obsidian default; configurable in vault settings)
- **Filename pattern:** `YYYY-MM-DD.md` (hyphens between date parts)
- **Example:** `$GRAPH_ROOT/Daily Notes/2026-03-04.md`

To detect custom daily notes folder:
```bash
if [ -f "$GRAPH_ROOT/.obsidian/daily-notes.json" ]; then
  # Parse "folder" key from JSON config
  cat "$GRAPH_ROOT/.obsidian/daily-notes.json"
fi
```

If no config found, default to `Daily Notes/`.

## Existence Check

```bash
# Exact match
ls "$PAGES_DIR/{title}.md" 2>/dev/null

# Fuzzy match
ls "$PAGES_DIR/" | grep -i "{keyword}" 2>/dev/null
```

## Page Template

Complete example of an Obsidian knowledge page:

```markdown
---
type: knowledge
category: Technical Architecture
short: Event sourcing captures state changes as immutable events
related:
  - "[[CQRS]]"
  - "[[Domain Events]]"
  - "[[Event Store]]"
tags:
  - event-sourcing
  - ddd
  - architecture-patterns
source: session
project: My Project
created: 2026-03-04
last-updated: 2026-03-04
---

## Overview

Event sourcing is an architectural pattern where state changes are stored as a sequence of immutable events rather than mutable rows in a database.

## Key Concepts

- **Event Store** — append-only log of domain events
- **Projections** — read models built by replaying events
- **Snapshots** — periodic state captures to avoid full replay

## Details

### When to Use

- Audit trail requirements
- Complex domain logic with temporal queries

### Trade-offs

- Increased storage but full history
- Eventual consistency in read models

## Implications

Pair with [[CQRS]] for separate read/write optimization. Consider event versioning strategy early.
```
