---
name: Packaging
description: CLI packaging and Homebrew distribution pipeline. USE WHEN user wants to package a project, create a Homebrew formula, manage a tap, release a CLI tool, build binaries, distribute via brew install, adopt a GitHub repo as a CLI, OR mentions packaging, formula, tap, brew install, cross-compile, release pipeline.
---

# Packaging

Unified pipeline for building binaries, generating Homebrew formulas, and distributing CLI tools via `brew install`.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Packaging/`

If this directory exists, load and apply:
- `PREFERENCES.md` - User preferences and configuration

These define user-specific preferences. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the Packaging skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **Packaging** skill...
   ```

**Full documentation:** `~/.claude/skills/CORE/SYSTEM/THENOTIFICATIONSYSTEM.md`

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Init** | "init packaging", "detect project type", "create Packaging.json" | `Workflows/Init.md` |
| **Build** | "build binaries", "compile", "cross-compile" | `Workflows/Build.md` |
| **Formula** | "generate formula", "create formula", "homebrew formula" | `Workflows/Formula.md` |
| **TapSetup** | "create tap", "setup tap", "initialize tap" | `Workflows/TapSetup.md` |
| **Release** | "release", "publish release", "full release pipeline" | `Workflows/Release.md` |
| **Adopt** | "adopt repo", "install from github", GitHub URL + "make it a CLI" | `Workflows/Adopt.md` |
| **Verify** | "verify formula", "test install", "brew test" | `Workflows/Verify.md` |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **CommandExtract** | Complementary. CommandExtract generates slash commands; Packaging distributes the CLI binary those commands operate on. |
| **DocGen** | Complementary. DocGen generates documentation; Packaging generates the Homebrew formula README and tap README. |

## Examples

**Example 1: Package a local Go project**
```
User: "Package myproject for Homebrew"
→ Invokes Init workflow
→ Detects Go project, finds binary entry points
→ Creates Packaging.json config
→ User reviews, then Build → Formula → Release
```

**Example 2: Adopt a GitHub repo as a CLI**
```
User: "I want to install https://github.com/someone/cool-tool via brew"
→ Invokes Adopt workflow
→ Clones repo, detects language, checks for existing releases
→ Generates formula, pushes to personal tap
→ `brew install <your-tap>/cool-tool`
```

**Example 3: Release a new version**
```
User: "Release v1.2.0 of ntm"
→ Invokes Release workflow
→ Pre-flight checks → tag → build → gh release → formula update → tap push → verify
```

## Quick Reference

- **Per-project config:** `<project>/.claude/skill-data/Packaging.json`
- **Tap:** Configured in `SKILLCUSTOMIZATIONS/Packaging/PREFERENCES.md` or `Tools/tap.json`
- **Detect tool:** `bun ~/.claude/skills/Packaging/Tools/Detect.ts --project <path>`
- **Formula tool:** `bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts --config Packaging.json`
- **Tap tool:** `bun ~/.claude/skills/Packaging/Tools/TapManager.ts <command>`

**Full Documentation:**
- Formula authoring SOP: `FormulaReference.md`
- Language build patterns: `BuildPatterns.md`
