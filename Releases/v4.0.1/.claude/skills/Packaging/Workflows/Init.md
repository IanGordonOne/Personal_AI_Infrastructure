# Init Workflow

Detect project type and generate Packaging.json configuration.

---

## Steps

### 1. Run Detection

```bash
bun ~/.claude/skills/Packaging/Tools/Detect.ts --project <path>
```

Where `<path>` is the project directory. If the user didn't specify a path, use the current working directory or ask.

### 2. Review Output

Present the detection results to the user:
- Language detected
- Binary entry points found
- Version source and current version
- GitHub remote
- Build configuration
- Target platforms

### 3. User Adjustments

Ask the user if they want to modify any detected values:

| Field | Common Adjustments |
|-------|-------------------|
| `binaries[].name` | Rename the CLI command |
| `targets` | Add/remove platforms |
| `formula.type` | Switch between binary/source |
| `formula.dependencies` | Add runtime deps |
| `formula.test_command` | Custom test command |
| `build.ldflags` | Add version injection |

### 4. Write Configuration

Once the user approves:

```bash
bun ~/.claude/skills/Packaging/Tools/Detect.ts --project <path> --init
```

This writes `<project>/.claude/skill-data/Packaging.json`.

### 5. Confirm

Report the path of the written config and suggest next steps:
- **Build**: Compile binaries for all targets
- **Formula**: Generate Homebrew formula
- **Release**: Full release pipeline
