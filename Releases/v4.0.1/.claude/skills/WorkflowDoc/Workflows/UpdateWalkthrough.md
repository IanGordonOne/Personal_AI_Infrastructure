# UpdateWalkthrough

Re-generate an existing walkthrough after source code changes.

---

## Process

### Step 1: Find Existing YAML

1. Check `.claude/walkthroughs/` for the YAML file matching the user's request (`{id}.yaml`)
2. If no YAML exists, check `docs/walkthroughs/` for the markdown file
3. If only markdown exists, inform the user that a YAML extraction is needed first — suggest running GenerateWalkthrough to create the YAML source of truth
4. If neither exists, suggest using GenerateWalkthrough to create both
5. Read the existing YAML to understand current documented state

### Step 2: Identify Source Changes (YAML-Aware Diff)

1. Look up the workflow in `<project>/.claude/skill-data/WorkflowRegistry.md` to get source file list
2. Read the current source files (handleKey, View functions, step constants)
3. Compare against the existing YAML at the **field level**:
   - **New steps** — Step constants added that have no matching `steps[].id` in YAML
   - **Removed steps** — YAML steps whose `id` no longer has a corresponding source constant
   - **Changed interactions** — Switch cases added/removed/modified vs `steps[].interactions`
   - **Changed views** — View functions that would produce different mockups vs `steps[].mockup`
   - **Changed source refs** — Line numbers shifted, functions renamed vs `steps[].source`
   - **Changed metadata** — Step count, total interactions, difficulty recalculation

This is a structured diff — not a text diff. Each change maps to a specific YAML path (e.g., `walkthrough.steps[4].interactions` has 1 new entry).

### Step 3: Preserve Manual Sections

Some rendered markdown files may contain manually-written sections marked with HTML comments:

```markdown
<!-- manual -->
This section was written by hand and should not be overwritten.
<!-- /manual -->
```

Extract and preserve these sections from the existing markdown. They will be re-inserted at the same location (matched by the heading immediately before the manual block) during rendering.

### Step 4: Update YAML

Apply the detected changes to the YAML file:

1. Add new steps/sections at the correct position
2. Remove steps/sections that no longer exist in source
3. Update interactions, mockups, source references for changed steps
4. Recalculate `step_count`, `total_interactions`
5. Update `last_updated` to today
6. Update footer tables (`all_keys`, `escape_paths`, etc.) to reflect changes
7. Write the updated YAML to `.claude/walkthroughs/{id}.yaml`

### Step 5: Re-Render Markdown

Invoke the `RenderWalkthrough` workflow to produce fresh markdown from the updated YAML.

1. Load updated `.claude/walkthroughs/{id}.yaml`
2. Render to `docs/walkthroughs/{id}.md`
3. Re-insert any `<!-- manual -->` blocks preserved in Step 3

### Step 6: Report Changes

Present a summary of what changed at the YAML level:

```markdown
## Update Summary

**YAML:** .claude/walkthroughs/setup-wizard.yaml
**Markdown:** docs/walkthroughs/setup-wizard.md
**Source:** cmd/tui/wizard.go

### YAML Changes
- `walkthrough.steps[4].interactions`: +1 entry (tab key for stop_limit)
- `walkthrough.steps[7]`: NEW step (Calendar Gate)
- `walkthrough.all_keys`: +1 entry (tab)
- `walkthrough.step_count`: 8 → 9
- `walkthrough.total_interactions`: 14 → 16

### Preserved
- 1 manual markdown section (under "Tips for New Traders")

### Verification
- All 9 steps have mockups ✓
- Key counts match source ✓
- Escape paths complete ✓
- YAML round-trips to identical markdown ✓
```

---

## When Source and YAML Diverge Significantly

If the structured diff reveals major changes (steps reordered, entire sub-model added, workflow split into multiple files, >50% of steps changed), warn the user:

```
The source has changed significantly since the YAML was generated.
YAML path changes: 23 fields modified across 6 steps.
A full re-extraction is recommended rather than an incremental update.
Proceed with full re-generation? (This will preserve <!-- manual --> sections.)
```

A full re-generation runs GenerateWalkthrough from scratch, producing a new YAML file and then rendering it.
