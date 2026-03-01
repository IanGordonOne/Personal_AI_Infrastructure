# Release Pipeline Walkthrough

**Application:** PAI Packaging Skill
**Platform:** CLI
**Location:** `~/.claude/skills/Packaging/Workflows/Release.md`
**Entry:** "release", "publish release", "full release pipeline"
**Steps:** 9
**Total Interactions:** 14 (CLI commands, user confirmations, tool invocations)
**Difficulty:** Advanced
**Prerequisites:** Packaging.json exists, clean git tree, tests pass, personal tap exists

> Execute the full release pipeline: pre-flight checks, version tagging, binary compilation, GitHub release creation, formula generation, tap publishing, and installation verification.

---

## Step 1: Pre-Flight Checks — automatic

Verify the project is ready for release. Three conditions must pass: clean git tree, passing tests, and existing Packaging.json.

**Source:** `Workflows/Release.md` (Step 1)

```
? Pre-flight checks:
  ✓ Git tree clean         git status --porcelain → (empty)
  ✓ Tests pass             go test ./... → PASS
  ✓ Packaging.json exists  .claude/skill-data/Packaging.json → found
```

| Interaction | Action |
|------------|--------|
| (automatic) | Runs git status, test suite, config check |
| Dirty tree detected | Abort — must commit or stash first |
| Tests fail | Abort — fix tests before releasing |
| No Packaging.json | Redirect to **Init** workflow |

## Step 2: Determine Version — user input

Choose the release version. The system suggests the next semver bump based on the latest git tag.

**Source:** `Workflows/Release.md` (Step 2)

```
? Current version: v1.4.2 (from git tag)

  Select version bump:
  ❯ patch  → v1.4.3  (bug fixes)
    minor  → v1.5.0  (new features)
    major  → v2.0.0  (breaking changes)
    custom → enter manually
```

| Interaction | Action |
|------------|--------|
| Select bump type | Sets target version |
| "custom" | Enter version string manually |
| `esc` / `Ctrl+C` | Abort release |

## Step 3: Tag Release — `git tag` + `git push`

Create an annotated git tag and push it to the remote.

**Source:** `Workflows/Release.md` (Step 3)

```
$ git tag -a v1.5.0 -m "Release v1.5.0"
$ git push origin v1.5.0
  → remote: tag v1.5.0 pushed
```

| Interaction | Action |
|------------|--------|
| (automatic) | Creates and pushes annotated tag |
| Push fails | Check remote permissions, retry |

## Step 4: Build Binaries — delegates to Build workflow

Compile binaries for all configured targets. Creates archives and checksums in `dist/`.

**Source:** `Workflows/Build.md` (all steps)

```
Building for 4 targets...
  ✓ darwin/arm64    dist/tool-1.5.0-darwin-arm64.tar.gz   (12.4 MB)
  ✓ darwin/amd64    dist/tool-1.5.0-darwin-amd64.tar.gz   (13.1 MB)
  ✓ linux/arm64     dist/tool-1.5.0-linux-arm64.tar.gz    (11.8 MB)
  ✓ linux/amd64     dist/tool-1.5.0-linux-amd64.tar.gz    (12.6 MB)

Checksums written to dist/checksums.txt
```

| Interaction | Action |
|------------|--------|
| (automatic) | Cross-compiles per BuildPatterns.md |
| Build fails | Report error, suggest fix |

> **GoReleaser alternative:** If `.goreleaser.yaml` exists, optionally delegate to `goreleaser release --clean` which handles steps 4-5 automatically.

## Step 5: Create GitHub Release — `gh release create`

Upload archives and checksums to a new GitHub release.

**Source:** `Workflows/Release.md` (Step 5)

```
$ gh release create v1.5.0 \
    --title "v1.5.0" \
    --notes "Release v1.5.0" \
    dist/*.tar.gz dist/checksums.txt

  → https://github.com/owner/repo/releases/tag/v1.5.0
  → 4 assets uploaded
```

| Interaction | Action |
|------------|--------|
| (automatic) | Creates release with all dist/ assets |
| Release exists | Prompt to overwrite or abort |

## Step 6: Update Formula SHAs — `FormulaGen.ts --update-shas`

Compute SHA256 checksums from the built archives and generate the Homebrew formula.

**Source:** `Workflows/Release.md` (Step 6), `Tools/FormulaGen.ts`

```
$ bun FormulaGen.ts --config Packaging.json --update-shas --output dist/tool.rb

  Found 4 archives with SHA256 checksums
  Wrote formula to dist/tool.rb
```

| Interaction | Action |
|------------|--------|
| (automatic) | Reads dist/*.tar.gz, computes SHAs |
| Archives missing locally | Download from release: `gh release download` |
| Review formula | User confirms .rb content |

## Step 7: Publish to Tap — `TapManager.ts publish`

Push the generated formula to the personal Homebrew tap repository.

**Source:** `Workflows/Release.md` (Step 7), `Tools/TapManager.ts`

```
$ bun TapManager.ts publish --formula dist/tool.rb

  Copied tool.rb → /opt/homebrew/Library/Taps/.../Formula/tool.rb
  Published tool v1.5.0 to <your-tap>
```

| Interaction | Action |
|------------|--------|
| (automatic) | Copies formula, git add/commit/push |
| Tap not installed | Redirect to **TapSetup** workflow |

## Step 8: Verify Installation — delegates to Verify workflow

Test that the formula installs correctly and the binary works.

**Source:** `Workflows/Verify.md` (all steps)

```
$ brew install <your-tap>/tool
  → Installed: tool v1.5.0

$ tool --version
  → tool version 1.5.0

$ brew test <your-tap>/tool
  → Testing tool: PASS
```

| Interaction | Action |
|------------|--------|
| (automatic) | brew install → version check → brew test |
| Install fails | Check SHA mismatch, archive contents |
| Version mismatch | Check ldflags version injection |

## Step 9: Report — summary

Present the complete release summary.

**Source:** `Workflows/Release.md` (Step 9)

```
┌─────────────────────────────────────────────────────┐
│  RELEASE COMPLETE                                    │
│                                                      │
│  Version:   v1.5.0                                   │
│  Release:   github.com/owner/repo/releases/v1.5.0   │
│  Platforms: darwin/arm64, darwin/amd64,               │
│             linux/arm64, linux/amd64                  │
│  Formula:   <your-tap>/tool                    │
│  Install:   brew install <your-tap>/tool       │
│  Verified:  ✓                                        │
└─────────────────────────────────────────────────────┘
```

| Interaction | Action |
|------------|--------|
| (display only) | Shows release summary |

---

## Quick Reference

### All Commands

| Command | Step | Action |
|---------|------|--------|
| `git status --porcelain` | 1 | Check clean tree |
| `git describe --tags` | 2 | Get current version |
| `git tag -a v{ver}` | 3 | Create annotated tag |
| `git push origin v{ver}` | 3 | Push tag to remote |
| Build commands | 4 | Cross-compile binaries |
| `gh release create` | 5 | Create GitHub release |
| `bun FormulaGen.ts --update-shas` | 6 | Generate formula with SHAs |
| `bun TapManager.ts publish` | 7 | Push formula to tap |
| `brew install` | 8 | Test installation |
| `brew test` | 8 | Run formula tests |

### Escape Paths

| From | Trigger | Goes To |
|------|---------|---------|
| Any step | `Ctrl+C` | Abort release |
| Step 1 (dirty tree) | — | Fix and restart |
| Step 1 (no config) | — | Init workflow |
| Step 7 (no tap) | — | TapSetup workflow |

### Related Workflows

- [Init Walkthrough](init-packaging.md) — prerequisite: creates Packaging.json
- [Build Walkthrough](build-binaries.md) — step 4 delegates here
- [Verify Walkthrough](verify-formula.md) — step 8 delegates here
- [Adopt Walkthrough](adopt-repo.md) — alternative: packages remote repos

---

*Generated by WorkflowDoc — source: `Workflows/Release.md`*
*Last updated: 2026-02-26*
