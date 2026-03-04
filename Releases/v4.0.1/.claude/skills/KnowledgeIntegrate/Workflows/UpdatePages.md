# UpdatePages Workflow

## Purpose

Update one or more existing LogSeq knowledge pages with new information from the current session. Use when you don't need full session extraction — just want to enrich specific pages.

## Trigger

"update [page] in logseq", "add to [page]", "enrich knowledge page", "update the [topic] page"

## Procedure

### Step 1: Resolve Target Graph

Same as Integrate workflow Step 2 — resolve graph from user input or default.

### Step 2: Identify Target Pages

Parse the user's request for specific page names. If ambiguous, search:

```bash
ls "$GRAPH_ROOT/pages/" | grep -i "{search_term}"
```

Present matches and confirm which pages to update.

### Step 3: Read Existing Content

For each target page:
1. Read the file from `$GRAPH_ROOT/pages/{title}.md`
2. Parse properties (everything before the first `- ##` block)
3. Parse sections (each `- ##` heading and its children)
4. Note which sections exist and their depth/quality

### Step 4: Determine Updates

From session context, identify for each page:
- **New sections** to add (topics not yet covered)
- **Section enrichments** (additional bullets for existing sections)
- **Property updates** (`last-updated::`, new `related::` links, new `tags::`)
- **New inline `[[wikilinks]]`** discovered from session
- **Signals** — classify each update as `plan`, `work`, or neither (see `JournalEntry.md` Step 3 for signal definitions). Updates that document new decisions/intentions are `plan`; updates that document completed implementations are `work`.

### Step 5: Merge and Write

Apply merge rules from `PageSchema.md`:
- Preserve existing sections that are comprehensive
- Add new sections after existing ones
- Append new bullets to existing sections (don't replace)
- Update `last-updated::` to today's date
- Append new items to `related::` and `tags::` (don't replace)
- Never remove existing content

Write the merged page back to the same file.

### Step 6: Append to Journal

Add a note to today's journal entry per `JournalEntry.md`. Pass signal classifications so the journal entry reflects plans and work:

```
- Updated [[Page Name]] — added section on {topic}, updated related links
```

If the update carries plan or work signals, enrich per JournalEntry.md Step 4 (UpdatePages variant).

If the journal file doesn't exist, create it with just this entry.

### Step 7: Report

For each page, report:
- Sections added
- Sections enriched
- Properties updated
- New cross-links added
