# ValidateBoxes

Validate ASCII box alignment in markdown files. Detects jagged right borders and width inconsistencies.

---

## Process

### Step 1: Identify Target

Accept one of:
- **File path** — validate a single markdown file
- **Directory path** — validate all `*.md` files in the directory (non-recursive)
- **Glob pattern** — validate matching files

### Step 2: Run Validation

```bash
bun ~/.claude/tools/AsciiBox.ts validate <target>
```

The tool will:
1. Glob `*.md` files if a directory is given
2. Parse fenced code blocks containing box-drawing characters
3. Measure the top border's display width
4. Check every interior line matches that width
5. Report: file, line number, expected vs actual width, offending line

### Step 3: Review Results

- **Exit 0** — all boxes pass alignment checks
- **Exit 1** — one or more alignment errors found

Output format per error:
```
ERROR: file.md:42 — expected width 55, got 53
  │  Short content        │
                           ^ missing 2 chars
```

### Step 4: Fix (if errors found)

For each misaligned line, the fix is always the same: pad the content with spaces so the closing `│` lands at the correct column.

Options:
1. **Manual fix** — edit the lines by hand
2. **Regenerate** — use `GenerateBox` workflow to regenerate the box from content
3. **Ask the tool** — future: `--fix` flag to auto-correct alignment

---

## Common Validation Targets

```bash
# Validate walkthrough docs
bun ~/.claude/tools/AsciiBox.ts validate docs/walkthroughs/

# Validate tier templates
bun ~/.claude/tools/AsciiBox.ts validate mkdocs/tier_1_observer_template.md

# Validate a specific file
bun ~/.claude/tools/AsciiBox.ts validate docs/walkthroughs/setup-wizard.md
```
