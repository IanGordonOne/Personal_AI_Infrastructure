---
name: KnowledgeIntegrate
description: Integrate session learnings into a LogSeq knowledge graph. Extracts knowledge topics from session context, generates structured LogSeq pages with cross-links, checks for duplicates, and writes a journal entry. USE WHEN "integrate knowledge", "save learnings", "write to logseq", "knowledge integrate", "capture what we learned", "write knowledge pages", "logseq pages", "save to graph", "integrate session", "knowledge pages".
---

# KnowledgeIntegrate — Session Learnings to LogSeq Graph

## Purpose

Extract discrete knowledge topics from the current session (research findings, project decisions, domain knowledge, architectural patterns) and write them as structured, cross-linked LogSeq pages to a target graph. Also writes/appends a journal entry for today linking all new and updated pages.

This skill captures **semantic memory** ("what I learned, weave it into knowledge"). For procedural memory ("what I did, remind me later"), use a separate handoff/follow-up skill.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/KnowledgeIntegrate/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. These override defaults.

## Graph Discovery

See `GraphRegistry.md` for graph discovery logic and how to register your LogSeq graphs.

**Selection rules:**
1. If user specifies a graph by name or path, use that
2. If only one graph is discovered, use it
3. If multiple graphs exist, present the list and ask the user
4. Default: the first graph discovered (general-purpose personal knowledge)

## Workflow Routing

| Workflow | Trigger | File |
|---|---|---|
| **Integrate** | "integrate knowledge", "save learnings to logseq", "write knowledge pages", "capture what we learned" | `Workflows/Integrate.md` |
| **UpdatePages** | "update [page] in logseq", "add to [page]", "enrich knowledge page" | `Workflows/UpdatePages.md` |
| **JournalEntry** | "write journal entry", "today's journal", "logseq journal" | `Workflows/JournalEntry.md` |

## Voice Notification

Fire-and-forget TTS notification on workflow start:

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Starting knowledge integration into LogSeq", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Key Resources

| Resource | Purpose |
|---|---|
| `PageSchema.md` | Property definitions and section templates by content type |
| `CategoryTaxonomy.md` | Domain-agnostic knowledge categories |
| `GraphRegistry.md` | LogSeq graph discovery and registration |

## Key Design Decisions

- **Agent-driven, no CLI tool** — Claude extracts topics from session context, structures pages, writes files directly. A CLI tool can be added later if a programmatic interface is needed.
- **Deduplication by filename** — Before writing, check if `pages/{title}.md` exists. If so, merge rather than duplicate.
- **Journal as linking hub** — Today's journal entry links all new/updated pages, providing temporal context.
- **User approval gate** — The Integrate workflow presents extracted topics to the user before writing, preventing unwanted pages.
- **Filename convention** — Spaces remain as spaces in filenames (e.g., `Cloud Architecture.md`). The graph's `:file/name-format :triple-lowbar` only applies to slashes in page titles.
- **LogSeq-first, abstraction planned** — v1 writes LogSeq markdown directly (inline properties, outliner blocks, `[[wikilinks]]`). The underlying concepts (structured pages, cross-linking, journals, categories, deduplication) are storage-agnostic. A future version will introduce a graph writer abstraction to support additional backends (Obsidian, Notion, etc.). Obsidian is the planned second target — close enough to validate the abstraction (both local markdown + wikilinks), different enough to force it (YAML frontmatter, flat prose, `#tags`, different journal paths).

## Examples

**Example 1: Full session integration (most common)**
```
User: "Integrate what we learned into my LogSeq graph"

-> Invokes Integrate workflow (Workflows/Integrate.md)
-> Analyzes session context: identifies 5 knowledge topics from API research
-> Presents topic list to user for approval
-> Checks graph for existing pages on each topic
-> Writes 4 new pages, updates 1 existing page with new findings
-> Writes journal entry for today linking all 5 pages
-> Reports: 4 new, 1 updated, journal entry written
```

**Example 2: Targeted page update**
```
User: "Add what we just learned about caching strategies to the logseq page"

-> Invokes UpdatePages workflow (Workflows/UpdatePages.md)
-> Reads existing "Caching Strategies" page from graph
-> Merges new sections, updates last-updated:: property
-> Appends note to today's journal entry
```

**Example 3: Multiple graphs available**
```
User: "Save these learnings to my knowledge graph"

-> Invokes Integrate workflow
-> Discovers 2 graphs: "Personal KB" and "Work Notes"
-> Asks user which graph to target
-> Proceeds with selected graph
```

**Example 4: Journal-only**
```
User: "Write a logseq journal entry about today's session"

-> Invokes JournalEntry workflow (Workflows/JournalEntry.md)
-> Writes today's journal with session summary and page links
-> No new knowledge pages created
```
