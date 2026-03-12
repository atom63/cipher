import { describe, expect, test } from "vitest";
import { parseCSS } from "../parsers/css-parser";
import { toVarName } from "../handlers/css-generator";

// ---------------------------------------------------------------------------
// CSS Round-Trip Tests
//
// Verifies that CSS exported by the generator can be parsed back by the
// CSS parser and produce tokens with correct names, types, values,
// categories, and modes. This catches regressions in the naming convention
// (Figma `/` ↔ CSS `-`) and in type inference / value parsing.
// ---------------------------------------------------------------------------

/** Helper: build a Cipher-style multi-file CSS bundle with section headers */
function bundle(files: Record<string, string>): string {
	return Object.entries(files)
		.map(([name, content]) => `/* === ${name} === */\n${content}`)
		.join("\n\n");
}

// ---------------------------------------------------------------------------
// Naming convention round-trip
// ---------------------------------------------------------------------------

describe("naming convention round-trip", () => {
	const paths = [
		"color/brand/primary/500",
		"color/black/50",
		"spacing/4",
		"rounded/lg",
		"duration/250",
		"blur/xs",
		"font/typescale/body/font/size",
		"font/typescale/body/line/height",
		"font/family/sans",
		"z/layer/base",
		"surface/light/4",
		"surface/dark/12",
	];

	for (const figmaPath of paths) {
		test(`${figmaPath} → CSS → Figma`, () => {
			// Export: Figma name → CSS var name
			const cssVar = toVarName(figmaPath, "COLOR");
			expect(cssVar).toBe(`--${figmaPath.replace(/\//g, "-")}`);

			// Import: CSS var name → Figma name (parser's toFigmaName)
			const css = `:root { ${cssVar}: #000; }`;
			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
			expect(result.tokens[0].figmaName).toBe(figmaPath);
		});
	}
});

// ---------------------------------------------------------------------------
// Full bundle round-trip: primitives
// ---------------------------------------------------------------------------

describe("primitives round-trip", () => {
	const css = bundle({
		"primitives.css": `
@theme inline {
  --color-brand-primary-500: var(--color-brand-primary-500);
  --spacing-4: var(--spacing-4);
}

:root {
  --color-brand-primary-50: rgba(239, 246, 255, 1);
  --color-brand-primary-100: rgba(219, 234, 254, 1);
  --color-brand-primary-500: rgba(59, 130, 246, 1);
  --color-brand-primary-900: rgba(30, 58, 138, 1);
  --spacing-4: 16;
  --spacing-8: 32;
  --duration-250: 250;
  --rounded-md: 6;
  --blur-xs: 4;
  --font-family-sans: "Inter", system-ui, -apple-system, sans-serif;
}`,
	});

	test("parses all primitives with correct category", () => {
		const result = parseCSS(css);
		// @theme inline vars are var() references — skipped as duplicates
		// :root vars are the real values
		const rootTokens = result.tokens.filter((t) => t.category === "primitives");
		expect(rootTokens.length).toBeGreaterThanOrEqual(8);
		for (const token of rootTokens) {
			expect(token.category).toBe("primitives");
		}
	});

	test("color tokens have correct type and parsed value", () => {
		const result = parseCSS(css);
		const color500 = result.tokens.find(
			(t) => t.figmaName === "color/brand/primary/500" && t.type === "color",
		);
		expect(color500).toBeDefined();
		expect(color500!.type).toBe("color");
		expect(typeof color500!.value).toBe("object");
	});

	test("number tokens have correct type and parsed value", () => {
		const result = parseCSS(css);
		const spacing = result.tokens.find(
			(t) => t.figmaName === "spacing/4" && t.type === "number",
		);
		expect(spacing).toBeDefined();
		expect(spacing!.value).toBe(16);
	});

	test("font-family tokens are auto-skipped", () => {
		const result = parseCSS(css);
		const font = result.tokens.find((t) => t.figmaName === "font/family/sans");
		expect(font).toBeDefined();
		expect(font!.type).toBe("fontFamily");
		expect(font!.action).toBe("skip");
	});

	test("detects as Cipher export", () => {
		const result = parseCSS(css);
		expect(result.isCipherExport).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Full bundle round-trip: abstractions with var() references
// ---------------------------------------------------------------------------

describe("abstractions round-trip", () => {
	const css = bundle({
		"abstractions.css": `
:root {
  --surface-light-1: var(--color-zinc-50);
  --surface-light-4: var(--color-zinc-200);
  --surface-dark-1: var(--color-zinc-900);
  --duration-fast: var(--duration-150);
}`,
	});

	test("var() references produce reference type with correct alias path", () => {
		const result = parseCSS(css);
		const light4 = result.tokens.find(
			(t) => t.figmaName === "surface/light/4",
		);
		expect(light4).toBeDefined();
		expect(light4!.type).toBe("reference");
		expect(light4!.value).toBe("{color.zinc.200}");
		expect(light4!.action).toBe("import");
	});

	test("all tokens in abstractions category", () => {
		const result = parseCSS(css);
		for (const token of result.tokens) {
			expect(token.category).toBe("abstractions");
		}
	});
});

// ---------------------------------------------------------------------------
// Full bundle round-trip: semantics with Light/Dark modes
// ---------------------------------------------------------------------------

describe("semantics round-trip", () => {
	const css = bundle({
		"semantics.css": `
:root {
  --background: var(--surface-light-1);
  --foreground: var(--surface-dark-12);
  --primary: var(--color-brand-primary-500);
}

.dark {
  --background: var(--surface-dark-1);
  --foreground: var(--surface-light-12);
  --primary: var(--color-brand-primary-400);
}`,
	});

	test("Light mode tokens have modeName=Light", () => {
		const result = parseCSS(css);
		const lightBg = result.tokens.find(
			(t) =>
				t.figmaName === "background" &&
				(t as any).modeName === "Light",
		);
		expect(lightBg).toBeDefined();
		expect(lightBg!.type).toBe("reference");
		expect(lightBg!.value).toBe("{surface.light.1}");
	});

	test("Dark mode tokens have modeName=Dark", () => {
		const result = parseCSS(css);
		const darkBg = result.tokens.find(
			(t) =>
				t.figmaName === "background" &&
				(t as any).modeName === "Dark",
		);
		expect(darkBg).toBeDefined();
		expect(darkBg!.type).toBe("reference");
		expect(darkBg!.value).toBe("{surface.dark.1}");
	});

	test("both Light and Dark modes preserved (not deduplicated)", () => {
		const result = parseCSS(css);
		const bgTokens = result.tokens.filter(
			(t) => t.figmaName === "background",
		);
		expect(bgTokens).toHaveLength(2);
	});

	test("all tokens in semantics category", () => {
		const result = parseCSS(css);
		for (const token of result.tokens) {
			expect(token.category).toBe("semantics");
		}
	});
});

// ---------------------------------------------------------------------------
// color-mix() round-trip: reference + opacity
// ---------------------------------------------------------------------------

describe("color-mix round-trip", () => {
	const css = bundle({
		"semantics.css": `
:root {
  --accent: color-mix(in srgb, var(--surface-light-4), transparent 20%);
  --muted: color-mix(in srgb, var(--surface-light-3), transparent 50%);
}`,
	});

	test("color-mix with var() becomes reference with styleOpacity", () => {
		const result = parseCSS(css);
		const accent = result.tokens.find(
			(t) => t.figmaName === "accent",
		) as any;
		expect(accent).toBeDefined();
		expect(accent.type).toBe("reference");
		expect(accent.value).toBe("{surface.light.4}");
		expect(accent.styleOpacity).toBeCloseTo(0.8);
		expect(accent.action).toBe("import");
	});

	test("50% transparency → 0.5 opacity", () => {
		const result = parseCSS(css);
		const muted = result.tokens.find(
			(t) => t.figmaName === "muted",
		) as any;
		expect(muted.styleOpacity).toBeCloseTo(0.5);
	});
});

// ---------------------------------------------------------------------------
// @theme inline deduplication: should not produce duplicate tokens
// ---------------------------------------------------------------------------

describe("@theme inline deduplication", () => {
	const css = bundle({
		"primitives.css": `
@theme inline {
  --color-red-500: var(--color-red-500);
  --spacing-4: var(--spacing-4);
}

:root {
  --color-red-500: rgba(239, 68, 68, 1);
  --spacing-4: 16;
}`,
	});

	test("@theme inline var() refs are deduplicated against :root values", () => {
		const result = parseCSS(css);
		// @theme inline has var(--color-red-500) which is a self-referencing
		// var() — parsed as reference type. :root has the actual value.
		// Dedup by category+figmaName+mode keeps only the first occurrence.
		const red500Tokens = result.tokens.filter(
			(t) => t.figmaName === "color/red/500",
		);
		expect(red500Tokens).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// Multi-file bundle: categories routed correctly
// ---------------------------------------------------------------------------

describe("multi-file bundle routing", () => {
	const css = bundle({
		"primitives.css": `:root { --color-zinc-50: rgba(250, 250, 250, 1); }`,
		"abstractions.css": `:root { --surface-light-1: var(--color-zinc-50); }`,
		"semantics.css": `:root { --background: var(--surface-light-1); }`,
	});

	test("each file routes to correct category", () => {
		const result = parseCSS(css);
		const zinc = result.tokens.find((t) => t.figmaName === "color/zinc/50");
		const surface = result.tokens.find(
			(t) => t.figmaName === "surface/light/1",
		);
		const bg = result.tokens.find((t) => t.figmaName === "background");

		expect(zinc!.category).toBe("primitives");
		expect(surface!.category).toBe("abstractions");
		expect(bg!.category).toBe("semantics");
	});

	test("stats count all declarations", () => {
		const result = parseCSS(css);
		expect(result.stats.totalDeclarations).toBe(3);
		expect(result.stats.parsed).toBe(3);
	});
});

// ---------------------------------------------------------------------------
// Edge case: values that changed (simulating edit-then-reimport)
// ---------------------------------------------------------------------------

describe("value changes survive round-trip", () => {
	test("changed color value parses correctly", () => {
		const original = `:root { --color-brand-primary-500: rgba(59, 130, 246, 1); }`;
		const modified = `:root { --color-brand-primary-500: rgba(220, 38, 38, 1); }`;

		const r1 = parseCSS(original);
		const r2 = parseCSS(modified);

		expect(r1.tokens[0].figmaName).toBe(r2.tokens[0].figmaName);
		expect(r1.tokens[0].type).toBe(r2.tokens[0].type);
		// Values should differ
		expect(r1.tokens[0].originalValue).not.toBe(r2.tokens[0].originalValue);
	});

	test("changed numeric value parses correctly", () => {
		const original = `:root { --spacing-4: 16; }`;
		const modified = `:root { --spacing-4: 18; }`;

		const r1 = parseCSS(original);
		const r2 = parseCSS(modified);

		expect(r1.tokens[0].figmaName).toBe(r2.tokens[0].figmaName);
		expect(r1.tokens[0].value).toBe(16);
		expect(r2.tokens[0].value).toBe(18);
	});
});
