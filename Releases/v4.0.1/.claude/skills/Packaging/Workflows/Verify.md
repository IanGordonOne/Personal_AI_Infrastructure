# Verify Workflow

Test that a Homebrew formula installs correctly and the binary works.

---

## Steps

### 1. Install Formula

```bash
brew install <your-tap>/{name}
```

If already installed, reinstall:
```bash
brew reinstall <your-tap>/{name}
```

### 2. Check Binary

Run the configured test command from Packaging.json:

```bash
{binary_name} --version
{binary_name} --help
```

Verify the output matches expectations:
- Version string matches the release version
- Help text is meaningful

### 3. Run Brew Test

```bash
brew test <your-tap>/{name}
```

This runs the `test do` block defined in the formula.

### 4. Audit Formula (Optional)

```bash
brew audit --strict <your-tap>/{name}
```

Or audit all formulas in the tap:
```bash
bun ~/.claude/skills/Packaging/Tools/TapManager.ts audit
```

### 5. Check Binary Location

```bash
which {binary_name}
```

Should be in the Homebrew bin path (e.g., `/opt/homebrew/bin/{binary_name}`).

### 6. Report

| Check | Result |
|-------|--------|
| `brew install` | PASS/FAIL |
| `--version` | PASS/FAIL (version string) |
| `--help` | PASS/FAIL |
| `brew test` | PASS/FAIL |
| `brew audit` | PASS/FAIL |
| `which` | Path |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| SHA256 mismatch | Re-download assets, recompute SHAs, update formula |
| Binary not found in archive | Check archive contains binary with correct name |
| Permission denied | Check binary has execute permission in archive |
| Wrong architecture | Verify platform detection in formula blocks |
| Test block fails | Check test command in Packaging.json |
