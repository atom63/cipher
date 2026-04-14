# Cipher Boilerplate

A free, open-source code starter built on the [Cipher](https://github.com/atom63/cipher) CSS token structure. Use it as a foundation for your next project — the full three-tier token system (primitives → aliases → semantics) is wired up and ready to go.

## Stack

- **React 19** + **Vite 7** + **TypeScript**
- **Tailwind CSS v4** with Cipher's CSS custom property token system
- **shadcn/ui** + **Radix UI** + **Base UI** component primitives
- **TanStack Router** (file-based routing)
- **TanStack React Query**
- **Biome** (via Ultracite) for linting/formatting

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Check for lint issues |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format code |
| `pnpm tokens` | Generate design tokens |

## Token Structure

Tokens follow Cipher's three-tier system, exported as CSS custom properties:

- `src/styles/tokens/primitives.css` — raw values (colors, radii, etc.)
- `src/styles/tokens/aliases.css` — named aliases
- `src/styles/tokens/semantics.css` — role-based semantic tokens (background, foreground, border…)

Tailwind CSS v4 consumes these via `@theme inline`.

## License

MIT © You Zhang (ATOM63)

## Origin

This repo is published from the `cipher` monorepo using git subtree:

```bash
# From inside cipher/
git subtree push --prefix=boilerplate boilerplate main
```
