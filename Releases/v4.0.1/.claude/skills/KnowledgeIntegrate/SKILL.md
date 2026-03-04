---
name: KnowledgeIntegrate
description: Integrate session learnings into a knowledge graph. Extracts knowledge topics from session context, generates structured pages with cross-links, checks for duplicates, and writes a journal entry. Supports multiple backends (LogSeq, Obsidian). USE WHEN "integrate knowledge", "save learnings", "write to logseq", "knowledge integrate", "capture what we learned", "write knowledge pages", "logseq pages", "save to graph", "integrate session", "knowledge pages", "sync to obsidian".
---

# KnowledgeIntegrate — Session Learnings to Knowledge Graph

## Purpose

Extract discrete knowledge topics from the current session (research findings, project decisions, domain knowledge, architectural patterns) and write them as structured, cross-linked pages to a target knowledge graph. Also writes/appends a journal entry for today linking all new and updated pages.

Supports multiple backends: **LogSeq** and **Obsidian** (with more possible). Each backend defines its own formatting conventions in `Backends/{name}.md`.

This skill captures **semantic memory** ("what I learned, weave it into knowledge"). For procedural memory ("what I did, remind me later"), use a separate handoff/follow-up skill.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/KnowledgeIntegrate/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. These override defaults.

## Graph Discovery

See `GraphRegistry.md` for multi-backend graph discovery and how to register your graphs.

**Selection rules:**
1. If user specifies a graph by name or path, use that
2. If only one graph is discovered, use it
3. If multiple graphs exist, present the list and ask the user
4. Default: the first graph discovered (general-purpose personal knowledge)

## Backend Resolution

After discovering a target graph, determine which backend it uses:

1. Read `GraphRegistry.md` — discovery returns graph path AND backend type
2. Load `Backends/{backend}.md` into context
3. All subsequent formatting, path, and discovery operations use the loaded backend profile

The active backend profile is determined ONCE per workflow invocation and applies to all pages written in that run. See `Backends/LogSeq.md` and `Backends/Obsidian.md` for the supported backends.

## Workflow Routing

| Workflow | Trigger | File |
|---|---|---|
| **Integrate** | "integrate knowledge", "save learnings", "write knowledge pages", "capture what we learned" | `Workflows/Integrate.md` |
| **UpdatePages** | "update [page]", "add to [page]", "enrich knowledge page" | `Workflows/UpdatePages.md` |
| **JournalEntry** | "write journal entry", "today's journal" | `Workflows/JournalEntry.md` |

## Voice Notification

Fire-and-forget TTS notification on workflow start:

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Starting knowledge integration", "voice_enabled": true}' \
  > /dev/null 2>&1 &
```

## Key Resources

| Resource | Purpose |
|---|---|
| `PageSchema.md` | Abstract property definitions and section templates by content type |
| `CategoryTaxonomy.md` | Domain-agnostic knowledge categories |
| `GraphRegistry.md` | Multi-backend graph discovery and registration |
| `Backends/LogSeq.md` | LogSeq formatting conventions and discovery |
| `Backends/Obsidian.md` | Obsidian formatting conventions and discovery |

## Key Design Decisions

- **Multi-backend via Backend Profiles** — Each backend is a self-contained markdown file defining formatting conventions (properties, sections, tags, dates, journal paths, filenames). Workflows reference "the active backend's Property Format" etc. rather than hardcoding any single tool's format. Inspired by the `KBFormat` interface pattern in `_DOC_TO_KB/Tools/KBSync.ts`.
- **Agent-driven, no CLI tool** — Claude extracts topics from session context, structures pages, writes files directly. A CLI tool can be added later if a programmatic interface is needed.
- **Deduplication by filename** — Before writing, check if a page with the same title exists. If so, merge rather than duplicate.
- **Journal as linking hub** — Today's journal entry links all new/updated pages, providing temporal context.
- **User approval gate** — The Integrate workflow presents extracted topics to the user before writing, preventing unwanted pages.

## Examples

**Example 1: Full session integration — LogSeq**
```
User: "Integrate what we learned into my LogSeq graph"

-> Invokes Integrate workflow (Workflows/Integrate.md)
-> Discovers LogSeq graph, loads Backends/LogSeq.md
-> Analyzes session: identifies 5 knowledge topics from API research
-> Presents topic list to user for approval
-> Writes 4 new pages (inline properties, outliner sections), updates 1
-> Writes journal entry to journals/2026_03_04.md
-> Reports: 4 new, 1 updated, journal entry written
```

**Example 2: Full session integration — Obsidian**
```
User: "Save these learnings to my Obsidian vault"

-> Invokes Integrate workflow
-> Discovers Obsidian vault, loads Backends/Obsidian.md
-> Analyzes session: identifies 3 knowledge topics
-> Writes pages with YAML frontmatter and flat markdown sections
-> Writes journal entry to Daily Notes/2026-03-04.md
```

**Example 3: Targeted page update**
```
User: "Add what we just learned about caching strategies to the knowledge page"

-> Invokes UpdatePages workflow (Workflows/UpdatePages.md)
-> Reads existing page, parses properties using active backend's format
-> Merges new sections, updates last-updated property
-> Appends note to today's journal entry
```

**Example 4: Multiple graphs, different backends**
```
User: "Save these learnings to my knowledge graph"

-> Discovers 2 graphs: "Personal KB" (LogSeq) and "Research Notes" (Obsidian)
-> Asks user which graph to target
-> Loads the appropriate backend profile
-> Proceeds with selected graph's conventions
```

**Example 5: Journal-only**
```
User: "Write a journal entry about today's session"

-> Invokes JournalEntry workflow (Workflows/JournalEntry.md)
-> Writes today's journal using active backend's journal path and format
-> No new knowledge pages created
```
