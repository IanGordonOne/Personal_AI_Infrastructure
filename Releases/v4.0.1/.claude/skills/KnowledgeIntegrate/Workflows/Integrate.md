# Integrate Workflow

## Purpose

Extract all discrete knowledge topics from the current session and write them as structured pages to a target knowledge graph. The primary and most common workflow.

## Trigger

"integrate knowledge", "save learnings", "write knowledge pages", "capture what we learned", "integrate session"

## Prerequisites

- Active session with substantive knowledge content (research, decisions, discoveries)
- Target knowledge graph accessible on filesystem

## Procedure

### Step 1: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Starting knowledge integration", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

### Step 2: Resolve Target Graph and Backend

Check if user specified a graph. If not, discover available graphs per `GraphRegistry.md` — this runs each backend's discovery and merges results.

Apply selection rules from GraphRegistry.md to choose a graph. Then:

1. Set `GRAPH_ROOT` to the selected graph root
2. Determine the backend type (per GraphRegistry.md **Backend Detection**)
3. Load `Backends/{backend}.md` into context
4. Set `PAGES_DIR` from the backend's **Pages Directory** section
5. Set `JOURNAL_DIR` and `JOURNAL_PATTERN` from the backend's **Journal Path** section

### Step 3: Extract Knowledge Topics

Analyze session context (conversation history, files read/written, research performed, decisions made) to identify discrete knowledge topics.

**For each potential topic, assess:**
- **Is it knowledge?** Facts, patterns, architecture -> YES (this skill). Procedures, what-we-did -> NO (consider a procedural handoff skill instead).
- **Is it substantive?** At least 3-4 meaningful bullets of content.
- **Is it reusable?** Would it be useful in a future session about a related but different topic?

**Classify each topic:**
- `title` — Clear, specific page name (e.g., "Event Sourcing Patterns" not "Architecture")
- `category` — From `CategoryTaxonomy.md`
- `type` — From `PageSchema.md` (knowledge, architecture, decision, reference, glossary-term)
- `tags` — 3-5 relevant tags (format per active backend's **Tag Format**)
- `related` — Cross-links to other topics in the batch AND existing graph pages
- `signals` — Zero or more of: `plan`, `work` (see `JournalEntry.md` Step 3 for signal definitions). Assign `plan` when the topic captures a decision or intention for future work. Assign `work` when the topic documents completed implementation or progress.

### Step 4: Present Topics for User Approval

Present the extracted topic list before writing:

```
I've identified N knowledge topics from this session:

| # | Title | Category | Type | Signals | Action |
|---|-------|----------|------|---------|--------|
| 1 | Event Sourcing Patterns | Technical Architecture | knowledge | — | NEW |
| 2 | API Gateway Design | Technical Architecture | architecture | plan, work | UPDATE |
| ... | ... | ... | ... | ... | ... |

Proceed with writing all N? Or adjust any?
```

The **Signals** column shows `plan` and/or `work` when the topic documents plans made or work completed. These drive the "Plans Made" and "Work Done" sections in the journal entry.

Wait for user confirmation. Remove or adjust topics as requested.

### Step 5: Scan for Existing Pages

For each approved topic, check if a page already exists using the active backend's **Existence Check** method:

1. Exact filename match in `$PAGES_DIR`
2. Fuzzy search (case-insensitive) in `$PAGES_DIR`

Mark each topic as **NEW** or **UPDATE** based on findings.

### Step 6: Generate and Write Pages

For each topic, generate a page following the abstract schema in `PageSchema.md`, rendered using the active backend's conventions:

- **Property Format** — for the metadata block
- **Section Format** — for headings and body content
- **Tag Format** — for tags in properties and inline
- **Date Format** — for created and last-updated values
- **Link Format** — for cross-references
- **Filename Convention** — for the output filename

**For NEW pages:**
- Write the full page with all properties and appropriate section template
- Include cross-links inline in body text where other topics are mentioned
- Ensure at least 1 cross-link in `related`

**For UPDATE pages:**
1. Read existing page content
2. Parse properties using the active backend's **Property Format** rules
3. Parse sections using the active backend's **Section Format** rules
4. Merge: preserve existing high-quality sections, add new sections, enrich existing ones
5. Update `last-updated` to today
6. Append new items to `related` and `tags`
7. Never remove existing content during merge

Write each page to `$PAGES_DIR/{title}.md`.

### Step 7: Write Journal Entry

Write/append today's journal entry per `Workflows/JournalEntry.md`.

Journal path: `$GRAPH_ROOT/{JOURNAL_DIR}/{today per JOURNAL_PATTERN}`

The entry links all new and updated pages with one-line summaries. Pass each topic's `signals` classification (plan/work) so the journal entry includes "Plans Made" and "Work Done" sections when applicable (see JournalEntry.md Step 3-4).

### Step 7b: Update Project Auto-Memory

If the session is in a project with a `MEMORY.md` file (at `~/.claude/projects/<project>/memory/MEMORY.md`), check whether the knowledge captured this session should also be reflected there. Project auto-memory tracks:
- Implementation status, architecture decisions, key file paths
- Workflow preferences, tooling decisions
- Anything a future session in the same project would need

Read the current `MEMORY.md`, identify any sections that should be updated based on the knowledge just integrated, and update them. Do not duplicate content that already exists. Create new topic files (e.g., `memory/<topic>.md`) for detailed notes if needed, and link from MEMORY.md.

### Step 8: Report

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Knowledge integration complete. N pages written to GRAPH_NAME.", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

Provide a summary:

```
## Knowledge Integration Complete

**Graph:** {graph name} ({backend name})
**Date:** {today}

### New Pages ({count})
| Page | Category | Cross-links |
|------|----------|-------------|
| [[Page Title]] | Category | [[Link1]], [[Link2]] |

### Updated Pages ({count})
| Page | What Changed |
|------|-------------|
| [[Page Title]] | Added section on X, updated related links |

### Plans Made ({count, if any})
| Page | Decision / Intention |
|------|---------------------|
| [[Page Title]] | Plan to implement X using Y |

### Work Done ({count, if any})
| Page | Milestone |
|------|-----------|
| [[Page Title]] | Implemented X — N tests passing |

### Journal Entry
Written to {journal path}

### Suggested Follow-ups
- Open {backend name} and verify page rendering
- Check cross-links resolve correctly
- Review new topics for study opportunities
```

## Error Handling

- **Graph directory missing:** Ask user to confirm path or offer to create it
- **Page write failure:** Continue with remaining pages, report failures at end
- **No extractable knowledge:** Inform user that the session may be more procedural than knowledge-oriented; suggest a handoff/follow-up skill instead
- **Merge conflict on update:** Present both existing and new content, let user decide
- **Unknown backend:** Ask user to specify or create a backend profile
