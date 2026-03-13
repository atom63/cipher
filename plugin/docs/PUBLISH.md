# Publishing Checklist

## Required before publishing

- [ ] **Plugin ID** — Register at [figma.com/plugin-docs](https://www.figma.com/plugin-docs/publishing/), then replace `"your-plugin-id-here"` in `manifest.json`
- [ ] **Plugin icon** — 128×128 PNG → `assets/icon.png`
- [ ] **Cover image** — 1920×960 PNG → `assets/cover.png`
- [ ] Run `pnpm build` and verify `dist/` output

## Asset placement

```
cipher/
├── assets/
│   ├── icon.png        # 128×128 — shown in Figma plugin browser
│   └── cover.png       # 1920×960 — shown on Community page
├── manifest.json       # plugin ID goes here
└── dist/               # production build output
```

## Community page fields

- **Name**: Cipher
- **Tagline**: Design system token manager — batch variable & style editing, production CSS export
- **Description**: See suggested copy in README.md under "Publishing"
- **Categories**: Design Systems, Developer Tools
- **Tags**: design tokens, css variables, variables, styles, tailwind, radix, export, import
