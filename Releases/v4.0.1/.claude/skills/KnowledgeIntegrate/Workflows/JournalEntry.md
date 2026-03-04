# JournalEntry Workflow

## Purpose

Write or append to today's journal entry with links to knowledge pages. Can be called standalone or as part of the Integrate workflow. When knowledge content reflects plans made or work completed, the journal entry surfaces that progress alongside the knowledge capture.

## Trigger

"write journal entry", "today's journal"

## Journal Path Convention

Journal path and filename pattern are defined by the active backend profile — see `Backends/{backend}.md`, section **Journal Path**.

## Procedure

### Step 1: Resolve Target Graph and Backend

Same as Integrate workflow Step 2 — resolve graph, determine backend, load backend profile.

### Step 2: Check for Existing Entry

Construct today's journal filename using the active backend's **Journal Path** (directory + filename pattern). Check if the file exists:

```bash
cat "$GRAPH_ROOT/$JOURNAL_DIR/{today's filename}" 2>/dev/null
```

If exists, append to it. If not, create new.

### Step 3: Classify Session Signals

Before generating content, scan the knowledge pages being written/updated for **plan** and **work** signals. These are passed from the calling workflow (Integrate or UpdatePages) via context.

**Plan signals** (content indicates decisions or intentions for future work):
- Pages of type `decision` or `architecture`
- Content containing: "will implement", "next step", "plan to", "deferred", "remaining", "roadmap", "intention to"
- Knowledge about tools/approaches chosen for future use

**Work signals** (content indicates completed implementation or progress):
- Pages documenting completed implementations, test results, working code
- Content containing: "COMPLETE", "implemented", "tests passing", "wired", "deployed", "built", "added"
- Architecture pages describing systems that now exist (vs. planned)

**Classification output:** For each page, assign zero or more of: `knowledge`, `plan`, `work`. A single page can be both (e.g., documenting a completed security layer AND the plan for the next service).

### Step 4: Generate Entry Content

Format all journal content using the active backend's **Section Format** — the content structure (headings, sub-items) remains the same; the rendering (outliner blocks vs flat markdown) follows the backend profile.

**When called from Integrate workflow:**

Structure:
- Heading: "Knowledge Capture — {Session Topic}"
- Source: project name or research topic
- Pages: count new, count updated
- Sub-section: New Pages — list with one-line summaries
- Sub-section: Updated Pages — list with what changed
- Sub-section: Session Context — 1-2 sentences about what prompted this

**When plan signals are present, append:**

- Sub-section: Plans Made — list of decisions/intentions, one line each

**When work signals are present, append:**

- Sub-section: Work Done — list of completions/milestones, one line each

Both sections are optional — include only when signals are detected. A session may have plans only, work only, both, or neither (pure knowledge capture).

**When called standalone:**

Structure:
- Heading: "{Entry Title}"
- Content as sub-items
- Related page links

**When called from UpdatePages workflow:**

Structure:
- "Updated [[Page Name]] — {what changed}"
- If plan signal: "PLANNED: {decision or intention}"
- If work signal: "DONE: {completion or milestone}"

### Step 5: Write

- If journal file exists: append new content after existing content
- If journal file doesn't exist: create with the new content
- Use the active backend's **Section Format** for all content

### Step 6: Confirm

Report the journal entry path and content summary. If plan or work signals were detected, note them explicitly so the user sees their progress reflected.
