# AuditCommands Workflow

## Purpose

Audit the slash command coverage of an existing project — find gaps (uncovered actions), stale commands (reference removed features), and quality issues (wrong model, overly broad tools).

## Trigger

"audit commands", "command gaps", "command coverage"

## Process (4 Steps)

### Step 1: Introspect Project

Reuse Phase 1 from ExtractCommands — launch an Explore agent to catalog repeatable developer actions (Makefile targets, CLI subcommands, scripts, CI steps, README instructions).

If a `CommandMap.yaml` exists at `<project>/.claude/skill-data/CommandMap.yaml`, load it as the baseline and only re-introspect to detect new actions added since the map was generated.

### Step 2: Scan Existing Commands

Scan both command locations:

```
# Project-scoped commands
Glob({ pattern: "**/*.md", path: "<project>/.claude/commands/" })

# Global commands (may apply to this project)
Glob({ pattern: "**/*.md", path: "~/.claude/commands/" })
```

For each command file found, extract:
- Name (from filename, kebab-case)
- Scope (project vs global)
- Description (from frontmatter)
- allowed-tools (from frontmatter)
- model (from frontmatter)
- What actions it covers (from body analysis)
- Inline context commands (`!`...``)

### Step 3: Build Coverage Matrix

Cross-reference project actions (Step 1) with command coverage (Step 2):

```
| Action | Command | Status |
|--------|---------|--------|
| run tests | /test | Covered |
| deploy to staging | (none) | GAP |
| lint code | /lint, /format | OVERLAP |
| run deprecated script | /old-deploy | STALE |
```

Additionally check quality issues:

```
| Command | Issue | Detail |
|---------|-------|--------|
| /deploy | Over-broad tools | allowed-tools: Bash (should be Bash(deploy:*)) |
| /analyze | Wrong model | Uses opus for simple grep — should be haiku |
| /test-all | Low frequency | Invoked < 1x/month per git history |
```

Status definitions:
- **Covered** — exactly one command handles this action
- **Gap** — no command for this action
- **Overlap** — multiple commands cover the same action
- **Stale** — command references features/files that no longer exist

### Step 4: Report & Remediate

Present the coverage matrix with summary statistics:

```
## Command Audit Report

- Total developer actions: 23
- Covered: 18 (78%)
- Gaps: 3
- Overlaps: 1
- Stale: 1
- Quality issues: 2

### Gaps
- deploy to staging → suggest: /deploy-staging
- seed database → suggest: /seed
- run benchmarks → suggest: /bench

### Quality Issues
- /deploy: tighten allowed-tools to Bash(make deploy:*)
- /analyze: downgrade model from opus to sonnet
```

For each issue, offer remediation via AskUserQuestion:

**Gaps:**
- Generate a new command to cover the gap
- Mark as intentionally uncovered (Makefile target is sufficient)
- Promote to skill if too complex for a command

**Overlaps:**
- Merge overlapping commands
- Keep both with clarified descriptions
- Rename to disambiguate

**Stale:**
- Update command to reflect current project state
- Delete the stale command

**Quality issues:**
- Auto-fix (tighten tools, downgrade model) with user approval
- Leave as-is with justification

If remediation involves generating new commands, invoke Phase 4 of ExtractCommands.

Update `CommandMap.yaml` with the remediated state.

## Error Handling

| Error | Recovery |
|-------|----------|
| No CommandMap.yaml and no commands exist | Report "No commands found" and offer to run ExtractCommands |
| No .claude/commands/ directory | Create it and offer to run ExtractCommands |
| Commands reference deleted files | Flag as stale, offer to update or delete |

## Related

- **ExtractCommands** (`Workflows/ExtractCommands.md`) — Initial command generation; Phase 1 is shared
- **SkillExtract** skill — Sibling for skill-level coverage auditing
- **System** skill — SystemIntegrity workflow checks for broken references
