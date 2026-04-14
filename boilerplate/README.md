# Boilerplate

Landing page starter extracted from the [Cipher](https://github.com/atom63/cipher) website. Same stack and design system — cipher-specific content stripped out.

## Stack

- **React 19** + **Vite 7** + **TypeScript**
- **TanStack Router** (file-based routing)
- **TanStack React Query**
- **Tailwind CSS v4**
- **shadcn/ui** + **Radix UI** + **Base UI**
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

## Origin

This repo is published from the `cipher` monorepo using git subtree:

```bash
# From inside cipher/
git subtree push --prefix=boilerplate boilerplate main
```
