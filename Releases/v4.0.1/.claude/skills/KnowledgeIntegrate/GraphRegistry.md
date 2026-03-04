# Graph Registry

## Overview

KnowledgeIntegrate writes pages to local knowledge graphs. Supported backends: **LogSeq**, **Obsidian**.

## Discovery

At runtime, discover available graphs by running each backend's discovery method:

1. Load `Backends/LogSeq.md` — run its **Discovery** snippet
2. Load `Backends/Obsidian.md` — run its **Discovery** snippet
3. Merge results into a unified list

Each discovery result has the format: `{name}|{backend}|{path}` — one line per graph/vault found.

## User-Registered Graphs

Users can register additional graphs by creating a customization file:

`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/KnowledgeIntegrate/graphs.md`

Format:

```markdown
| Name | Path | Backend | Purpose |
|------|------|---------|---------|
| My KB | ~/Documents/my-knowledge-graph/ | LogSeq | General knowledge |
| Research | ~/Documents/ObsidianVault/ | Obsidian | Research notes |
```

User-registered graphs take priority over auto-discovered graphs.

## Graph Selection Rules

1. If user specifies a graph by name or path, use that
2. If user has registered graphs in the customization file, prefer those
3. If only one graph is discovered, use it automatically
4. If multiple graphs are found, present the list (with backend type) and ask the user
5. If target graph is missing the expected directory structure, create it per the active backend profile

## Backend Detection

For auto-discovered graphs (not user-registered), determine the backend:

1. If `$GRAPH_ROOT/.obsidian/` exists → **Obsidian**
2. If `$GRAPH_ROOT/logseq/` exists → **LogSeq**
3. If `$GRAPH_ROOT/pages/` exists AND no `.obsidian/` → **LogSeq** (legacy heuristic)
4. If ambiguous, ask the user

## Adding New Graphs

To register a new graph, either:
- Add a row to the user customization file above
- Or tell the agent: "Use my graph at {path}" — it will be used for that session

## Adding New Backends

To support a new knowledge tool:
1. Create `Backends/{Name}.md` following the 13-section contract (see existing backends for the template)
2. Add its discovery snippet to the dispatch list above
3. Add detection heuristic to the Backend Detection section
