# TapSetup Workflow

Create and configure the personal Homebrew tap. **One-time setup.**

---

## Pre-Flight Check

First check if the tap already exists:

```bash
bun ~/.claude/skills/Packaging/Tools/TapManager.ts init
```

If the tap repo already exists and is installed, this workflow is done.

## Steps

### 1. Create GitHub Repository

```bash
gh repo create <your-github-user>/homebrew-tap \
  --public \
  --description "Personal Homebrew tap for CLI tools" \
  --clone
```

### 2. Initialize Repository Structure

```bash
cd homebrew-tap
mkdir -p Formula
```

Create a README:
```
# Homebrew Tap

Personal Homebrew tap for CLI tools.

## Usage

```bash
brew tap <your-tap>
brew install <formula>
```

## Available Formulas

| Formula | Description |
|---------|-------------|
| (none yet) | |
```

### 3. Push Initial Commit

```bash
git add -A
git commit -m "Initialize homebrew tap"
git push -u origin main
```

### 4. Add Tap Locally

```bash
brew tap <your-tap>
```

### 5. Initialize Tap State

```bash
bun ~/.claude/skills/Packaging/Tools/TapManager.ts init
```

This creates the local state file tracking published formulas.

### 6. Verify

```bash
brew tap-info <your-tap>
```

Should show the tap is installed with 0 formulas.

## Post-Setup

The tap is now ready. Formulas can be published via:
- **Formula** workflow → generates .rb file
- **TapManager publish** → pushes to tap repo
- **Release** workflow → does everything end-to-end
