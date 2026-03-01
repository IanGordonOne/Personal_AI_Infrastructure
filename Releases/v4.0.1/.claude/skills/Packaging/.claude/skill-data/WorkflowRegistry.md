# Packaging Skill — Workflow Registry

All documentable workflows with source file mappings.

---

## CLI Workflows

| Workflow | Steps | Difficulty | Source Files | Entry |
|----------|-------|------------|-------------|-------|
| Init | 5 | Basic | `Workflows/Init.md`, `Tools/Detect.ts` | "init packaging" |
| Build | 6 | Intermediate | `Workflows/Build.md`, `BuildPatterns.md` | "build binaries" |
| Formula | 5 | Basic | `Workflows/Formula.md`, `Tools/FormulaGen.ts` | "generate formula" |
| TapSetup | 6 | Basic | `Workflows/TapSetup.md`, `Tools/TapManager.ts` | "create tap" |
| Release | 9 | Advanced | `Workflows/Release.md`, all tools | "release" |
| Adopt | 9 | Advanced | `Workflows/Adopt.md`, all tools | GitHub URL |
| Verify | 6 | Basic | `Workflows/Verify.md`, `Tools/TapManager.ts` | "verify formula" |

## CLI Tools

| Tool | Commands | Source |
|------|----------|--------|
| Detect.ts | `--project`, `--init`, `--json` | `Tools/Detect.ts` |
| FormulaGen.ts | `--config`, `--update-shas`, `--validate`, `--output` | `Tools/FormulaGen.ts` |
| TapManager.ts | `init`, `list`, `publish`, `sync`, `audit` | `Tools/TapManager.ts` |
