# Adopt Repo Walkthrough

**Application:** PAI Packaging Skill
**Platform:** CLI
**Location:** `~/.claude/skills/Packaging/Workflows/Adopt.md`
**Entry:** GitHub URL + "make it a CLI", "adopt repo", "install from github"
**Steps:** 9
**Total Interactions:** 11 (CLI commands, branching decisions, tool invocations)
**Difficulty:** Advanced
**Prerequisites:** Personal tap exists (run TapSetup if not), `gh` CLI authenticated

> Take any GitHub repo URL and turn it into a globally installed CLI command via `brew install` — the "one-shot" workflow.

---

## Step 1: Parse Repository Info — automatic

Extract owner and repo from the provided GitHub URL.

**Source:** `Workflows/Adopt.md` (Step 1)

```
? Input: https://github.com/someone/cool-tool

  Parsed:
    Owner: someone
    Repo:  cool-tool
```

| Interaction | Action |
|------------|--------|
| Provide URL | Parses `{owner}/{repo}` from GitHub URL |
| Invalid URL | Ask user to provide a valid GitHub repo URL |

## Step 2: Check for Existing Releases — `gh release list`

Query GitHub for existing releases with downloadable binary assets.

**Source:** `Workflows/Adopt.md` (Step 2)

```
$ gh release list --repo someone/cool-tool --limit 5

  TAG      TITLE     PUBLISHED
  v2.1.0   v2.1.0    2026-02-15
  v2.0.0   v2.0.0    2026-01-20

  ✓ Releases found — checking for binary assets...
  ✓ 4 platform archives detected
```

| Interaction | Action |
|------------|--------|
| (automatic) | Checks for releases with binary assets |
| Releases with binaries exist | → Skip to Step 5 (binary formula) |
| No releases / no binaries | → Continue to Step 3 (clone and build) |

> **Decision branch:** This step determines the packaging strategy. See Decision Matrix at the end.

## Step 3: Clone Repository — `gh repo clone`

Clone the repo to a temporary directory for local inspection and building.

**Source:** `Workflows/Adopt.md` (Step 3)

```
$ gh repo clone someone/cool-tool /tmp/cool-tool -- --depth 1

  Cloning into '/tmp/cool-tool'...
  ✓ Cloned (shallow)
```

| Interaction | Action |
|------------|--------|
| (automatic) | Shallow clone to /tmp |
| Clone fails | Check URL, repo visibility, auth |

> **Conditional:** This step is SKIPPED when the repo has existing releases with binary assets.

## Step 4: Detect and Build — `Detect.ts` + Build workflow

Run project detection and build binaries locally.

**Source:** `Workflows/Adopt.md` (Step 4), `Tools/Detect.ts`

```
$ bun Detect.ts --project /tmp/cool-tool

  Language:  go
  Binaries:  cool-tool → ./cmd/cool-tool
  Version:   2.1.0 (git_tag)
  GitHub:    someone/cool-tool

  Strategy:
  ❯ Third-party repo → source formula (builds on install)
    Own repo → build + release + binary formula
```

| Interaction | Action |
|------------|--------|
| (automatic) | Detects language, binaries, version |
| Own repo | Build locally → create GitHub release → binary formula |
| Third-party repo | Generate source formula (or build locally for binary formula) |

> **Conditional:** This step is SKIPPED when using pre-existing release assets.

## Step 5: Generate Formula — `FormulaGen.ts`

Create the Homebrew formula file. Strategy depends on whether pre-built binaries exist.

**Source:** `Workflows/Adopt.md` (Step 5), `Tools/FormulaGen.ts`

```
Strategy A — Binary formula from existing releases:

$ gh release download --repo someone/cool-tool --pattern "*.tar.gz" --dir /tmp/adopt-assets/
$ shasum -a 256 /tmp/adopt-assets/*.tar.gz
$ bun FormulaGen.ts --config Packaging.json --update-shas

  class CoolTool < Formula
    desc "Cool tool CLI"
    homepage "https://github.com/someone/cool-tool"
    version "2.1.0"
    ...
    on_macos do
      on_arm do
        url "https://github.com/.../cool-tool-2.1.0-darwin-arm64.tar.gz"
        sha256 "abc123..."
      end
    end
  end

Strategy B — Source formula (builds on install):

$ bun FormulaGen.ts --config Packaging.json

  class CoolTool < Formula
    desc "Cool tool CLI"
    url "https://github.com/.../archive/refs/tags/v2.1.0.tar.gz"
    depends_on "go" => :build
    def install
      system "go", "build", *std_go_args, "./cmd/cool-tool"
    end
  end
```

| Interaction | Action |
|------------|--------|
| Pre-built binaries exist | Download assets, compute SHAs, binary formula |
| No pre-built binaries | Generate source formula |
| Review formula | User confirms .rb content before publishing |

## Step 6: Publish to Tap — `TapManager.ts publish`

Push the formula to the personal Homebrew tap.

**Source:** `Workflows/Adopt.md` (Step 6), `Tools/TapManager.ts`

```
$ bun TapManager.ts publish --formula /tmp/cool-tool.rb

  Copied cool-tool.rb → Formula/cool-tool.rb
  Published cool-tool v2.1.0 to <your-tap>
```

| Interaction | Action |
|------------|--------|
| (automatic) | Copies to tap, git commit + push |
| Tap not installed | Redirect to **TapSetup** workflow |

## Step 7: Install and Verify — `brew install`

Install the tool globally via Homebrew and verify it works.

**Source:** `Workflows/Adopt.md` (Step 7)

```
$ brew update
$ brew install <your-tap>/cool-tool
  → Installed: cool-tool v2.1.0

$ cool-tool --version
  → cool-tool version 2.1.0

$ cool-tool --help
  → Usage: cool-tool [command] [flags]
    ...
```

| Interaction | Action |
|------------|--------|
| (automatic) | brew install → version check → help check |
| Install fails | Check SHA256, archive contents, binary name |
| Binary not found | Check formula `bin.install` name |

## Step 8: Clean Up — automatic

Remove temporary files created during the adopt process.

**Source:** `Workflows/Adopt.md` (Step 8)

```
$ rm -rf /tmp/cool-tool
$ rm -rf /tmp/adopt-assets/

  ✓ Temporary files cleaned
```

| Interaction | Action |
|------------|--------|
| (automatic) | Removes cloned repo and downloaded assets |

## Step 9: Report — summary

Present the adoption results with the install command.

**Source:** `Workflows/Adopt.md` (Step 9)

```
┌─────────────────────────────────────────────────────┐
│  ADOPT COMPLETE                                      │
│                                                      │
│  Tool:      cool-tool                                │
│  Source:    someone/cool-tool                         │
│  Version:  v2.1.0                                    │
│  Formula:  binary (from release assets)              │
│  Install:  brew install <your-tap>/cool-tool   │
│  Verified: ✓                                         │
└─────────────────────────────────────────────────────┘
```

| Interaction | Action |
|------------|--------|
| (display only) | Shows adoption summary |

---

## Quick Reference

### Decision Matrix

| Condition | Strategy | Steps Used |
|-----------|----------|------------|
| Own repo + no releases | Build → release → binary formula | 1-2-3-4-5-6-7-8-9 |
| Own repo + has releases | Binary formula from release assets | 1-2-5-6-7-8-9 |
| Third-party + has releases | Binary formula from release assets | 1-2-5-6-7-8-9 |
| Third-party + no releases | Source formula (builds on install) | 1-2-3-4-5-6-7-8-9 |

### All Commands

| Command | Step | Action |
|---------|------|--------|
| `gh release list` | 2 | Check for existing releases |
| `gh repo clone` | 3 | Clone repo to /tmp |
| `bun Detect.ts --project` | 4 | Detect language and binaries |
| `gh release download` | 5 | Download release assets |
| `shasum -a 256` | 5 | Compute SHA256 checksums |
| `bun FormulaGen.ts` | 5 | Generate Homebrew formula |
| `bun TapManager.ts publish` | 6 | Push formula to tap |
| `brew install` | 7 | Install via Homebrew |
| `rm -rf /tmp/{repo}` | 8 | Clean up temp files |

### Escape Paths

| From | Trigger | Goes To |
|------|---------|---------|
| Any step | `Ctrl+C` | Abort adoption |
| Step 2 (no releases) | — | Clone + build path (step 3) |
| Step 6 (no tap) | — | TapSetup workflow |
| Step 7 (install fails) | — | Debug formula, retry |

### Related Workflows

- [Release Pipeline](release-pipeline.md) — for releasing your own projects
- [Init Walkthrough](init-packaging.md) — creates Packaging.json (used internally)
- [Verify Walkthrough](verify-formula.md) — step 7 uses these checks

---

*Generated by WorkflowDoc — source: `Workflows/Adopt.md`*
*Last updated: 2026-02-26*
