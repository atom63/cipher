# ATOM63 Design System Sync - Documentation

> Sync design tokens between JSON files and Figma variables with ease.

## 📚 Documentation Structure

### Essential Guides

- **[PRD.md](./PRD.md)** - Product Requirements Document
  - Complete feature specification
  - Use cases and user stories
  - Technical requirements

- **[QUICKSTART.md](./QUICKSTART.md)** - Getting Started Guide
- Installation instructions
  - Basic usage examples
  - Common workflows

- **[FEATURES.md](./FEATURES.md)** - Feature Documentation
  - Import & Export capabilities
  - Multi-collection support
  - Color format conversion
  - Reference resolution

- **[COMPONENTIZATION.md](./COMPONENTIZATION.md)** - Component Development Guide
  - UI component best practices
  - Design patterns
  - Accessibility guidelines
  - Recent improvements

### Archive

Implementation-specific documentation has been moved to `/archive/` for reference:
- Feature implementation notes
- Testing documentation
- Migration guides
- Historical decisions

## 🚀 Quick Links

### For Users
- **Getting Started**: See [QUICKSTART.md](./QUICKSTART.md)
- **Feature List**: See [FEATURES.md](./FEATURES.md)
- **Examples**: Check `figma/plugin/tokens/` for sample token files

### For Developers
- **Component Guide**: See [COMPONENTIZATION.md](./COMPONENTIZATION.md)
- **PRD**: See [PRD.md](./PRD.md)
- **Component Styleguide**: Run plugin and navigate to `/styleguide`

## 🎯 Core Features

### ⚠️ Important: Variables Only

**This plugin works with Figma Variables ONLY, not Styles.**

✅ **Works with:**
- Figma Variables (Color, Number, String)
- Variable Collections
- Variable Modes (Light/Dark, etc.)

❌ **Does NOT work with:**
- Color Styles
- Text Styles
- Effect Styles

See [Current Implementation Status](./PRD.md#-current-implementation-status) for details.

### Import Tokens
- Parse JSON design tokens
- Support multiple collection formats
- Create Figma variables with modes
- Resolve token references
- Track changes (created/updated/unchanged)

### Export Variables
- Export Figma variables as JSON tokens
- Support OKLCH, HEX, and RGBA color formats
- Preserve collection structure
- Maintain variable references
- Include descriptions and metadata

### Smart Features
- **Auto-detection**: Detects token format automatically
- **Multi-collection**: Import multiple collections at once
- **Selective import**: Choose which collections to import
- **Change tracking**: See exactly what changed
- **Override mode**: Safe updates to existing variables
- **Color conversion**: Convert between color formats

## 🏗️ Project Structure

```
figma/plugin/
├── code.ts                    # Main plugin entry (96 lines!)
├── ui.tsx                     # UI entry point
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Checkbox/          # Checkbox variants
│   │   ├── Button/            # Button component
│   │   ├── Input/             # Input fields
│   │   └── ...
│   ├── import/                # Import flow components
│   ├── export/                # Export flow components
│   └── library/               # Library components
├── libraries/
│   ├── shared-types.ts        # Common interfaces
│   └── color-converters.ts    # Color utilities
├── parsers/
│   ├── color-parsers.ts       # Color parsing
│   └── token-parsers.ts       # Token parsing
├── handlers/
│   ├── import-handler.ts      # Import logic
│   └── export-handler.ts      # Export logic
├── pages/                     # UI pages/routes
├── docs/                      # This documentation
└── tokens/                    # Sample token files
```

## 🎨 Design System

The plugin uses a custom design system with:
- **Design Tokens**: CSS custom properties for colors, spacing, typography
- **Component Library**: Reusable UI components
- **Styleguide**: Interactive component showcase (`/styleguide`)
- **Accessibility**: WCAG compliant components
- **Dark Mode**: Automatic theme support

### Component Hierarchy

```
Base Components → Composed Components → Specialized Components
     ↓                    ↓                      ↓
  Checkbox      CheckboxWithLabel         CheckboxCard
  Button        ButtonGroup               DialogActions
  Input         InputWithLabel            FormField
```

## 🔧 Development

### Building
```bash
cd figma/plugin
npm install
npm run build        # One-time build
npm run build:watch  # Watch mode
```

### Testing
- **Manual**: Open plugin in Figma and test workflows
- **Styleguide**: Navigate to `/styleguide` to test components
- **Sample Tokens**: Use files in `tokens/` directory

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting (via Biome)
- **CSS Modules**: Scoped styles
- **Modular**: Clean separation of concerns

## 📝 Recent Improvements

### Code Refactoring
- Reduced main file from 1,276 lines to 96 lines (92% reduction!)
- Modular architecture with clear separation
- Better maintainability and testability

### Checkbox Component Enhancements
1. **Custom Check Icon**: Using lucide-react for consistency
2. **Smart Layout**: Checkbox position adapts to content
3. **Top Alignment**: Better multi-line text support
4. **Optical Refinement**: Subtle padding for visual balance
5. **Thinner Border**: 1.5px for elegant appearance

### New Components
- **CheckboxCard**: Checkbox in card layout with icon support
- **Smart layout logic**: Adapts based on icon presence
- **Styleguide showcase**: Comprehensive examples

## 🤝 Contributing

When adding features:
1. Follow component patterns in [COMPONENTIZATION.md](./COMPONENTIZATION.md)
2. Add examples to styleguide page
3. Update relevant documentation
4. Test with sample token files
5. Ensure accessibility compliance

## 📖 Version History

- **v1.0**: Initial release with import/export
- **v1.1**: Multi-collection support
- **v1.2**: Change tracking and override mode
- **v1.3**: Code refactoring and modular architecture
- **v1.4**: Enhanced checkbox components and smart layouts

## 🐛 Known Issues & Limitations

See [PRD.md](./PRD.md) for detailed limitations and future improvements.

## 📞 Support

- **Issues**: Check archived implementation docs for troubleshooting
- **Examples**: See `tokens/` directory for sample formats
- **Styleguide**: Visual component reference at `/styleguide`

---

**Built with ❤️ by ATOM63**
