---
name: SkillExtract
description: Extract skills from any project via introspection, domain research, and council-style debate. USE WHEN extract skills, onboard project, wrap project with skills, generate skill map, audit skill coverage, skill extraction, project skills.
---

# SkillExtract

Analyzes any software project to determine its natural skill boundaries, then generates a complete skill set. Uses a 4-phase pipeline: introspect the codebase, research domain vocabulary, run a council-style debate between a Consolidator and Splitter to find optimal skill boundaries, then generate each skill.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/SkillExtract/`

If this directory exists, load and apply:
- `PREFERENCES.md` - User preferences and configuration

These define user-specific preferences. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the SkillExtract skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **SkillExtract** skill...
   ```

**Full documentation:** `~/.claude/skills/CORE/SYSTEM/THENOTIFICATIONSYSTEM.md`

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **ExtractSkills** | "extract skills", "onboard project", "wrap project with skills", "generate skill map" | `Workflows/ExtractSkills.md` |
| **AuditCoverage** | "audit skill coverage", "skill gaps", "coverage matrix" | `Workflows/AuditCoverage.md` |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **Council** | Dependency. Phase 3 debate follows Council's multi-round debate pattern with Consolidator and Splitter agents. |
| **CreateSkill** | Dependency. Phase 4 generates skills matching CreateSkill's validation checklist. ValidateSkill workflow used for post-generation checks. |
| **Research** | Complementary. Phase 2 domain research uses similar web search patterns for vocabulary extraction. |

## Key Resources

| Resource | Purpose |
|----------|---------|
| `SkillMapSchema.md` | YAML schema for the skill map artifact produced by Phase 3 and consumed by Phase 4. |
| `DebatePrompts.md` | Prompt templates for all 3 debate rounds plus synthesis heuristics. |

## Examples

**Example 1: Go CLI project**
```
User: "Extract skills for this project"
-> Phase 1: Explore agent catalogs cmd/ binaries, internal/ packages, pkg/ SDK layer
-> Phase 2: WebSearch for CLI tool domain vocabulary, practitioner roles
-> Phase 3: Consolidator proposes 5 skills (Commands, Config, Data, Infrastructure, Testing)
           Splitter proposes 14 skills (CLIParsing, ConfigValidation, DataImport, ...)
           3-round debate converges on 9 skills with clear boundaries
-> User approves skill map
-> Phase 4: Generate 9 SKILL.md files with workflows, save SkillMap.yaml
-> Output: 9 complete skills in ~/.claude/skills/, skill map in .claude/skill-data/
```

**Example 2: Python web application**
```
User: "Wrap this Django app with PAI skills"
-> Phase 1: Explore finds manage.py, apps/, urls.py routes, models, templates
-> Phase 2: WebSearch for Django practitioner workflows (migrations, testing, deployment)
-> Phase 3: Debate settles on 6 skills (Auth, API, Frontend, DataModel, DevOps, Testing)
-> Phase 4: Generate skills with Django-specific workflows
-> Output: 6 skills with Django-idiomatic triggers and workflows
```

**Example 3: Audit existing skills**
```
User: "Audit skill coverage for this project"
-> Invokes AuditCoverage workflow
-> Catalogs project capabilities, scans existing skills
-> Builds coverage matrix: 47 capabilities, 9 skills, 3 gaps, 1 overlap
-> Output: Coverage report with remediation options
```
