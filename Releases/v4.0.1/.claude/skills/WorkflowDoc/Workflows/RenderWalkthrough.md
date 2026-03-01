# RenderWalkthrough

Render a structured YAML walkthrough into a human-readable markdown document. This is a deterministic transformation — the same YAML always produces identical markdown.

---

## Process (5 Steps)

### Step 1: LOAD

1. Read the YAML file from `.claude/walkthroughs/{id}.yaml`
2. Parse the `walkthrough` root key
3. Verify `version: 1`
4. Determine type from `walkthrough.type`: `linear` or `modal`

**Output:** Parsed walkthrough object with type discriminator.

### Step 2: VALIDATE

Check the YAML against schema constraints before rendering:

1. **Required fields present** — `version`, `id`, `title`, `type`, `application`, `platform`, `location`, `entry`, `difficulty`, `prerequisites`, `description`, `step_count`, `total_interactions`, `sources`, `generated_by`, `last_updated`
2. **Type content match** — `linear` has `steps`, `modal` has `sections`
3. **Step/section count matches** — `step_count` equals length of `steps` or `sections`
4. **Mockup exclusivity** — no step has both `mockup` and `mockups`
5. **At least one interaction per step/section** — unless the step is purely informational
6. **Source references present** — every step/section has a `source` block

If validation fails, report the specific violations and stop. Do not render invalid YAML.

**Output:** Validation pass/fail with specific errors if any.

### Step 3: RENDER

Apply the deterministic rendering rules below based on `type`.

#### 3a: Header

```markdown
# {title} Walkthrough

**Application:** {application}
**Platform:** {platform}
**Location:** {location}
**Entry:** {entry}
**Steps:** {step_count} ({step_range_description})
**Total Keys:** {total_interactions}
**Difficulty:** {difficulty}
**Prerequisites:** {prerequisites}

> {description}
```

- For linear workflows with sub-steps, include the range description: `9 (0–8), with sub-steps at Step 2 and sub-mode at Steps 4/7`
- For modal workflows, replace `Steps` with `Steps: N/A (modal -- no linear progression)` and use `Total Interactions` instead of `Total Keys`
- If `sources` has multiple files, add a **Source:** line listing all files after the blockquote

#### 3b: Steps (linear) or Sections (modal)

**Linear steps:**

For each step in order:

```markdown
---

## Step {id}: {name} — {primary_trigger}

{description}

**Source:** `{source.file}:{source.lines}` (`{handlers joined by ', '}` / `{views joined by ', '}`)
{— or if source.refs is present, render multi-ref format (see below)}

{mockup or mockups}

| Key | Action |
|-----|--------|
{interactions as table rows}

{conditional block — if present, AFTER interaction table}
{async block — if present, AFTER interaction table}
{validation — if present}
{notes — if present, rendered as paragraphs (string notes) or tables/lists (structured notes)}
{sub_workflow — if present}
```

Rendering rules for optional fields:

| Field | Rendered As |
|-------|------------|
| `conditional.note` | `> **Conditional:** {note}` — placed AFTER interaction table |
| `async.note` | `> **Async:** {note}` — placed AFTER interaction table |
| `mockup` (singular) | Fenced code block (no language tag) |
| `mockups` (plural) | For each: `### {label}:\n\n` + fenced code block |
| `validation` | `**Validation:** {text}` — after conditional/async blocks |
| `notes` (string) | Each note rendered as a plain paragraph — after validation |
| `notes` (object with `type: "table"`) | Render `### {title}` + markdown table from headers/rows |
| `notes` (object with `type: "list"`) | Render `### {title}` + numbered list from items |
| `sub_workflow` | Full sub-section with heading, description (if present), source, mockup, interaction table |

**Source line formatting:**

Two modes depending on schema:

**Simple source** (single `file` + `lines`):
- Format: `` **Source:** `{file}:{lines}` (`{handlers joined by ', '}` / `{views joined by ', '}`) ``

**Multi-ref source** (when `source.refs` is present):
- Render each ref as `` `{file}:{lines}` (`{functions joined by ', '}`) ``
- Separate refs with ` · ` (middle dot with spaces)
- Example: `` **Source:** `cmd/tui/wizard.go:70-90` (`handleNameStep`) · `cmd/tui/wizard.go:401-404` (`viewNameStep`) ``
- If two refs share the same file, they still render separately for line-level precision

**Sub-workflow rendering:**

```markdown
### {sub_workflow.name} — {sub_workflow.entry}

{sub_workflow description if present}

**Source:** `{source.file}:{source.lines}` (`{handlers}` / `{views}`)

{mockup}

| Key | Action |
|-----|--------|
{interactions}
```

**Modal sections:**

For each section in order:

```markdown
---

## {id}. {name}

{preamble — if present, rendered as-is markdown}
{description — SKIP if preamble is present (preamble replaces the description paragraph)}

**Source:** `{source.file}:{source.lines}` (`{views}`)
{— or if source.refs is present, render multi-ref format}

{mockup — if present}

{interaction table — SUPPRESS if key_groups fully cover all interactions}

{key_groups — if present}

{notes — rendered as paragraphs (string notes) or tables/lists (structured notes)}
```

**Interaction table with context column:**

If ANY interaction in the section has a `context` field, render a 3-column table:

```markdown
| Key | Context | Action |
|-----|---------|--------|
```

Otherwise, render a 2-column table:

```markdown
| Key | Action |
|-----|--------|
```

**Key groups rendering:**

```markdown
### {group} — {trigger}
{— omit "— {trigger}" if trigger field is absent}

{description}

{mockup — if present}

| Key | Indicator | Type | Color | Description |
|-----|-----------|------|-------|-------------|
{keys as table rows}
```

The table columns are auto-detected from the keys present. Always include `Key` and `Description`. Add `Indicator`, `Type`, `Color`, `Height`, `Action`, `Context` columns only when those fields exist in the keys array.

#### 3c: Footer

Render all present footer tables in this order:

1. **All Keys** (linear) or **All Keys** grouped by context (modal)
2. **Escape Paths**
3. **Conditional Behavior** (if present)
4. **Async Operations** (if present)
5. **Related Workflows**
6. **Related Tours**
7. **Generation footer**

```markdown
---

## Quick Reference

### All Keys

{all_keys or all_keys_by_context table}

### Escape Paths

| From | Key | To |
|------|-----|-----|
{escape_paths rows}

### Conditional Behavior

| Condition | Effect |
|-----------|--------|
{conditional_behavior rows}

### Async Operations

| Trigger | Computation | Result |
|---------|-------------|--------|
{async_operations rows}

### Related Workflows

- [{title}]({path}) — {note}

### Related Tours

- **{name}** — `{tour_file}` stop {stop} ({note})

---

*Generated by WorkflowDoc — source: `{sources joined by ', '}`*
*Last updated: {last_updated}*
```

**All Keys by Context (modal):**

For each context group:

```markdown
### {context}

| Key | Action |
|-----|--------|
{keys}
```

### Step 4: FORMAT

Post-processing checks:

1. **Horizontal rules** — `---` between every step/section and before the footer
2. **Table alignment** — consistent column widths within each table
3. **Empty sections** — omit any footer section that has an empty array
4. **Trailing newline** — file ends with exactly one newline
5. **No double blank lines** — collapse consecutive blank lines to single
6. **Box alignment** — validate all mockup code blocks with `bun ~/.claude/tools/AsciiBox.ts validate`

### Step 5: OUTPUT

1. Write the rendered markdown to `docs/walkthroughs/{id}.md`
2. Report to user: filename, step/section count, interaction count
3. If diffing against an existing file, report structural differences

---

## Invocation

This workflow is invoked in two contexts:

1. **From GenerateWalkthrough** — after YAML extraction (Step 7 of GenerateWalkthrough)
2. **Standalone** — when the user asks to re-render an existing YAML file

For standalone invocation:
```
User: "Render the setup wizard walkthrough"
→ Load .claude/walkthroughs/setup-wizard.yaml
→ VALIDATE → RENDER → FORMAT → OUTPUT to docs/walkthroughs/setup-wizard.md
```

---

## Round-Trip Verification

After rendering, optionally verify the output:

1. Diff the rendered markdown against the existing `docs/walkthroughs/{id}.md`
2. **Acceptable differences:** whitespace normalization, minor formatting
3. **Unacceptable differences:** missing steps, wrong tables, different mockup content, structural changes
4. If structural differences found, report them and suggest schema or rendering rule fixes
