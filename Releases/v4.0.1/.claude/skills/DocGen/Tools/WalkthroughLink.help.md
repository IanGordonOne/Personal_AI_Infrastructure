# WalkthroughLink

Generate a markdown link to a walkthrough document by its slug ID.

## Usage

```bash
bun ~/.claude/skills/DocGen/Tools/WalkthroughLink.ts <id> [--dir docs/walkthroughs]
```

## Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `id` | Yes | Walkthrough slug (e.g. `trading-panel`, `daily-review`) |
| `--dir` | No | Directory containing walkthrough `.md` files (default: `docs/walkthroughs`) |

## Output

- **Found:** `[Title Case Name](walkthroughs/slug.md)` — title derived from slug (hyphens to spaces, capitalized)
- **Not found:** `<!-- walkthrough not found: id -->`

## Examples

```bash
# Default walkthroughs directory
bun WalkthroughLink.ts trading-panel
# Output: [Trading Panel](walkthroughs/trading-panel.md)

# Custom directory
bun WalkthroughLink.ts daily-review --dir docs/guides
# Output: [Daily Review](guides/daily-review.md)
```
