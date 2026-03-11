---
name: polish
description: Final quality pass before shipping. Fixes alignment, spacing, consistency, and detail issues.
user-invokable: true
args:
  - name: target
    description: The feature or area to polish (optional)
    required: false
---

Meticulous final pass on a feature/component. Focus on what users see and feel.

## Process

1. **Read the target** component/page code and its CSS module.
2. **Check layout**: Does it fill its container properly? Flex parents with `min-height: 0`. Scroll containers where expected. Sticky elements where needed. Empty/loading/success states vertically centered (`flex: 1`).
3. **Check density**: Compare spacing, font sizes, and padding against the ManagePage baseline (the densest, most polished page). TokenTable and ExportPage should feel consistent with it.
4. **Check states**: Every view state (loading, empty, error, success, default) should be covered and centered properly.
5. **Check copy**: Run the `clarify` skill mentally — are strings specific, concise, and consistent?
6. **Check interactions**: hover, focus-visible, disabled, active states on every interactive element.
7. **Fix issues** and verify build.

## Cipher-Specific Patterns

### Layout Rules
- `.page-content` is a flex column. State components (loading, empty, success) need `flex: 1` to center vertically.
- Long scrollable lists: `flex: 1; min-height: 0; overflow-y: auto` on the list, with actions pinned below via sticky or flex-shrink: 0.
- Action bars at the bottom of scrollable views should use `position: sticky; bottom: 0` so users don't scroll to reach them.

### Density Reference (ManagePage)
- Row padding: `var(--spacing-sm)`
- Row font-size: `var(--text-sm)`
- Variable name: `var(--text-xs)`
- Value text: `var(--text-xs)`
- Color swatches: before the name (left side), `16px`
- Borders: `border-top` via `+ .row` selector (not `border-bottom`)
- Row hover: `background: var(--accent)`

### Button Hierarchy
- Completion/result screens: ghost for undo/minor, secondary for dismiss, default for main action
- Forms: ghost for cancel, primary for the main submit action
- Toolbars: ghost for all actions

### Typography Scale
- Page title: SectionHeader `variant="primary"`
- Section title: SectionHeader `variant="secondary"`
- Body: `var(--text-sm)`
- Labels/meta: `var(--text-xs)`
- Mono values: `var(--text-xs)` with `var(--font-mono)`

### Color & Tokens
- Never hardcode colors — always semantic CSS vars
- `color-mix(in oklch, ...)` for transparent tints
- Color swatches use the `ColorSwatch` component or a simple div with `border: 1px solid var(--border)`

## Checklist

Focus on what matters most, in priority order:

- [ ] Layout fills space correctly (no unnecessary scrolling, actions reachable)
- [ ] All states centered and styled (loading, empty, error, success)
- [ ] Density matches reference (spacing, font sizes)
- [ ] Interactive states complete (hover, focus-visible, disabled)
- [ ] Copy is specific, concise, properly pluralized
- [ ] Icons consistent size (14px UI, 12px inline badges)
- [ ] No hardcoded colors or magic numbers
- [ ] Type-checks clean

**NEVER**:
- Polish before it's functionally complete
- Add features while polishing
- Introduce bugs (verify build after every change)
- Ignore systematic issues (if spacing is wrong everywhere, fix the token/pattern, not each instance)