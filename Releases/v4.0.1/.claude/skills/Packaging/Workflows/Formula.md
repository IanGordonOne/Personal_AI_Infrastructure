# Formula Workflow

Generate a Homebrew formula .rb file from Packaging.json.

---

## Prerequisites

- Packaging.json exists at `<project>/.claude/skill-data/Packaging.json`
- For binary formulas: archives with checksums exist in `dist/`

## Steps

### 1. Generate Formula

#### With SHA256s from dist/ (preferred)

```bash
bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts \
  --config <project>/.claude/skill-data/Packaging.json \
  --update-shas
```

#### Without local archives (uses FIXME placeholders)

```bash
bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts \
  --config <project>/.claude/skill-data/Packaging.json
```

### 2. Review Output

Present the generated Ruby formula to the user. Key things to verify:
- Class name matches convention (CamelCase)
- Description is accurate and under 80 chars
- SHA256 checksums are present (not FIXME)
- Platform blocks cover all targets
- Install block installs the correct binary name
- Test block runs a meaningful check

### 3. Validate

```bash
bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts \
  --config <project>/.claude/skill-data/Packaging.json \
  --validate
```

### 4. Write Formula

Write to the project's dist/ or a specified location:

```bash
bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts \
  --config <project>/.claude/skill-data/Packaging.json \
  --update-shas \
  --output <project>/dist/<name>.rb
```

### 5. Suggest Next Steps

- **Publish**: Push formula to personal tap via TapManager
- **Release**: Full pipeline if not done yet
- **Verify**: Test install from local formula

Read `FormulaReference.md` for the complete Homebrew formula SOP if manual adjustments are needed.
