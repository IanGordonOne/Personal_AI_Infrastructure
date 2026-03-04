# JournalEntry Workflow

## Purpose

Write or append to today's LogSeq journal entry with links to knowledge pages. Can be called standalone or as part of the Integrate workflow. When knowledge content reflects plans made or work completed, the journal entry surfaces that progress alongside the knowledge capture.

## Trigger

"write journal entry", "today's journal", "logseq journal"

## Journal Path Convention

LogSeq journals use date-based filenames: `journals/{yyyy_mm_dd}.md`

Example: `journals/2026_03_02.md`

## Procedure

### Step 1: Resolve Target Graph

Same as Integrate workflow Step 2.

### Step 2: Check for Existing Entry

```bash
cat "$GRAPH_ROOT/journals/$(date +%Y_%m_%d).md" 2>/dev/null
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

**When called from Integrate workflow:**

```markdown
- ## Knowledge Capture — {Session Topic}
	- Source:: {project name or research topic}
	- Pages:: {count} new, {count} updated
	- ### New Pages
		- [[Page One]] — {one-line summary from short:: property}
		- [[Page Two]] — {one-line summary}
	- ### Updated Pages
		- [[Page Three]] — {what changed}
	- ### Session Context
		- {1-2 sentences about what prompted this knowledge capture}
```

**When plan signals are present, append:**

```markdown
	- ### Plans Made
		- [[Page Name]] — {what was decided or planned, in one line}
		- [[Page Name]] — {next step or deferred item}
```

**When work signals are present, append:**

```markdown
	- ### Work Done
		- [[Page Name]] — {what was completed, in one line}
		- [[Page Name]] — {implementation milestone reached}
```

Both sections are optional — include only when signals are detected. A session may have plans only, work only, both, or neither (pure knowledge capture).

**When called standalone:**

```markdown
- ## {Entry Title}
	- {Content as outliner blocks}
	- Related:: [[Page One]], [[Page Two]]
```

**When called from UpdatePages workflow:**

```markdown
- Updated [[Page Name]] — {what changed}
```

If the update contains plan or work signals, enrich the entry:

```markdown
- Updated [[Page Name]] — {what changed}
	- PLANNED: {decision or intention, if plan signal}
	- DONE: {completion or milestone, if work signal}
```

### Step 5: Write

- If journal file exists: append new content after existing content
- If journal file doesn't exist: create with the new content
- Use LogSeq outliner format: `- ` prefixed blocks, tab-indented children

### Step 6: Confirm

Report the journal entry path and content summary. If plan or work signals were detected, note them explicitly so the user sees their progress reflected.
