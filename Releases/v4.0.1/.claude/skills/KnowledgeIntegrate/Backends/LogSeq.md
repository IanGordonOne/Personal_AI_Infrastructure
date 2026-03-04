# LogSeq Backend Profile

## Identity

- **Name:** LogSeq
- **Marker:** `logseq/` config directory at graph root, or `pages/` directory
- **Type:** Local markdown graph with outliner structure

## Discovery

```bash
# macOS iCloud sync (LogSeq default on iOS/macOS)
find "$HOME/Library/Mobile Documents/iCloud~com~logseq~logseq/Documents" \
  -maxdepth 2 -name "pages" -type d 2>/dev/null | while read dir; do
  echo "$(basename $(dirname "$dir"))|LogSeq|$(dirname "$dir")"
done

# Common local paths
for dir in "$HOME/Documents" "$HOME/.logseq" "$HOME/logseq" "$HOME/.config"; do
  find "$dir" -maxdepth 3 -name "pages" -type d 2>/dev/null | while read pdir; do
    echo "$(basename $(dirname "$pdir"))|LogSeq|$(dirname "$pdir")"
  done
done
```

Output format: `{name}|LogSeq|{path}` — one line per discovered graph.

## Graph Root Structure

```
$GRAPH_ROOT/
  logseq/          # LogSeq config directory
  pages/           # Knowledge pages
  journals/        # Daily journal entries
  assets/          # Attached files (optional)
```

## Pages Directory

`$GRAPH_ROOT/pages/`

All knowledge pages are written to the `pages/` subdirectory.

## Property Format

LogSeq uses **inline properties** at the top of the page, one per line, with `::` separator:

```
type:: knowledge
category:: Technical Architecture
short:: One-sentence summary here
related:: [[Page One]], [[Page Two]]
tags:: [[Tag One]], [[Tag Two]], [[Tag Three]]
source:: session
project:: My Project
created:: [[2026-03-04]]
last-updated:: [[2026-03-04]]
```

Rules:
- No wrapping syntax (no fences)
- Properties appear on the first lines of the file, before any heading
- Each property is `key:: value` (double colon)
- List values (related, tags) are comma-separated `[[wikilinks]]`
- Session log property: `session-log:: [[YYYY-MM-DD]] — description`

**Reading properties:** Match `^{key}::\s*(.+)$` on each line.

## Section Format

LogSeq uses **outliner blocks** — every line is prefixed with `- ` and hierarchy is expressed through tab indentation:

```
- ## Heading
	- Paragraph text as a block
	- Another block
	- ### Sub-heading
		- Sub-content block
		- Bullet list items are also blocks
```

Rules:
- Every line starts with `- ` (dash space)
- Child blocks are indented one tab deeper than their parent
- Headings use `## `, `### ` etc. after the `- ` prefix
- Body text after a heading is indented one level under that heading

## Tag Format

**In properties:** Tags are `[[wikilinks]]` in the `tags::` property:
```
tags:: [[Docker]], [[Kubernetes]], [[Infrastructure]]
```

**Inline:** Tags can also appear as `[[wikilinks]]` in body text. LogSeq treats all `[[wikilinks]]` as bidirectional links.

## Date Format

Dates in properties are wrapped as wikilinks: `[[YYYY-MM-DD]]`

```
created:: [[2026-03-04]]
last-updated:: [[2026-03-04]]
```

This creates a bidirectional link to the date page.

## Link Format

`[[Page Name]]` — standard wikilinks. Same in body text and properties.

## Filename Convention

- Spaces remain as spaces: `Cloud Architecture.md`
- Slashes in titles become `___` (triple underscore) per `:file/name-format :triple-lowbar`
- Special characters (`%`, `"`, `?`) use percent-encoding
- Case preserved exactly (LogSeq is case-sensitive)

## Journal Path

- **Directory:** `journals/`
- **Filename pattern:** `YYYY_MM_DD.md` (underscores between date parts)
- **Example:** `$GRAPH_ROOT/journals/2026_03_04.md`

## Existence Check

```bash
# Exact match
ls "$PAGES_DIR/{title}.md" 2>/dev/null

# Fuzzy match
ls "$PAGES_DIR/" | grep -i "{keyword}" 2>/dev/null
```

## Page Template

Complete example of a LogSeq knowledge page:

```
type:: knowledge
category:: Technical Architecture
short:: Event sourcing captures state changes as immutable events
related:: [[CQRS]], [[Domain Events]], [[Event Store]]
tags:: [[Event Sourcing]], [[DDD]], [[Architecture Patterns]]
source:: session
project:: My Project
created:: [[2026-03-04]]
last-updated:: [[2026-03-04]]
session-log:: [[2026-03-04]] — EDA research session

- ## Overview
	- Event sourcing is an architectural pattern where state changes are stored as a sequence of immutable events rather than mutable rows in a database.
- ## Key Concepts
	- **Event Store** — append-only log of domain events
	- **Projections** — read models built by replaying events
	- **Snapshots** — periodic state captures to avoid full replay
- ## Details
	- ### When to Use
		- Audit trail requirements
		- Complex domain logic with temporal queries
	- ### Trade-offs
		- Increased storage but full history
		- Eventual consistency in read models
- ## Implications
	- Pair with [[CQRS]] for separate read/write optimization
	- Consider event versioning strategy early
```
