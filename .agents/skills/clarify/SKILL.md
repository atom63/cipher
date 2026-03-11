---
name: clarify
description: Improve unclear UX copy, error messages, labels, and microcopy across the interface.
user-invokable: true
args:
  - name: target
    description: The feature or component with unclear copy (optional)
    required: false
---

Find and fix unclear, ambiguous, or unhelpful interface text so users understand immediately without friction.

## Process

1. **Identify scope**: If a target is provided, focus on that component/page. Otherwise, scan broadly.
2. **Read the code**: Open the target files and extract every user-facing string — labels, placeholders, errors, confirmations, empty states, tooltips, buttons, loading/progress text, toasts, descriptions, section headers.
3. **Flag problems**: jargon, vagueness, passive voice, blame language, missing context, inconsistent terms, `(s)` pluralization hacks, dead-end empty states (no next step), generic buttons ("OK", "Submit"), overly long text.
4. **Rewrite** each flagged string following the principles below.
5. **Cross-check**: Search the codebase for the same concept used elsewhere. Ensure terminology is consistent across pages (e.g., "token" vs "variable" vs "item" — pick one per context).
6. **Verify build**: Run type check after changes.

## Principles

- **Specific over generic**: "Import 3 tokens" not "Submit" — name the object and the count
- **Concise over wordy**: Cut filler, but don't sacrifice meaning
- **Active over passive**: "Deleted 2 variables" not "2 variables have been deleted"
- **Helpful over blaming**: "Value must be a hex color (e.g., #FF0000)" not "Invalid value"
- **Next step included**: Errors and empty states should say what to do, not just what happened
- **Proper pluralization**: Use ternary: `n === 1 ? "token" : "tokens"` — never `token(s)`
- **Consistent terminology**: One term per concept everywhere. In Cipher:
  - "token" = design token from JSON/CSS (import context)
  - "variable" = Figma variable (manage context)
  - "collection" = Figma variable collection
  - "mode" = a mode within a collection (e.g., Light/Dark)

## Common Fixes

| Pattern | Before | After |
|---------|--------|-------|
| Vague error | "Something went wrong" | "Couldn't save — check your connection and try again" |
| Generic button | "OK" / "Submit" | "Save changes" / "Delete 3 variables" |
| Dead-end empty | "No items" | "No variables yet. Import a token file to get started." |
| Jargon | "Tokenize collection" | "Convert to design tokens" |
| Blame | "You entered an invalid value" | "Value must be a hex color (e.g., #FF0000)" |
| Loading mystery | "Loading..." | "Loading collections…" |
| Confirmation | "Are you sure?" | "Delete 3 variables? This can't be undone." |
| Truncated info | "3 errors found" | "3 errors — fix before importing" |
| Stale count | "Found 42 tokens" | "42 tokens found · 38 selected for import" |

## Implementation

- Use `useToast` for transient feedback — never `alert()`
- Confirmation dialogs: specific action in title, consequences in body, verb in confirm button
- Pluralize with ternary: `` `Import ${n} ${n === 1 ? "token" : "tokens"}` ``
- Labels describe content, not action: "Collection name" not "Enter collection name"
- Use `·` (middle dot) or `—` (em dash) as separators, not `•` or `-`
- Ellipsis in loading text uses `…` (single character), not `...`
