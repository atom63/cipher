# Cipher — AI Context

## Repo Structure

```
cipher/
  plugin/       # Figma plugin (React + esbuild + TypeScript)
  website/      # Marketing site (React + Vite + TanStack Router)
  boilerplate/  # Landing page starter, synced to a separate remote
```

## Boilerplate

`boilerplate/` is a stripped-down copy of `website/` — same stack and design system, with cipher-specific content, blog, slides, and components showcase removed. It lives inside this repo but is published to a separate GitHub repo via git subtree.

### Local dev

```bash
cd boilerplate
pnpm install  # installs locally, not into the root workspace
pnpm dev
```

A `.npmrc` with `ignore-workspace-root-check=true` is required so pnpm doesn't crawl up to the root `pnpm-workspace.yaml` and try to install as a workspace package.

### Remote

```
boilerplate → https://github.com/atom63/cipher-boilerplate.git
```

### Syncing to the boilerplate remote

After committing changes under `boilerplate/` to the main cipher repo, push just that subtree:

```bash
git subtree push --prefix=boilerplate boilerplate main
```

### What was removed from website/ to make the boilerplate

- Routes & pages: blog, slides, components showcase, preview, feature-cards
- `src/content/` — all MDX content (blog posts, component docs, slides)
- `src/components/slides/` and `src/components/common/mdx/`
- `src/config/slides/`
- `public/blog/` — blog media assets
- `vite-plugins/remark-reading-time.ts`
- MDX vite plugin and all remark/rehype deps from `vite.config.ts` and `package.json`
- `masonic`, `photoswipe`, `react-compare-slider` deps

### Re-adding the remote (if cloning fresh)

```bash
git remote add boilerplate https://github.com/atom63/cipher-boilerplate.git
```
