# Cipher

A powerful Figma plugin for managing and syncing design system tokens.

## Features

- 🎨 Import and manage design tokens
- 📦 Export tokens in multiple formats
- 🔄 Sync design tokens across Figma files
- 🎯 Support for Radix and Tailwind color libraries
- ♿ Built with accessibility in mind

## Development

This project uses Bun for fast, modern JavaScript tooling.

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0 (for Figma plugin development)

### Setup

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build
```

### Scripts

- `bun dev` - Start development mode with file watching
- `bun run build` - Build the plugin for production
- `bun run format` - Format code with Ultracite
- `bun run lint` - Lint code with Ultracite

## Project Structure

```
cipher/
├── components/       # React UI components
│   ├── import/      # Import-related components
│   ├── layout/      # Layout components
│   ├── library/     # Library selector components
│   └── ui/          # Reusable UI components
├── handlers/        # Plugin message handlers
├── libraries/       # Design system libraries (Radix, Tailwind)
├── pages/           # Main application pages
├── parsers/         # Token parsers
├── types/           # TypeScript type definitions
├── code.ts          # Figma plugin code (runs in sandbox)
├── ui.tsx           # React UI entry point
└── build.js         # Build configuration
```

## Tech Stack

- **Framework**: React 18
- **Build Tool**: esbuild
- **Language**: TypeScript
- **Styling**: SCSS + CSS Modules
- **Code Quality**: Ultracite (Biome-based)

## Contributing

This project enforces strict type safety and accessibility standards. Please ensure all code passes linting and type checking before committing.

## License

MIT © You Zhang (ATOM63)
