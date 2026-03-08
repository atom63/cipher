import { describe, expect, test } from "vitest";
import { SHADE_STEPS } from "../generators/color-scale";
import type { BrandConfig } from "../generators/three-tier";
import {
	generateCss,
	generateDesignSystem,
} from "../generators/three-tier";

const defaultConfig: BrandConfig = {
	primary: "#3B82F6",
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
			...defaultConfig,
			layers: "primitives",
		});
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toEqual(new Set(["primitives"]));
		expect(result.stats.abstractionCount).toBe(0);
		expect(result.stats.semanticCount).toBe(0);
	});

	test("includes destructive (red) primitive scale", () => {
		const result = generateDesignSystem({
			...defaultConfig,
			layers: "primitives",
			darkMode: false,
		});
		const names = result.tokens.map((t) => t.figmaName);
		for (const step of SHADE_STEPS) {
			expect(names).toContain(`destructive/${step}`);
		}
	});

	test("creates brand scale (50-950) and Radix gray (1-12)", () => {
		const result = generateDesignSystem({
			...defaultConfig,
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
			...defaultConfig,
			layers: "primitives",
			darkMode: false,
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).toContain("white-alpha/50");
		expect(names).toContain("black-alpha/50");
	});

	test("uses selected Radix gray palette", () => {
		const result = generateDesignSystem({
			...defaultConfig,
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
			...defaultConfig,
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
			...defaultConfig,
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
		});
		const spacingTokens = result.tokens.filter((t) => t.type === "spacing");
		expect(spacingTokens.length).toBeGreaterThan(0);
		for (const token of spacingTokens) {
			expect(typeof token.value).toBe("number");
		}
		const names = spacingTokens.map((t) => t.figmaName);
		expect(names).toContain("spacing/4");
		expect(names).toContain("spacing/8");
	});

	test("generates shadow tokens as STRING-compatible", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
		});
		const shadowTokens = result.tokens.filter((t) => t.type === "boxShadow");
		expect(shadowTokens.length).toBe(7);
		for (const token of shadowTokens) {
			expect(typeof token.value).toBe("string");
		}
	});

	test("generates duration tokens", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
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
		});
		const radiusTokens = result.tokens.filter((t) => t.type === "borderRadius");
		expect(radiusTokens.length).toBeGreaterThan(0);
		const categories = new Set(radiusTokens.map((t) => t.category));
		expect(categories).toContain("abstractions");
	});

	test("radius uses custom anchor", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			radius: 8,
		});
		const lgRadius = result.tokens.find((t) => t.figmaName === "radius/lg");
		expect(lgRadius?.value).toBe(8);
	});

	test("generates typography tokens in semantics", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
		});
		const typeTokens = result.tokens.filter(
			(t) => t.type === "fontSize" || t.type === "number",
		);
		expect(typeTokens.length).toBeGreaterThan(0);
		const names = typeTokens.map((t) => t.figmaName);
		expect(names).toContain("type/base/size");
		expect(names).toContain("type/base/line-height");
	});

	test("generates font family and weight tokens", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
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

	test("custom font overrides prepend to system stacks", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			darkMode: false,
			fonts: { sans: "Inter" },
		});
		const sansToken = result.tokens.find((t) => t.figmaName === "font/sans");
		expect(sansToken?.value).toContain("'Inter'");
		expect(sansToken?.value).toContain("ui-sans-serif");
	});

	test("different ratios produce different heading sizes", () => {
		const smallRatio = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			typescale: { base: 16, ratio: "minor-third", lineHeightBody: 150, lineHeightHeading: 125, stepsUp: 4, stepsDown: 2, round: true },
		});
		const largeRatio = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			typescale: { base: 16, ratio: "golden-ratio", lineHeightBody: 150, lineHeightHeading: 125, stepsUp: 4, stepsDown: 2, round: true },
		});

		const smallXl = smallRatio.tokens.find(
			(t) => t.figmaName === "type/xl/size" && t.type === "fontSize",
		);
		const largeXl = largeRatio.tokens.find(
			(t) => t.figmaName === "type/xl/size" && t.type === "fontSize",
		);
		// Golden ratio xl should be much larger than minor third xl
		expect(Number(largeXl?.value)).toBeGreaterThan(Number(smallXl?.value));
	});
});

// =========================================================================
// Semantic mode (primitives + semantics, no abstractions)
// =========================================================================

describe("semantic mode (default)", () => {
	test("generates primitives and semantics, no abstractions", () => {
		const result = generateDesignSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("semantics");
		expect(categories).not.toContain("abstractions");
		expect(result.stats.abstractionCount).toBe(0);
	});

	test("semantic color tokens reference primitives directly", () => {
		const result = generateDesignSystem(defaultConfig);
		const semantics = result.tokens.filter(
			(t) => t.category === "semantics" && t.type === "color",
		);
		for (const token of semantics) {
			expect(token.originalValue).toMatch(/^\{primitives\./);
		}
	});

	test("background/default references Radix gray step 1", () => {
		const result = generateDesignSystem(defaultConfig);
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
		const result = generateDesignSystem(defaultConfig);
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
			...defaultConfig,
			darkMode: false,
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		for (const token of semantics) {
			expect((token as any).modeName).toBeUndefined();
		}
	});

	test("includes card, popover, destructive, input, ring, status semantics", () => {
		const result = generateDesignSystem(defaultConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);
		expect(names).toContain("card/default");
		expect(names).toContain("card/foreground");
		expect(names).toContain("popover/default");
		expect(names).toContain("popover/foreground");
		expect(names).toContain("destructive/default");
		expect(names).toContain("destructive/foreground");
		expect(names).toContain("destructive/border");
		expect(names).toContain("destructive/muted");
		expect(names).toContain("destructive/muted-foreground");
		expect(names).toContain("input/default");
		expect(names).toContain("ring/default");
		expect(names).toContain("ring/primary");
		expect(names).toContain("success/default");
		expect(names).toContain("warning/default");
		expect(names).toContain("info/default");
	});

	test("destructive semantics reference destructive primitive scale", () => {
		const result = generateDesignSystem({
			...defaultConfig,
			darkMode: false,
		});
		const destructiveDefault = result.tokens.find(
			(t) =>
				t.category === "semantics" && t.figmaName === "destructive/default",
		);
		expect(destructiveDefault?.originalValue).toBe(
			"{primitives.destructive.500}",
		);
	});

	test("includes accent semantics when secondary provided", () => {
		const result = generateDesignSystem({
			...defaultConfig,
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
		...defaultConfig,
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
			...defaultConfig,
			darkMode: false,
		});
		expect(css).toContain("@theme inline {");
		expect(css).toContain(":root {");
		expect(css).toContain("--color-brand-500:");
		expect(css).toContain("--color-destructive-500:");
		expect(css).toContain("--color-slate-1:");
		// Semantic tokens (flat shadcn-compatible names)
		expect(css).toContain("--card:");
		expect(css).toContain("--destructive:");
		expect(css).toContain("--input:");
		expect(css).toContain("--ring:");
		expect(css).toContain("--success:");
		expect(css).toContain("--warning:");
		expect(css).toContain("--info:");
		// @theme inline includes semantic registrations
		expect(css).toContain("--color-card: var(--card);");
		expect(css).toContain("--color-destructive: var(--destructive);");
		// color-mix support
		expect(css).toContain("color-mix(in srgb,");
		expect(css).toContain("--color-success-500:");
		expect(css).toContain("--color-warning-500:");
		expect(css).toContain("--color-info-500:");
	});

	test("includes dark mode when enabled", () => {
		const css = generateCss(defaultConfig);
		expect(css).toContain(".dark {");
	});

	test("no dark mode block when disabled", () => {
		const css = generateCss({
			...defaultConfig,
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
		expect(css).toContain("--typography-base-font-size:");
		expect(css).toContain("--font-sans:");
		expect(css).toContain("--font-weight-bold:");
		expect(css).toContain("--duration-short:");
		// Typography uses flat :root vars (no responsive breakpoints)
		expect(css).toContain("--typography-base-line-height:");
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

