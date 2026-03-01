---
name: CommandExtract
description: Extract slash commands from any project via introspection, domain research, and council-style debate. USE WHEN extract commands, generate commands, onboard commands, command map, audit commands, slash commands for project.
---

# CommandExtract

Analyzes any software project to determine its natural slash command set, then generates the command files. Uses a 4-phase pipeline: introspect repeatable actions, research domain workflows, run a council-style debate between a Consolidator (fewer general commands with arguments) and a Splitter (more focused single-purpose commands), then generate each command `.md` file.

Commands differ from skills: they are single `.md` files in `.claude/commands/` (project) or `~/.claude/commands/` (global), use kebab-case naming, and are explicitly invoked via `/command-name`. They represent repeatable actions a developer types 10x/day — not domain expertise that activates on intent.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/CommandExtract/`

If this directory exists, load and apply:
- `PREFERENCES.md` - User preferences and configuration

These define user-specific preferences. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the CommandExtract skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **CommandExtract** skill...
   ```

**Full documentation:** `~/.claude/skills/CORE/SYSTEM/THENOTIFICATIONSYSTEM.md`

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **ExtractCommands** | "extract commands", "generate commands", "onboard commands", "command map" | `Workflows/ExtractCommands.md` |
| **AuditCommands** | "audit commands", "command gaps", "command coverage" | `Workflows/AuditCommands.md` |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **SkillExtract** | Sibling. SkillExtract generates intent-activated skills; CommandExtract generates explicit slash commands. Run both to fully onboard a project. |
| **Council** | Dependency. Phase 3 debate follows Council's multi-round debate pattern with Consolidator and Splitter agents. |
| **CreateSkill** | Complementary. If a proposed command is too complex (multi-phase, needs state), promote it to a skill instead. |

## Key Resources

| Resource | Purpose |
|----------|---------|
| `CommandSchema.md` | YAML schema for the command map artifact produced by Phase 3 and consumed by Phase 4. |
| `DebatePrompts.md` | Prompt templates for all 3 debate rounds plus synthesis heuristics. |

## Examples

**Example 1: Go CLI project**
```
User: "Extract commands for this project"
-> Phase 1: Explore catalogs Makefile targets, CLI subcommands, scripts/, CI steps
-> Phase 2: WebSearch for Go project developer workflows, CLI tool operations
-> Phase 3: Consolidator proposes 6 commands (build, test, deploy, lint, docs, run)
           Splitter proposes 20 commands (build-cli, build-tui, test-unit, test-integration, ...)
           3-round debate converges on 12 commands
-> User approves command map
-> Phase 4: Generate 12 .md files in .claude/commands/
-> Output: 12 slash commands ready to use
```

**Example 2: Python web app**
```
User: "Generate slash commands for this Django project"
-> Phase 1: Explore finds manage.py commands, pytest, docker-compose, migrations
-> Phase 2: WebSearch for Django developer workflow shortcuts
-> Phase 3: Debate settles on 9 commands (migrate, test, serve, deploy, shell, lint, format, seed, check)
-> Phase 4: Generate commands with Django-specific bash inlines
-> Output: 9 commands in .claude/commands/
```

**Example 3: Audit existing commands**
```
User: "Audit my slash commands"
-> Invokes AuditCommands workflow
-> Catalogs project actions, scans existing .claude/commands/
-> Reports: 8 commands exist, 4 gaps (no deploy, no seed, no migrate, no format)
-> Output: Coverage report with remediation options
```
