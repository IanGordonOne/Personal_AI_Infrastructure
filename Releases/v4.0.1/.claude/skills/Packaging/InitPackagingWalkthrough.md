# Init Packaging Walkthrough

**Application:** PAI Packaging Skill
**Platform:** CLI
**Location:** `~/.claude/skills/Packaging/Workflows/Init.md`
**Entry:** "init packaging", "detect project type", "create Packaging.json"
**Steps:** 5
**Total Interactions:** 6 (tool invocation, user review, user edits, confirmation)
**Difficulty:** Basic
**Prerequisites:** A project directory with a recognized language file (go.mod, package.json, Cargo.toml, or pyproject.toml)

> Detect a project's language, binary entry points, version source, and build configuration, then write a Packaging.json config file.

---

## Step 1: Run Detection — `bun Detect.ts`

Invoke the Detect tool to scan the project directory and identify its packaging characteristics.

**Source:** `Workflows/Init.md` (Step 1), `Tools/Detect.ts`

```
$ bun Detect.ts --project ~/Projects/myproject

  Scanning ~/Projects/myproject...
  ✓ go.mod found → language: go
  ✓ cmd/cli/main.go found → binary: hf
  ✓ git tag v1.2.0 → version: 1.2.0
  ✓ origin → <your-github-user>/myproject
```

| Interaction | Action |
|------------|--------|
| Provide project path | Runs detection against directory |
| No path specified | Uses current working directory |
| No language file found | Reports "unknown" — user must specify manually |

## Step 2: Review Output — read detection results

Presents the complete detection results for user review.

**Source:** `Workflows/Init.md` (Step 2)

```
Packaging Detection Results
──────────────────────────────────────────────────
Project:    myproject
Language:   go
Version:    1.2.0 (source: git_tag)
GitHub:     <your-github-user>/myproject
GoReleaser: not detected

Binaries:
  hf → ./cmd/cli

Targets:
  darwin/arm64
  darwin/amd64
  linux/arm64
  linux/amd64

Build Config:
  env: CGO_ENABLED=0
  ldflags: -s -w
  flags: -trimpath

Formula:
  tap: <your-github-user>/homebrew-tap
  type: binary
  test: --version
```

| Interaction | Action |
|------------|--------|
| (display only) | Shows all detected values |
| User reviews | Decides whether to modify anything |

## Step 3: User Adjustments — optional edits

Ask the user if any detected values need modification before writing the config.

**Source:** `Workflows/Init.md` (Step 3)

```
? Any adjustments needed?

  Commonly changed fields:
  ─────────────────────────────────────────────
  binaries[].name      Rename the CLI command
  targets              Add/remove platforms
  formula.type         binary vs source
  formula.dependencies Add runtime deps
  formula.test_command Custom test command
  build.ldflags        Add version injection

  ❯ No changes, write config
    Yes, let me adjust...
```

| Interaction | Action |
|------------|--------|
| "No changes" | Proceed to Step 4 |
| "Yes, adjust" | User specifies field changes |
| Change binary name | Updates `binaries[0].name` |
| Change formula type | Switches between binary/source |
| Add dependency | Appends to `formula.dependencies` |

## Step 4: Write Configuration — `bun Detect.ts --init`

Write the Packaging.json config to the project's `.claude/skill-data/` directory.

**Source:** `Workflows/Init.md` (Step 4), `Tools/Detect.ts`

```
$ bun Detect.ts --project ~/Projects/myproject --init

  Wrote /path/to/myproject/.claude/skill-data/Packaging.json
```

| Interaction | Action |
|------------|--------|
| (automatic) | Creates `.claude/skill-data/` if needed, writes JSON |
| Directory exists | Overwrites existing Packaging.json |

## Step 5: Confirm — summary + next steps

Report the written config path and suggest what to do next.

**Source:** `Workflows/Init.md` (Step 5)

```
┌─────────────────────────────────────────────────────┐
│  INIT COMPLETE                                       │
│                                                      │
│  Config: .claude/skill-data/Packaging.json           │
│  Project: myproject (go)                             │
│  Binaries: hf                                        │
│  Targets: 4 platforms                                │
│                                                      │
│  Next steps:                                         │
│    → Build    Compile binaries for all targets        │
│    → Formula  Generate Homebrew formula               │
│    → Release  Full release pipeline                   │
└─────────────────────────────────────────────────────┘
```

| Interaction | Action |
|------------|--------|
| "Build" | Invokes Build workflow |
| "Formula" | Invokes Formula workflow |
| "Release" | Invokes Release workflow (does everything) |

---

## Quick Reference

### All Commands

| Command | Step | Action |
|---------|------|--------|
| `bun Detect.ts --project <path>` | 1 | Detect project type |
| (user review) | 2-3 | Review and adjust config |
| `bun Detect.ts --project <path> --init` | 4 | Write Packaging.json |

### Escape Paths

| From | Trigger | Goes To |
|------|---------|---------|
| Any step | `Ctrl+C` | Abort init |
| Step 3 | "adjust" | Modify detected values |
| Step 1 | Unknown language | Manual config creation |

### Related Workflows

- [Build Walkthrough](build-binaries.md) — next step: compile binaries
- [Release Pipeline](release-pipeline.md) — full pipeline (includes init)
- [Adopt Walkthrough](adopt-repo.md) — alternative: packages remote repos

---

*Generated by WorkflowDoc — source: `Workflows/Init.md`, `Tools/Detect.ts`*
*Last updated: 2026-02-26*
