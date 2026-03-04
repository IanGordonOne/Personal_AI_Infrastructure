# Graph Registry

## Overview

KnowledgeIntegrate writes pages to LogSeq graphs on the local filesystem. This file describes how to discover and register graphs.

## Discovery

At runtime, scan common LogSeq graph locations:

```bash
# macOS iCloud sync (LogSeq default on iOS/macOS)
find "$HOME/Library/Mobile Documents/iCloud~com~logseq~logseq/Documents" -maxdepth 2 -name "pages" -type d 2>/dev/null | while read dir; do
  echo "$(basename $(dirname "$dir")): AVAILABLE at $(dirname "$dir")"
done

# Common local paths
for dir in "$HOME/Documents" "$HOME/.logseq" "$HOME/logseq" "$HOME/.config"; do
  find "$dir" -maxdepth 3 -name "pages" -type d 2>/dev/null | while read pdir; do
    echo "$(basename $(dirname "$pdir")): AVAILABLE at $(dirname "$pdir")"
  done
done
```

## User-Registered Graphs

Users can register additional graphs by creating a customization file:

`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/KnowledgeIntegrate/graphs.md`

Format:

```markdown
| Name | Path | Purpose |
|------|------|---------|
| My KB | ~/Documents/my-knowledge-graph/ | General knowledge |
| Work Notes | ~/Documents/work-logseq/ | Work-related knowledge |
```

User-registered graphs take priority over auto-discovered graphs.

## Graph Selection Rules

1. If user specifies a graph by name or path, use that
2. If user has registered graphs in the customization file, prefer those
3. If only one graph is discovered, use it automatically
4. If multiple graphs are found, present the list and ask the user
5. If target graph has no `pages/` directory, create it

## Adding New Graphs

To register a new graph, either:
- Add a row to the user customization file above
- Or tell the agent: "Use my graph at {path}" — it will be used for that session
