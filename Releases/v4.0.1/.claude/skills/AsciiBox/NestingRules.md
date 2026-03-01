# Nesting Rules — AsciiBox

Rules for composing nested boxes within larger box structures.

---

## Rule 1: Indentation

Nested boxes are indented 2 spaces from the parent's content area:

```
┌─ Outer ─────────────────────────────────────────────┐
│                                                     │
│    ┌─ Inner ─────────────────────────────────────┐  │
│    │  Content inside inner box                   │  │
│    └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The inner box starts at: parent left `│` + 2 padding + 2 indent = 4 characters in from the parent border.

## Rule 2: Inner Width Limit

Inner box width must be ≤ parent content area - 4:

```
Parent content width = Parent total width - 2 borders - 4 padding
Max inner width      = Parent content width - 4 (2 indent + 2 trailing space)
```

| Parent Width | Parent Content | Max Inner Width |
|--------------|---------------|-----------------|
| 70 (full)    | 64            | 60              |
| 55 (standard)| 49            | 45              |
| 40 (narrow)  | 34            | 30              |

## Rule 3: Mixed Styles

Different box-drawing styles may be mixed across nesting levels. Common pattern: outer light, inner double for emphasis.

```
┌─ Dashboard ─────────────────────────────────────────┐
│                                                     │
│    ╔═ Alert ═══════════════════════════════════╗    │
│    ║  Critical: margin call triggered          ║    │
│    ╚═══════════════════════════════════════════╝    │
│                                                     │
│    ┌─ Positions ─────────────────────────────────┐  │
│    │  AAPL  +150  $182.50                        │  │
│    │  MSFT   -30  $415.20                        │  │
│    └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Rule 4: Maximum Depth

Maximum nesting depth: **3 levels** (outer → inner → innermost).

Beyond 3 levels, mockups become unreadable. If you need more structure, use section dividers (`├──┤`) within a single box instead.

## Rule 5: Independent Width Invariant

Each nested box independently maintains its own width invariant (CharacterReference.md Rule 1). Every line of an inner box has the same display width as that inner box's top border.

The parent box's width invariant still holds — each parent line including the nested content must pad to the parent's width.
