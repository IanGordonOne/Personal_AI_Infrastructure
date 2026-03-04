# Integrate Workflow

## Purpose

Extract all discrete knowledge topics from the current session and write them as structured LogSeq pages to a target graph. The primary and most common workflow.

## Trigger

"integrate knowledge", "save learnings to logseq", "write knowledge pages", "capture what we learned", "integrate session"

## Prerequisites

- Active session with substantive knowledge content (research, decisions, discoveries)
- Target LogSeq graph accessible on filesystem

## Procedure

### Step 1: Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Starting knowledge integration into LogSeq", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

### Step 2: Resolve Target Graph

Check if user specified a graph. If not, discover available graphs per `GraphRegistry.md`:

Run the discovery script from GraphRegistry.md to find available graphs, then apply selection rules:
1. User-specified graph takes priority
2. User-registered graphs (from customization file) take next priority
3. If only one graph found, use it
4. If multiple graphs found, present the list and ask the user

Set `GRAPH_ROOT` to the selected graph root (directory containing `pages/` and `journals/`).

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
- `tags` — 3-5 relevant tags as `[[wikilinks]]`
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

For each approved topic, check if a page already exists:

```bash
# Exact match
ls "$GRAPH_ROOT/pages/{title}.md" 2>/dev/null

# Fuzzy match for similar names
ls "$GRAPH_ROOT/pages/" | grep -i "{keyword}" 2>/dev/null
```

Mark each topic as **NEW** or **UPDATE** based on findings.

### Step 6: Generate and Write Pages

For each topic, generate a LogSeq page following the schema in `PageSchema.md`.

**For NEW pages:**
- Write the full page with all properties and appropriate section template
- Include `[[wikilinks]]` inline in body text where other topics are mentioned
- Ensure at least 1 cross-link in `related::`

**For UPDATE pages:**
1. Read existing page content
2. Identify which sections already exist
3. Merge: preserve existing high-quality sections, add new sections, enrich existing ones
4. Update `last-updated::` to today
5. Append new items to `related::` and `tags::`
6. Never remove existing content during merge

Write each page to `$GRAPH_ROOT/pages/{title}.md`.

### Step 7: Write Journal Entry

Write/append today's journal entry per `Workflows/JournalEntry.md`.

Journal path: `$GRAPH_ROOT/journals/{yyyy_mm_dd}.md`

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

**Graph:** {graph name}
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
Written to journals/{yyyy_mm_dd}.md

### Suggested Follow-ups
- Open LogSeq and verify page rendering
- Check [[wikilinks]] resolve correctly
- Review new topics for study opportunities
```

## Error Handling

- **Graph directory missing:** Ask user to confirm path or offer to create it
- **Page write failure:** Continue with remaining pages, report failures at end
- **No extractable knowledge:** Inform user that the session may be more procedural than knowledge-oriented; suggest a handoff/follow-up skill instead
- **Merge conflict on update:** Present both existing and new content, let user decide
