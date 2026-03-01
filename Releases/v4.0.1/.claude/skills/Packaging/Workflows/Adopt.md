# Adopt Workflow

GitHub repo URL → globally installed CLI via Homebrew. The "one-shot" workflow.

---

## Input

A GitHub repository URL. Can be:
- Own repo: `https://github.com/<your-github-user>/my-tool`
- Third-party: `https://github.com/someone/cool-tool`

## Steps

### 1. Parse Repository Info

Extract owner and repo from the URL:
```
https://github.com/{owner}/{repo}
```

### 2. Check for Existing Releases

```bash
gh release list --repo {owner}/{repo} --limit 5
```

**If releases exist with assets:**
- Download the latest release asset list
- Check for pre-built binaries (tar.gz, zip with platform names)
- → Skip to step 5 (binary formula from existing releases)

**If no releases or no binary assets:**
- → Continue to step 3 (clone and build)

### 3. Clone Repository

```bash
cd /tmp
gh repo clone {owner}/{repo} -- --depth 1
cd {repo}
```

### 4. Detect and Build

Run detection:
```bash
bun ~/.claude/skills/Packaging/Tools/Detect.ts --project /tmp/{repo}
```

**If own repo** (`owner == <your-github-user>`):
- Build binaries locally (follow Build workflow)
- Create a GitHub Release with assets
- Generate binary formula pointing at release assets

**If third-party repo:**
- Generate a **source formula** (builds from source on install)
- Or build locally and create a binary formula in the personal tap

### 5. Generate Formula

#### From Existing Releases (binary formula)

Parse the release assets to find platform-specific downloads:

```bash
gh release view --repo {owner}/{repo} --json assets --jq '.assets[].name'
```

Map asset filenames to platforms. Common patterns:
- `tool-v1.0.0-darwin-arm64.tar.gz`
- `tool_1.0.0_macos_amd64.tar.gz`
- `tool-linux-x86_64.tar.gz`

Get download URLs and compute SHA256s:
```bash
gh release download --repo {owner}/{repo} --pattern "*.tar.gz" --dir /tmp/adopt-assets/
cd /tmp/adopt-assets/
shasum -a 256 *.tar.gz
```

Create Packaging.json manually with the detected info, then:
```bash
bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts \
  --config /tmp/{repo}/.claude/skill-data/Packaging.json \
  --update-shas
```

#### From Source (source formula)

Generate a source formula that builds on install:
```bash
bun ~/.claude/skills/Packaging/Tools/FormulaGen.ts \
  --config /tmp/{repo}/.claude/skill-data/Packaging.json
```

Modify the formula `type` to `source` in Packaging.json before generating.

### 6. Publish to Tap

```bash
bun ~/.claude/skills/Packaging/Tools/TapManager.ts publish \
  --formula /tmp/{name}.rb
```

### 7. Install and Verify

```bash
brew update
brew install <your-tap>/{name}
{name} --version
{name} --help
```

### 8. Clean Up

```bash
rm -rf /tmp/{repo}
rm -rf /tmp/adopt-assets/
```

### 9. Report

Present results:
- Tool installed globally as `{name}`
- Source: `{owner}/{repo}`
- Formula type: binary or source
- Install command: `brew install <your-tap>/{name}`

## Decision Matrix

| Condition | Strategy |
|-----------|----------|
| Own repo + no releases | Build → release → binary formula |
| Own repo + has releases | Binary formula from release assets |
| Third-party + has releases | Binary formula from release assets |
| Third-party + no releases | Source formula (builds on install) |
