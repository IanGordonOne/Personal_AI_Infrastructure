# Character Reference — AsciiBox

The authoritative specification for box-drawing characters, UI element symbols, and alignment rules used across all PAI documentation.

---

## Character Sets

### Light (default)

| Character | Name | Codepoint | Position |
|-----------|------|-----------|----------|
| `┌` | Box Drawings Light Down and Right | U+250C | Top-left corner |
| `─` | Box Drawings Light Horizontal | U+2500 | Horizontal border |
| `┐` | Box Drawings Light Down and Left | U+2510 | Top-right corner |
| `│` | Box Drawings Light Vertical | U+2502 | Vertical border |
| `└` | Box Drawings Light Up and Right | U+2514 | Bottom-left corner |
| `┘` | Box Drawings Light Up and Left | U+2518 | Bottom-right corner |
| `├` | Box Drawings Light Vertical and Right | U+251C | Left T-junction |
| `┤` | Box Drawings Light Vertical and Left | U+2524 | Right T-junction |
| `┬` | Box Drawings Light Down and Horizontal | U+252C | Top T-junction |
| `┴` | Box Drawings Light Up and Horizontal | U+2534 | Bottom T-junction |
| `┼` | Box Drawings Light Vertical and Horizontal | U+253C | Cross junction |

### Double

| Character | Name | Codepoint | Position |
|-----------|------|-----------|----------|
| `╔` | Box Drawings Double Down and Right | U+2554 | Top-left corner |
| `═` | Box Drawings Double Horizontal | U+2550 | Horizontal border |
| `╗` | Box Drawings Double Down and Left | U+2557 | Top-right corner |
| `║` | Box Drawings Double Vertical | U+2551 | Vertical border |
| `╚` | Box Drawings Double Up and Right | U+255A | Bottom-left corner |
| `╝` | Box Drawings Double Up and Left | U+255D | Bottom-right corner |
| `╠` | Box Drawings Double Vertical and Right | U+2560 | Left T-junction |
| `╣` | Box Drawings Double Vertical and Left | U+2563 | Right T-junction |
| `╦` | Box Drawings Double Down and Horizontal | U+2566 | Top T-junction |
| `╩` | Box Drawings Double Up and Horizontal | U+2569 | Bottom T-junction |
| `╬` | Box Drawings Double Vertical and Horizontal | U+256C | Cross junction |

### Rounded

| Character | Name | Codepoint | Position |
|-----------|------|-----------|----------|
| `╭` | Box Drawings Light Arc Down and Right | U+256D | Top-left corner |
| `─` | Box Drawings Light Horizontal | U+2500 | Horizontal border (shared with light) |
| `╮` | Box Drawings Light Arc Down and Left | U+256E | Top-right corner |
| `│` | Box Drawings Light Vertical | U+2502 | Vertical border (shared with light) |
| `╰` | Box Drawings Light Arc Up and Right | U+2570 | Bottom-left corner |
| `╯` | Box Drawings Light Arc Up and Left | U+256F | Bottom-right corner |

---

## UI Element Vocabulary

Standard symbols for representing TUI components in mockups:

| Symbol | Meaning | Example |
|--------|---------|---------|
| `▸` | Selected item (radio) | `▸ Buy` |
| `○` | Unselected radio | `○ Sell` |
| `◉` | Active/checked radio | `◉ Market` |
| `[x]` | Checked checkbox | `[x] US Large Cap` |
| `[ ]` | Unchecked checkbox | `[ ] International` |
| `> _` | Text input cursor | `> AAPL_` |
| `████░░░░` | Progress bar | `████████░░░░ 67%` |
| `▼` | Expanded tree/dropdown | `▼ Equities` |
| `►` | Collapsed tree/dropdown | `► Fixed Income` |
| `⠋` | Spinner | `⠋ Loading...` |
| `▁▂▃▄▅▆▇█` | Spark/bar chart | `▂▅▇▃▁` |

---

## Alignment Rules

These rules are the core specification. All box-drawn content in PAI documentation MUST follow them.

### Rule 1: Width Invariant

Every line from `┌` to `└` (inclusive) must have identical display width. No exceptions.

```
┌──────────────────────┐   ← width = 24
│  Content here        │   ← width = 24
│  More content        │   ← width = 24
├──────────────────────┤   ← width = 24
│  Section two         │   ← width = 24
└──────────────────────┘   ← width = 24
```

### Rule 2: Padding Convention

2-space inner padding on each side between the vertical border and content:

```
│  content here  │
^^              ^^
 2 spaces      2 spaces
```

Format: `│` + 2 spaces + content + padding spaces + 2 spaces + `│`

### Rule 3: Right-Edge Rule

The closing `│` (or `┐`, `┘`, `┤`) always appears at the column equal to the top border's total width. The right edge forms a perfectly straight vertical line.

```
┌─────────────────────────────────────────────────────┐
│  Short line                                         │  ← right edge at col 55
│  A much longer line that takes more space           │  ← right edge at col 55
│  Tiny                                               │  ← right edge at col 55
└─────────────────────────────────────────────────────┘
```

### Rule 4: Empty Lines

Empty lines within a box are `│` + (width - 2) spaces + `│`:

```
│                                                     │
```

Not `││` or `│ │` or a blank line.

### Rule 5: Standard Widths

| Name | Total Width | Content Width | Formula |
|------|-------------|---------------|---------|
| Narrow | 40 | 34 | 40 - 2 borders - 4 padding = 34 |
| Standard | 55 | 49 | 55 - 2 borders - 4 padding = 49 |
| Full | 70 | 64 | 70 - 2 borders - 4 padding = 64 |

Content width = Total width - 2 (borders) - 4 (2+2 padding).

Prefer standard widths. Custom widths are allowed when content demands it, but the width invariant (Rule 1) still applies.

---

## Title Borders

Titles are embedded in the top border:

```
┌─ TITLE ─────────────────────────────────────────────┐
```

Format: `┌─ ` + title text + ` ` + remaining `─` + `┐`

The total width must still match the width invariant.

---

## Section Dividers

Section dividers use T-junctions and must match the outer width:

```
├─────────────────────────────────────────────────────┤
```

Total divider width = box width (same as top border, same as every other line).
