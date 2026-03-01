# Release Workflow

Full release pipeline: tag → build → GitHub release → formula → tap → verify.

---

## Prerequisites

- Packaging.json exists
- All tests pass
- Git working tree is clean
- Personal tap exists (run TapSetup if not)

## Steps

### 1. Pre-Flight Checks

```bash
# Clean git tree?
git status --porcelain

# Tests pass?
# (language-specific: go test, bun test, cargo test, pytest)

# Packaging.json exists?
cat <project>/.claude/skill-data/Packaging.json
```

### 2. Determine Version

Ask the user for the release version, or use the current version from Packaging.json.

If using git tags, check the latest:
```bash
git describe --tags --abbrev=0
```

Suggest the next version based on semver:
- **patch**: bug fixes (1.0.0 → 1.0.1)
- **minor**: new features (1.0.0 → 1.1.0)
- **major**: breaking changes (1.0.0 → 2.0.0)

### 3. Tag Release

```bash
git tag -a v${version} -m "Release v${version}"
git push origin v${version}
```

### 4. Build Binaries

Follow the **Build** workflow steps:
- Build for all targets
- Create archives
- Generate checksums

### 5. Create GitHub Release

```bash
gh release create v${version} \
  --title "v${version}" \
  --notes "Release v${version}" \
  dist/*.tar.gz \
  dist/checksums.txt
```

### 6. Update Formula SHAs

After the release is created, compute SHAs from the release assets:

```bash
bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts \
  --config <project>/.claude/skill-data/Packaging.json \
  --update-shas \
  --output dist/${name}.rb
```

If dist/ archives don't exist locally (e.g., CI built them), download from the release:

```bash
# For each target:
gh release download v${version} --pattern "*.tar.gz" --dir dist/
```

Then re-run FormulaGen with --update-shas.

### 7. Publish to Tap

```bash
bun ~/.claude/skills/Packaging/Tools/TapManager.ts publish \
  --formula dist/${name}.rb
```

### 8. Verify Installation

Follow the **Verify** workflow:

```bash
brew update
brew install <your-tap>/${name}
${name} --version
```

### 9. Report

Present the release summary:
- Version released
- GitHub release URL
- Platforms built
- Formula published
- Verification result

## GoReleaser Alternative

If the project has `.goreleaser.yaml` and `goreleaser` is available:

```bash
goreleaser release --clean
```

This handles steps 4-5 automatically. You still need to:
- Update the formula SHAs (step 6)
- Publish to tap (step 7)
- Verify (step 8)
