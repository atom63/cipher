import { describe, expect, test } from "vitest";
import { SHADE_STEPS } from "../generators/color-scale";
import type { BrandConfig } from "../generators/three-tier";
import {
	generateCss,
	generateDesignSystem,
	generateThreeTierSystem,
} from "../generators/three-tier";

const defaultConfig: BrandConfig = {
	primary: "#3B82F6",
};

// Minimal config — colors only, no non-color tokens
const minimalConfig: BrandConfig = {
	primary: "#3B82F6",
	includeSpacing: false,
	includeRadius: false,
	includeShadows: false,
	includeTypography: false,
	includeDurations: false,
	includeFonts: false,
};

describe("generateDesignSystem", () => {
	test("generates tokens for selected layers", () => {
		const result = generateDesignSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("semantics");
		expect(categories).not.toContain("abstractions");
	});

	test("stats match actual token counts", () => {
		const result = generateDesignSystem(defaultConfig);
		expect(result.stats.totalCount).toBe(result.tokens.length);

		const primitives = result.tokens.filter((t) => t.category === "primitives");
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const semantics = result.tokens.filter((t) => t.category === "semantics");

		expect(primitives.length).toBe(result.stats.primitiveCount);
		expect(abstractions.length).toBe(result.stats.abstractionCount);
		expect(semantics.length).toBe(result.stats.semanticCount);
	});

	test("all tokens have action 'import'", () => {
		const result = generateDesignSystem(defaultConfig);
		for (const token of result.tokens) {
			expect(token.action).toBe("import");
		}
	});

	test("all tokens have unique IDs", () => {
		const result = generateDesignSystem(defaultConfig);
		const ids = result.tokens.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

// =========================================================================
// Primitives-only mode
// =========================================================================

describe("primitives-only mode", () => {
	test("generates only primitives", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			layers: "primitives",
		});
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toEqual(new Set(["primitives"]));
		expect(result.stats.abstractionCount).toBe(0);
		expect(result.stats.semanticCount).toBe(0);
	});

	test("creates brand scale (50-950) and Radix gray (1-12)", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			layers: "primitives",
			darkMode: false,
		});
		const names = result.tokens.map((t) => t.figmaName);

		for (const step of SHADE_STEPS) {
			expect(names).toContain(`brand/${step}`);
		}
		// Radix gray uses 1-12 steps (default: slate)
		for (let i = 1; i <= 12; i++) {
			expect(names).toContain(`slate/${i}`);
		}
		expect(names).toContain("white");
		expect(names).toContain("black");
	});

	test("includes white/black alpha scales", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			layers: "primitives",
			darkMode: false,
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).toContain("white-alpha/50");
		expect(names).toContain("black-alpha/50");
	});

	test("uses selected Radix gray palette", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			layers: "primitives",
			grayName: "mauve",
			darkMode: false,
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).toContain("mauve/1");
		expect(names).toContain("mauve/12");
		expect(names).not.toContain("slate/1");
	});

	test("Radix grays have Light/Dark mode tokens when darkMode enabled", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			layers: "primitives",
			grayName: "slate",
			darkMode: true,
		});
		const grayTokens = result.tokens.filter((t) => t.figmaName === "slate/1");
		const modes = grayTokens.map((t) => (t as any).modeName);
		expect(modes).toContain("Light");
		expect(modes).toContain("Dark");

		// Light and dark values should differ
		const light = grayTokens.find((t) => (t as any).modeName === "Light");
		const dark = grayTokens.find((t) => (t as any).modeName === "Dark");
		expect(light?.originalValue).not.toBe(dark?.originalValue);
	});

	test("primitive color values are direct colors, not references", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			layers: "primitives",
			darkMode: false,
		});
		const colorTokens = result.tokens.filter((t) => t.type === "color");
		for (const token of colorTokens) {
			expect(token.originalValue).not.toMatch(/^\{/);
		}
	});
});

// =========================================================================
// Non-color tokens
// =========================================================================

describe("non-color tokens", () => {
	test("generates spacing tokens as FLOAT-compatible", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
			includeSpacing: true,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
		});
		const spacingTokens = result.tokens.filter((t) => t.type === "spacing");
		expect(spacingTokens.length).toBeGreaterThan(0);
		// All spacing values should be numbers
		for (const token of spacingTokens) {
			expect(typeof token.value).toBe("number");
		}
		// Should include standard Tailwind spacing
		const names = spacingTokens.map((t) => t.figmaName);
		expect(names).toContain("spacing/4");
		expect(names).toContain("spacing/8");
	});

	test("generates shadow tokens as STRING-compatible", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: true,
			includeTypography: false,
			includeDurations: false,
		});
		const shadowTokens = result.tokens.filter((t) => t.type === "boxShadow");
		expect(shadowTokens.length).toBe(7); // 0-6
		for (const token of shadowTokens) {
			expect(typeof token.value).toBe("string");
		}
	});

	test("generates duration tokens", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: true,
		});
		const durationTokens = result.tokens.filter((t) => t.type === "duration");
		expect(durationTokens.length).toBeGreaterThan(0);
		const names = durationTokens.map((t) => t.figmaName);
		expect(names).toContain("duration/250");
		expect(names).toContain("duration/500");
	});

	test("generates radius in semantics for semantic mode", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			includeSpacing: false,
			includeRadius: true,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
		});
		const radiusTokens = result.tokens.filter((t) => t.type === "borderRadius");
		expect(radiusTokens.length).toBeGreaterThan(0);
		const names = radiusTokens.map((t) => t.figmaName);
		expect(names).toContain("radius/sm");
		expect(names).toContain("radius/lg");
		expect(names).toContain("radius/full");
	});

	test("generates radius in abstractions for three-tier mode", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "three-tier",
			darkMode: false,
			includeSpacing: false,
			includeRadius: true,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
		});
		const radiusTokens = result.tokens.filter((t) => t.type === "borderRadius");
		expect(radiusTokens.length).toBeGreaterThan(0);
		// In three-tier, radius lives in abstractions
		const categories = new Set(radiusTokens.map((t) => t.category));
		expect(categories).toContain("abstractions");
	});

	test("radius uses custom anchor and multiplier", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			includeSpacing: false,
			includeRadius: true,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			radius: { anchor: 8, multiplier: 1 },
		});
		const lgRadius = result.tokens.find((t) => t.figmaName === "radius/lg");
		// lg = anchor + 0 offset = 8
		expect(lgRadius?.value).toBe(8);
	});

	test("generates typography tokens in semantics", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: true,
			includeDurations: false,
		});
		const typeTokens = result.tokens.filter(
			(t) => t.type === "fontSize" || t.type === "number",
		);
		expect(typeTokens.length).toBeGreaterThan(0);
		const names = typeTokens.map((t) => t.figmaName);
		expect(names).toContain("type/body/size");
		expect(names).toContain("type/body/line-height");
	});

	test("generates font family and weight tokens", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			includeFonts: true,
		});
		const fontTokens = result.tokens.filter(
			(t) => t.type === "fontFamily" || t.type === "fontWeight",
		);
		expect(fontTokens.length).toBeGreaterThan(0);
		const names = fontTokens.map((t) => t.figmaName);
		expect(names).toContain("font/sans");
		expect(names).toContain("font/mono");
		expect(names).toContain("font-weight/bold");
		expect(names).toContain("font-weight/normal");
	});

	test("can disable all non-color token types", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			layers: "primitives",
			darkMode: false,
		});
		for (const token of result.tokens) {
			expect(token.type).toBe("color");
		}
	});
});

// =========================================================================
// Semantic mode (primitives + semantics, no abstractions)
// =========================================================================

describe("semantic mode (default)", () => {
	test("generates primitives and semantics, no abstractions", () => {
		const result = generateDesignSystem(minimalConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("semantics");
		expect(categories).not.toContain("abstractions");
		expect(result.stats.abstractionCount).toBe(0);
	});

	test("semantic color tokens reference primitives directly", () => {
		const result = generateDesignSystem(minimalConfig);
		const semantics = result.tokens.filter(
			(t) => t.category === "semantics" && t.type === "color",
		);
		for (const token of semantics) {
			expect(token.originalValue).toMatch(/^\{primitives\./);
		}
	});

	test("background/default references Radix gray step 1", () => {
		const result = generateDesignSystem(minimalConfig);
		const bgDefaults = result.tokens.filter(
			(t) => t.category === "semantics" && t.figmaName === "background/default",
		);
		// Both light and dark reference step 1 (Radix handles the mode difference)
		const light = bgDefaults.find((t) => (t as any).modeName === "Light");
		const dark = bgDefaults.find((t) => (t as any).modeName === "Dark");
		expect(light?.originalValue).toBe("{primitives.slate.1}");
		expect(dark?.originalValue).toBe("{primitives.slate.1}");
	});

	test("has Light/Dark mode entries by default", () => {
		const result = generateDesignSystem(minimalConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const lightTokens = semantics.filter(
			(t) => (t as any).modeName === "Light",
		);
		const darkTokens = semantics.filter((t) => (t as any).modeName === "Dark");
		expect(lightTokens.length).toBe(darkTokens.length);
		expect(lightTokens.length).toBeGreaterThan(0);
	});

	test("single mode when darkMode is false", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			darkMode: false,
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		for (const token of semantics) {
			expect((token as any).modeName).toBeUndefined();
		}
	});

	test("includes accent semantics when secondary provided", () => {
		const result = generateDesignSystem({
			...minimalConfig,
			secondary: "#10B981",
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);
		expect(names).toContain("background/accent");
		expect(names).toContain("foreground/accent");
	});
});

// =========================================================================
// Three-tier mode (primitives + abstractions + semantics)
// =========================================================================

describe("three-tier mode", () => {
	const threeTierConfig: BrandConfig = {
		...minimalConfig,
		layers: "three-tier",
	};

	test("generates all three layers", () => {
		const result = generateDesignSystem(threeTierConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("abstractions");
		expect(categories).toContain("semantics");
	});

	test("abstractions reference primitives", () => {
		const result = generateDesignSystem(threeTierConfig);
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions" && t.type === "color",
		);
		for (const token of abstractions) {
			expect(token.originalValue).toMatch(/^\{primitives\./);
		}
	});

	test("semantics reference abstractions (not primitives directly)", () => {
		const result = generateDesignSystem(threeTierConfig);
		const semantics = result.tokens.filter(
			(t) => t.category === "semantics" && t.type === "color",
		);
		// Should reference abstractions or primitives.white/black
		for (const token of semantics) {
			expect(token.originalValue).toMatch(/^\{(abstractions|primitives)\./);
		}
		// At least some should reference abstractions
		const absRefs = semantics.filter((t) =>
			t.originalValue.toString().startsWith("{abstractions."),
		);
		expect(absRefs.length).toBeGreaterThan(0);
	});

	test("primary abstractions point to brand scale", () => {
		const result = generateDesignSystem(threeTierConfig);
		const primary500 = result.tokens.find(
			(t) => t.category === "abstractions" && t.figmaName === "primary/500",
		);
		expect(primary500?.originalValue).toBe("{primitives.brand.500}");
	});

	test("neutral abstractions point to Radix gray (1-12)", () => {
		const result = generateDesignSystem(threeTierConfig);
		const neutral1 = result.tokens.find(
			(t) => t.category === "abstractions" && t.figmaName === "neutral/1",
		);
		expect(neutral1?.originalValue).toBe("{primitives.slate.1}");
	});

	test("creates accent abstractions when secondary provided", () => {
		const result = generateDesignSystem({
			...threeTierConfig,
			secondary: "#10B981",
		});
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);
		expect(names).toContain("accent/500");
	});

	test("no accent abstractions without secondary", () => {
		const result = generateDesignSystem(threeTierConfig);
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);
		expect(names).not.toContain("accent/500");
	});
});

// =========================================================================
// CSS export
// =========================================================================

describe("generateCss", () => {
	test("produces valid CSS output", () => {
		const css = generateCss({
			...minimalConfig,
			darkMode: false,
		});
		expect(css).toContain("@theme inline {");
		expect(css).toContain(":root {");
		expect(css).toContain("--color-brand-500:");
		expect(css).toContain("--color-slate-1:");
	});

	test("includes dark mode when enabled", () => {
		const css = generateCss(minimalConfig);
		expect(css).toContain(".dark {");
	});

	test("no dark mode block when disabled", () => {
		const css = generateCss({
			...minimalConfig,
			darkMode: false,
		});
		expect(css).not.toContain(".dark {");
	});

	test("includes spacing, radius, shadows, typography, fonts, durations", () => {
		const css = generateCss({
			primary: "#3B82F6",
			darkMode: false,
		});
		expect(css).toContain("--spacing-4:");
		expect(css).toContain("--radius-lg:");
		expect(css).toContain("--shadow-3:");
		expect(css).toContain("--typography-body-font-size:");
		expect(css).toContain("--font-sans:");
		expect(css).toContain("--font-weight-bold:");
		expect(css).toContain("--duration-short:");
		// Responsive typography
		expect(css).toContain("@media (min-width: 40rem)");
		expect(css).toContain('[data-window-size="md"]');
	});
});

// =========================================================================
// Token compatibility
// =========================================================================

describe("token compatibility", () => {
	test("all tokens have required DesignToken fields", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			layers: "three-tier",
		});

		for (const token of result.tokens) {
			expect(token.id).toBeTruthy();
			expect(token.name).toBeTruthy();
			expect(token.figmaName).toBeTruthy();
			expect(token.value).toBeDefined();
			expect(token.originalValue).toBeTruthy();
			expect(token.type).toBeTruthy();
			expect(token.category).toBeTruthy();
			expect(token.action).toBe("import");
		}
	});
});

// =========================================================================
// Backwards compatibility
// =========================================================================

describe("generateThreeTierSystem (deprecated)", () => {
	test("still works and produces three-tier output", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("abstractions");
		expect(categories).toContain("semantics");
	});
});
