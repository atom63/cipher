import { describe, expect, test } from "vitest";
import type { BrandConfig } from "../src/generators/three-tier";
import { generateCss, generateDesignSystem } from "../src/generators/three-tier";

const defaultConfig: BrandConfig = {
	primary: "#3B82F6",
};

describe("generateDesignSystem", () => {
	test("always generates all three tiers plus responsive", () => {
		const result = generateDesignSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("aliases");
		expect(categories).toContain("semantics");
		expect(categories).toContain("responsive");
	});

	test("stats match actual token counts", () => {
		const result = generateDesignSystem(defaultConfig);
		expect(result.stats.totalCount).toBe(result.tokens.length);

		const primitives = result.tokens.filter((t) => t.category === "primitives");
		const aliases = result.tokens.filter(
			(t) => t.category === "aliases",
		);
		const semantics = result.tokens.filter((t) => t.category === "semantics");

		expect(primitives.length).toBe(result.stats.primitiveCount);
		expect(aliases.length).toBe(result.stats.aliasCount);
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
// Primitives
// =========================================================================

describe("primitives", () => {
	test("includes white alpha scale (color/white/N)", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).toContain("color/white/0");
		expect(names).toContain("color/white/50");
		expect(names).toContain("color/white/100");
	});

	test("includes black alpha scale (color/black/N)", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).toContain("color/black/0");
		expect(names).toContain("color/black/50");
		expect(names).toContain("color/black/100");
	});

	test("includes Radix gray as color/gray/light and color/gray/dark", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const names = result.tokens.map((t) => t.figmaName);
		for (let i = 1; i <= 12; i++) {
			expect(names).toContain(`color/gray/light/${i}`);
			expect(names).toContain(`color/gray/dark/${i}`);
		}
	});

	test("gray primitives are single-mode (no modeName)", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const grayTokens = result.tokens.filter(
			(t) =>
				t.category === "primitives" &&
				t.figmaName.startsWith("color/gray/"),
		);
		for (const token of grayTokens) {
			expect((token as any).modeName).toBeUndefined();
		}
	});

	test("primitive color values are direct colors, not references", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const colorTokens = result.tokens.filter(
			(t) => t.category === "primitives" && t.type === "color",
		);
		for (const token of colorTokens) {
			expect(token.originalValue).not.toMatch(/^\{/);
		}
	});

	test("includes font family tokens (font/family/sans, font/family/mono)", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).toContain("font/family/sans");
		expect(names).toContain("font/family/mono");
	});

	test("does not include font weight tokens (handled by Tailwind natively)", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).not.toContain("font/weight/400");
		expect(names).not.toContain("font/weight/variable/regular");
	});

	test("custom font overrides use clean name strings", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			fonts: { sans: "Geist" },
		});
		const sansToken = result.tokens.find(
			(t) => t.figmaName === "font/family/sans",
		);
		expect(sansToken?.value).toBe("Geist");
	});

	test("brand color scale is in primitives (for preview) but not as tokens", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		// Brand scale is available in result.primitives for preview
		expect(result.primitives.length).toBeGreaterThan(0);
		expect(result.primitives[0].name).toBe("brand-primary");
		// But not emitted as primitive tokens
		const brandTokens = result.tokens.filter(
			(t) =>
				t.category === "primitives" && t.figmaName.startsWith("brand/"),
		);
		expect(brandTokens.length).toBe(0);
	});
});

// =========================================================================
// Non-color tokens
// =========================================================================

describe("non-color tokens", () => {
	test("generates spacing tokens as FLOAT-compatible", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
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
		});
		const shadowTokens = result.tokens.filter((t) => t.type === "boxShadow");
		expect(shadowTokens.length).toBe(7);
		for (const token of shadowTokens) {
			expect(typeof token.value).toBe("string");
		}
	});

	test("generates duration tokens in primitives (duration/N)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
		});
		const durationTokens = result.tokens.filter(
			(t) =>
				t.category === "primitives" &&
				t.figmaName.startsWith("duration/"),
		);
		expect(durationTokens.length).toBeGreaterThan(0);
		const names = durationTokens.map((t) => t.figmaName);
		expect(names).toContain("duration/250");
		expect(names).toContain("duration/500");
	});

	test("generates duration aliases in aliases (duration/N)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
		});
		const durationAliases = result.tokens.filter(
			(t) => t.category === "aliases" && t.figmaName.startsWith("duration/"),
		);
		expect(durationAliases.length).toBeGreaterThan(0);
		// Duration aliases reference primitives
		for (const token of durationAliases) {
			expect(String(token.originalValue)).toMatch(
				/^\{primitives\.duration\./,
			);
		}
	});

	test("generates radius in primitives (rounded/N)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
		});
		const radiusTokens = result.tokens.filter((t) => t.type === "borderRadius");
		expect(radiusTokens.length).toBeGreaterThan(0);
		const names = radiusTokens.map((t) => t.figmaName);
		expect(names).toContain("rounded/sm");
		expect(names).toContain("rounded/lg");
		expect(names).toContain("rounded/full");
		expect(names).toContain("rounded/DEFAULT");
		// All radius tokens are in primitives
		const categories = new Set(radiusTokens.map((t) => t.category));
		expect(categories).toEqual(new Set(["primitives"]));
	});

	test("radius uses custom anchor", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			radius: 8,
		});
		const lgRadius = result.tokens.find(
			(t) => t.figmaName === "rounded/lg",
		);
		expect(lgRadius?.value).toBe(8);
	});

	test("rounded/DEFAULT equals md value (anchor - 2)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			radius: 10,
		});
		const defaultToken = result.tokens.find(
			(t) => t.figmaName === "rounded/DEFAULT",
		);
		const mdToken = result.tokens.find(
			(t) => t.figmaName === "rounded/md",
		);
		expect(defaultToken).toBeDefined();
		expect(mdToken).toBeDefined();
		expect(defaultToken?.value).toBe(mdToken?.value);
	});

	test("rounded/DEFAULT tracks md across different anchors", () => {
		for (const anchor of [6, 8, 10, 12, 16]) {
			const result = generateDesignSystem({
				primary: "#3B82F6",
				radius: anchor,
			});
			const defaultToken = result.tokens.find(
				(t) => t.figmaName === "rounded/DEFAULT",
			);
			const mdToken = result.tokens.find(
				(t) => t.figmaName === "rounded/md",
			);
			expect(
				defaultToken?.value,
				`anchor=${anchor}: DEFAULT should equal md`,
			).toBe(mdToken?.value);
		}
	});

	test("generates typescale tokens in primitives with responsive variants", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
		});
		const typeTokens = result.tokens.filter(
			(t) =>
				t.category === "primitives" &&
				t.figmaName.startsWith("font/typescale/"),
		);
		expect(typeTokens.length).toBeGreaterThan(0);
		const names = typeTokens.map((t) => t.figmaName);
		// Each step has min/sm/md variants
		expect(names).toContain("font/typescale/base/size/min");
		expect(names).toContain("font/typescale/base/size/md");
		expect(names).toContain("font/typescale/base/line/height/min");
		expect(names).toContain("font/typescale/base/line/height/md");
	});

	test("different ratios produce different heading sizes", () => {
		const smallRatio = generateDesignSystem({
			primary: "#3B82F6",
			typescale: {
				base: 16,
				ratio: "minor-third",
				lineHeightBody: 150,
				lineHeightHeading: 125,
				stepsUp: 4,
				stepsDown: 2,
			},
		});
		const largeRatio = generateDesignSystem({
			primary: "#3B82F6",
			typescale: {
				base: 16,
				ratio: "golden-ratio",
				lineHeightBody: 150,
				lineHeightHeading: 125,
				stepsUp: 4,
				stepsDown: 2,
			},
		});

		const smallXl = smallRatio.tokens.find(
			(t) => t.figmaName === "font/typescale/xl/size/md",
		);
		const largeXl = largeRatio.tokens.find(
			(t) => t.figmaName === "font/typescale/xl/size/md",
		);
		// Golden ratio xl should be much larger than minor third xl
		expect(Number(largeXl?.value)).toBeGreaterThan(Number(smallXl?.value));
	});
});

// =========================================================================
// Aliases
// =========================================================================

describe("aliases", () => {
	test("surface references point to gray primitives", () => {
		const result = generateDesignSystem(defaultConfig);
		const surfaceLight1 = result.tokens.find(
			(t) =>
				t.category === "aliases" && t.figmaName === "surface/light/1",
		);
		expect(surfaceLight1?.originalValue).toBe(
			"{primitives.color.gray.light.1}",
		);

		const surfaceDark1 = result.tokens.find(
			(t) =>
				t.category === "aliases" && t.figmaName === "surface/dark/1",
		);
		expect(surfaceDark1?.originalValue).toBe(
			"{primitives.color.gray.dark.1}",
		);
	});

	test("generates full brand color ramp", () => {
		const result = generateDesignSystem(defaultConfig);
		const brandTokens = result.tokens.filter(
			(t) =>
				t.category === "primitives" &&
				t.figmaName.startsWith("color/brand-primary/"),
		);
		// 11 shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
		expect(brandTokens.length).toBe(11);
		expect(brandTokens.find((t) => t.figmaName === "color/brand-primary/500")).toBeDefined();
	});

	test("includes status color primitives", () => {
		const result = generateDesignSystem(defaultConfig);
		const names = result.tokens
			.filter((t) => t.category === "primitives")
			.map((t) => t.figmaName);
		expect(names).toContain("color/danger/500");
		expect(names).toContain("color/success/500");
		expect(names).toContain("color/warning/500");
		expect(names).toContain("color/info/500");
	});

	test("custom status colors override defaults", () => {
		const customDanger = "#DC2626";
		const result = generateDesignSystem({
			...defaultConfig,
			statusColors: { danger: customDanger },
		});
		const dangerToken = result.tokens.find(
			(t) =>
				t.category === "primitives" &&
				t.figmaName === "color/danger/500",
		);
		expect(dangerToken).toBeDefined();
		expect(dangerToken?.originalValue).toBeDefined();

		const successToken = result.tokens.find(
			(t) =>
				t.category === "primitives" &&
				t.figmaName === "color/success/500",
		);
		expect(successToken).toBeDefined();
	});

	test("creates secondary ramp when secondary provided", () => {
		const result = generateDesignSystem({
			...defaultConfig,
			secondary: "#10B981",
		});
		const secondaryTokens = result.tokens.filter(
			(t) => t.category === "primitives" && t.figmaName.startsWith("color/brand-secondary/"),
		);
		expect(secondaryTokens.length).toBe(11);
		expect(secondaryTokens.find((t) => t.figmaName === "color/brand-secondary/500")).toBeDefined();
	});

	test("no secondary ramp without secondary color", () => {
		const result = generateDesignSystem(defaultConfig);
		const secondaryTokens = result.tokens.filter(
			(t) => t.category === "primitives" && t.figmaName.startsWith("color/brand-secondary/"),
		);
		expect(secondaryTokens.length).toBe(0);
	});

	test("includes z-layer tokens in primitives", () => {
		const result = generateDesignSystem(defaultConfig);
		const names = result.tokens
			.filter((t) => t.category === "primitives")
			.map((t) => t.figmaName);
		expect(names).toContain("z-layer/default");
		expect(names).toContain("z-layer/modal");
	});

	test("does not include font family aliases (typography.css owns fonts directly)", () => {
		const result = generateDesignSystem(defaultConfig);
		const aliasNames = result.tokens
			.filter((t) => t.category === "aliases")
			.map((t) => t.figmaName);
		expect(aliasNames).not.toContain("font/family/primary");
		expect(aliasNames).not.toContain("font/family/secondary");
		expect(aliasNames).not.toContain("font/family/tertiary");
	});

	test("does not include font weight aliases (handled by Tailwind natively)", () => {
		const result = generateDesignSystem(defaultConfig);
		const absNames = result.tokens
			.filter((t) => t.category === "aliases")
			.map((t) => t.figmaName);
		expect(absNames).not.toContain("font/weight/default");
		expect(absNames).not.toContain("font/weight/strong");
	});

	test("all aliases are single-mode (no modeName)", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const aliases = result.tokens.filter(
			(t) => t.category === "aliases",
		);
		for (const token of aliases) {
			expect((token as any).modeName).toBeUndefined();
		}
	});
});

// =========================================================================
// Semantics
// =========================================================================

describe("semantics", () => {
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

	test("includes UI semantic tokens", () => {
		const result = generateDesignSystem(defaultConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);
		expect(names).toContain("background");
		expect(names).toContain("foreground");
		expect(names).toContain("card");
		expect(names).toContain("card-foreground");
		expect(names).toContain("popover");
		expect(names).toContain("popover-foreground");
		expect(names).toContain("primary");
		expect(names).toContain("primary-foreground");
		expect(names).toContain("secondary");
		expect(names).toContain("secondary-foreground");
		expect(names).toContain("muted");
		expect(names).toContain("muted-foreground");
		expect(names).toContain("accent");
		expect(names).toContain("accent-foreground");
		expect(names).toContain("destructive");
		expect(names).toContain("border");
		expect(names).toContain("input");
		expect(names).toContain("ring");
	});

	test("includes status, chart, and sidebar tokens", () => {
		const result = generateDesignSystem(defaultConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);
		expect(names).toContain("success");
		expect(names).toContain("warning");
		expect(names).toContain("info");
		expect(names).toContain("chart-1");
		expect(names).toContain("chart-5");
		expect(names).toContain("sidebar");
		expect(names).toContain("sidebar-foreground");
		expect(names).toContain("sidebar-border");
	});

	test("background references surface aliases", () => {
		const result = generateDesignSystem(defaultConfig);
		const bgTokens = result.tokens.filter(
			(t) => t.category === "semantics" && t.figmaName === "background",
		);
		const light = bgTokens.find((t) => (t as any).modeName === "Light");
		const dark = bgTokens.find((t) => (t as any).modeName === "Dark");
		expect(light?.originalValue).toBe("{aliases.surface.light.2}");
		expect(dark?.originalValue).toBe("{aliases.surface.dark.1}");
	});

	test("semantic color tokens reference aliases or primitives", () => {
		const result = generateDesignSystem({
			...defaultConfig,
		});
		const semanticColors = result.tokens.filter(
			(t) =>
				t.category === "semantics" &&
				t.type === "color" &&
				String(t.originalValue).startsWith("{"),
		);
		for (const token of semanticColors) {
			expect(String(token.originalValue)).toMatch(
				/^\{(aliases|primitives|semantics)\./,
			);
		}
	});

	test("includes brand-secondary semantic when secondary provided", () => {
		const result = generateDesignSystem({
			...defaultConfig,
			secondary: "#10B981",
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);
		// Legacy secondary → brand name "brand-secondary" → semantic "brand-brand-secondary"
		expect(names.some((n) => n.includes("brand-secondary"))).toBe(true);
	});

	test("light and dark for forced-mode contexts", () => {
		const result = generateDesignSystem(defaultConfig);
		const names = result.tokens
			.filter((t) => t.category === "semantics")
			.map((t) => t.figmaName);
		expect(names).toContain("light");
		expect(names).toContain("dark");
	});
});

// =========================================================================
// Responsive
// =========================================================================

describe("responsive", () => {
	test("generates responsive typography tokens with 3 modes", () => {
		const result = generateDesignSystem(defaultConfig);
		const responsive = result.tokens.filter((t) => t.category === "responsive");
		expect(responsive.length).toBeGreaterThan(0);

		const modes = new Set(responsive.map((t) => (t as any).modeName));
		expect(modes).toContain("desktop (md)");
		expect(modes).toContain("tablet (sm)");
		expect(modes).toContain("mobile (min)");
	});

	test("responsive font-size references primitive typescale variants", () => {
		const result = generateDesignSystem(defaultConfig);
		const fontSizeTokens = result.tokens.filter(
			(t) =>
				t.category === "responsive" &&
				t.figmaName === "typography/base/font/size",
		);
		expect(fontSizeTokens.length).toBe(3); // one per mode

		const desktop = fontSizeTokens.find((t) => (t as any).modeName === "desktop (md)");
		expect(desktop?.originalValue).toBe(
			"{primitives.font.typescale.base.size.md}",
		);

		const mobile = fontSizeTokens.find((t) => (t as any).modeName === "mobile (min)");
		expect(mobile?.originalValue).toBe(
			"{primitives.font.typescale.base.size.min}",
		);
	});

	test("responsive line-height references primitive typescale variants", () => {
		const result = generateDesignSystem(defaultConfig);
		const lhTokens = result.tokens.filter(
			(t) =>
				t.category === "responsive" &&
				t.figmaName === "typography/base/line/height",
		);
		expect(lhTokens.length).toBe(3);

		const tablet = lhTokens.find((t) => (t as any).modeName === "tablet (sm)");
		expect(tablet?.originalValue).toBe(
			"{primitives.font.typescale.base.line.height.sm}",
		);
	});

	test.each([
		{ base: 16, ratio: "major-third", stepsUp: 10, stepsDown: 2, lineHeightHeading: 125, lineHeightBody: 150 },
		{ base: 14, ratio: "major-second", stepsUp: 10, stepsDown: 2, lineHeightHeading: 120, lineHeightBody: 150 },
		{ base: 14, ratio: "major-second", stepsUp: 10, stepsDown: 2, lineHeightHeading: 125, lineHeightBody: 150 },
		{ base: 16, ratio: "minor-third", stepsUp: 6, stepsDown: 2, lineHeightHeading: 120, lineHeightBody: 150 },
	])("line-height = round(size × lhPct) for base=$base ratio=$ratio lhH=$lineHeightHeading", (tsConfig) => {
		// Regression: derived ratio from rounded values caused 1px drift
		const config: BrandConfig = {
			primary: "#3B82F6",
			typescale: tsConfig,
		};
		const result = generateDesignSystem(config);

		// Collect all primitive typescale line-height and size tokens
		const primitives = result.tokens.filter(
			(t) => t.category === "primitives" && t.figmaName.startsWith("font/typescale/"),
		);

		// Group by step + variant
		const sizeMap = new Map<string, number>();
		const lhMap = new Map<string, number>();
		for (const t of primitives) {
			const m = t.figmaName.match(/^font\/typescale\/(.+?)\/(size|line\/height)\/(min|sm|md)$/);
			if (!m) continue;
			const key = `${m[1]}/${m[3]}`;
			if (m[2] === "size") sizeMap.set(key, t.value as number);
			else lhMap.set(key, t.value as number);
		}

		const headingPct = tsConfig.lineHeightHeading / 100;
		const bodyPct = tsConfig.lineHeightBody / 100;

		// Every line-height must equal round(size × lhPct) using the config percentage
		for (const [key, lh] of lhMap) {
			const size = sizeMap.get(key);
			expect(size).toBeDefined();
			// Determine if heading or body — lg is large body text (uses body lh),
			// other steps above base use heading, base and below use body
			const stepName = key.split("/")[0];
			const isHeading = (size as number) > tsConfig.base && stepName !== "lg";
			const pct = isHeading ? headingPct : bodyPct;
			const expected = Math.round((size as number) * pct);
			expect(lh, `${key}: size=${size}, lh=${lh}, expected=${expected}`).toBe(expected);
		}
	});

	test("includes viewport/screen responsive token", () => {
		const result = generateDesignSystem(defaultConfig);
		const viewport = result.tokens.filter(
			(t) =>
				t.category === "responsive" &&
				t.figmaName === "viewport/screen",
		);
		expect(viewport.length).toBe(3);

		const desktop = viewport.find((t) => (t as any).modeName === "desktop (md)");
		expect(desktop?.originalValue).toBe("{primitives.screen.macbook-air}");
	});
});

// =========================================================================
// CSS export
// =========================================================================

describe("generateCss", () => {
	test("produces valid CSS output", () => {
		const css = generateCss({
			...defaultConfig,
		});
		expect(css).toContain("@theme inline {");
		expect(css).toContain(":root {");
		expect(css).toContain("--color-brand-primary-500:");
		// Gray uses --color-gray-light-N / --color-gray-dark-N pattern
		expect(css).toContain("--color-gray-light-1:");
		expect(css).toContain("--color-gray-light-12:");
		expect(css).toContain("--color-gray-dark-1:");
		expect(css).toContain("--color-gray-dark-12:");
		// Semantic tokens (shadcn-compatible names)
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
	});

	test("always includes dark mode block", () => {
		const css = generateCss(defaultConfig);
		expect(css).toContain(".dark {");
	});

	test("includes spacing, radius, shadows, typography, fonts, durations", () => {
		const css = generateCss({
			primary: "#3B82F6",
		});
		expect(css).toContain("--spacing-4:");
		expect(css).toContain("--radius-lg:");
		expect(css).toContain("--shadow-md:");
		expect(css).toContain("--font-sans:");
		expect(css).toContain("--duration-normal:");
		// Typography
		expect(css).toContain("--typography-base-font-size:");
		expect(css).toContain("--typography-base-line-height:");
	});

	test("includes status color tokens in CSS", () => {
		const css = generateCss(defaultConfig);
		expect(css).toContain("--color-danger-500:");
		expect(css).toContain("--color-success-500:");
		expect(css).toContain("--color-warning-500:");
		expect(css).toContain("--color-info-500:");
	});

	test("includes font family tokens in CSS", () => {
		const css = generateCss(defaultConfig);
		expect(css).toContain("--font-sans:");
		expect(css).toContain("--font-serif:");
		expect(css).toContain("--font-mono:");
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
// Multi-palette: brandColors, surfaces, mapping
// =========================================================================

describe("multi-palette", () => {
	const multiConfig: BrandConfig = {
		primary: "#3B82F6",
		brandColors: [
			{ name: "blue", hex: "#3B82F6" },
			{ name: "green", hex: "#10B981" },
			{ name: "purple", hex: "#8B5CF6" },
		],
		surfaces: [
			{ name: "slate", preset: "slate" },
			{ name: "sand", preset: "sand" },
		],
		mapping: {
			primaryBrand: "blue",
			darkPrimaryBrand: "purple",
			activeSurface: "slate",
		},
	};

	test("generates ramps for all brand colors", () => {
		const result = generateDesignSystem(multiConfig);
		const primNames = result.tokens
			.filter((t) => t.category === "primitives")
			.map((t) => t.figmaName);

		expect(primNames).toContain("color/blue/500");
		expect(primNames).toContain("color/green/500");
		expect(primNames).toContain("color/purple/500");

		// Each brand should have 11 steps
		const blueSteps = primNames.filter((n) => n.startsWith("color/blue/"));
		expect(blueSteps.length).toBe(11);
	});

	test("generates surface ramps for all surfaces", () => {
		const result = generateDesignSystem(multiConfig);
		const primNames = result.tokens
			.filter((t) => t.category === "primitives")
			.map((t) => t.figmaName);

		// Each surface should have light/dark 1-12
		expect(primNames).toContain("color/slate/light/1");
		expect(primNames).toContain("color/slate/dark/12");
		expect(primNames).toContain("color/sand/light/1");
		expect(primNames).toContain("color/sand/dark/12");

		const slateSteps = primNames.filter((n) => n.startsWith("color/slate/"));
		expect(slateSteps.length).toBe(24); // 12 light + 12 dark
	});

	test("aliases point to active surface", () => {
		const result = generateDesignSystem(multiConfig);
		const surfaceLight1 = result.tokens.find(
			(t) => t.category === "aliases" && t.figmaName === "surface/light/1",
		);
		expect(surfaceLight1?.originalValue).toBe("{primitives.color.slate.light.1}");
	});

	test("semantic primary uses mapped brand", () => {
		const result = generateDesignSystem(multiConfig);
		const primaryLight = result.tokens.find(
			(t) =>
				t.category === "semantics" &&
				t.figmaName === "primary" &&
				(t as any).modeName === "Light",
		);
		expect(primaryLight?.originalValue).toBe("{primitives.color.blue.500}");
	});

	test("semantic primary dark uses darkPrimaryBrand", () => {
		const result = generateDesignSystem(multiConfig);
		const primaryDark = result.tokens.find(
			(t) =>
				t.category === "semantics" &&
				t.figmaName === "primary" &&
				(t as any).modeName === "Dark",
		);
		expect(primaryDark?.originalValue).toBe("{primitives.color.purple.500}");
	});

	test("chart colors distribute across brand palette", () => {
		const result = generateDesignSystem(multiConfig);
		const charts = result.tokens.filter(
			(t) =>
				t.category === "semantics" &&
				t.figmaName.startsWith("chart-") &&
				(t as any).modeName === "Light",
		);
		expect(charts.length).toBe(5);

		const refs = charts.map((t) => t.originalValue);
		expect(refs).toContain("{primitives.color.blue.500}");
		expect(refs).toContain("{primitives.color.green.500}");
		expect(refs).toContain("{primitives.color.purple.500}");
	});

	test("emits brand-* semantic tokens for non-primary brands", () => {
		const result = generateDesignSystem(multiConfig);
		const semanticNames = result.tokens
			.filter((t) => t.category === "semantics")
			.map((t) => t.figmaName);

		// blue is primary, so no brand-blue
		expect(semanticNames).not.toContain("brand-blue");
		// green and purple get brand-* semantics
		expect(semanticNames).toContain("brand-green");
		expect(semanticNames).toContain("brand-purple");
	});

	test("surfaces support separate light/dark presets", () => {
		const config: BrandConfig = {
			primary: "#3B82F6",
			surfaces: [{
				name: "gray",
				preset: "slate",
				darkPreset: "sand",
			}],
			mapping: { primaryBrand: "brand-primary", activeSurface: "gray" },
			brandColors: [{ name: "brand-primary", hex: "#3B82F6" }],
		};
		const result = generateDesignSystem(config);
		const lightStep1 = result.tokens.find(
			(t) => t.category === "primitives" && t.figmaName === "color/gray/light/1",
		);
		const darkStep1 = result.tokens.find(
			(t) => t.category === "primitives" && t.figmaName === "color/gray/dark/1",
		);
		expect(lightStep1).toBeDefined();
		expect(darkStep1).toBeDefined();
		// Light and dark should have different values (different presets)
		expect(lightStep1?.originalValue).not.toBe(darkStep1?.originalValue);
	});

	test("backward compat: legacy config still works", () => {
		const legacy: BrandConfig = {
			primary: "#3B82F6",
			secondary: "#10B981",
			grayLight: "slate",
			grayDark: "sand",
		};
		const result = generateDesignSystem(legacy);
		const primNames = result.tokens
			.filter((t) => t.category === "primitives")
			.map((t) => t.figmaName);

		expect(primNames).toContain("color/brand-primary/500");
		expect(primNames).toContain("color/brand-secondary/500");
		expect(primNames).toContain("color/gray/light/1");
		expect(primNames).toContain("color/gray/dark/1");
	});
});

// =========================================================================
// CSS export: multi-palette
// =========================================================================

describe("generateCss — multi-palette", () => {
	const multiConfig: BrandConfig = {
		primary: "#3B82F6",
		brandColors: [
			{ name: "blue", hex: "#3B82F6" },
			{ name: "green", hex: "#10B981" },
		],
		surfaces: [{ name: "slate", preset: "slate" }],
		mapping: {
			primaryBrand: "blue",
			activeSurface: "slate",
		},
	};

	test("CSS includes all brand ramps in @theme inline", () => {
		const css = generateCss(multiConfig);
		expect(css).toContain("--color-blue-500:");
		expect(css).toContain("--color-green-500:");
	});

	test("CSS :root uses active surface name with light/dark", () => {
		const css = generateCss(multiConfig);
		expect(css).toContain("--color-slate-light-1:");
		expect(css).toContain("--color-slate-light-12:");
		expect(css).toContain("--color-slate-dark-1:");
		expect(css).toContain("--color-slate-dark-12:");
	});

	test("CSS .dark semantics reference surface dark vars", () => {
		const css = generateCss(multiConfig);
		const darkBlock = css.split(".dark {")[1];
		expect(darkBlock).toContain("var(--color-slate-dark-");
	});

	test("CSS semantic --primary references mapped brand", () => {
		const css = generateCss(multiConfig);
		expect(css).toContain("--primary: var(--color-blue-500)");
	});

	test("backward compat: legacy config CSS uses brand-primary", () => {
		const css = generateCss({ primary: "#3B82F6" });
		expect(css).toContain("--color-brand-primary-500:");
		expect(css).toContain("--color-gray-");
	});
});

// =========================================================================
// darkActiveSurface: separate light/dark surface mapping
// =========================================================================

describe("darkActiveSurface", () => {
	const config: BrandConfig = {
		primary: "#3B82F6",
		brandColors: [{ name: "blue", hex: "#3B82F6" }],
		surfaces: [
			{ name: "slate", preset: "slate" },
			{ name: "sand", preset: "sand" },
		],
		mapping: {
			primaryBrand: "blue",
			activeSurface: "slate",
			darkActiveSurface: "sand",
		},
	};

	test("aliases light refs point to activeSurface", () => {
		const result = generateDesignSystem(config);
		const surfLight1 = result.tokens.find(
			(t) => t.category === "aliases" && t.figmaName === "surface/light/1",
		);
		expect(surfLight1?.originalValue).toBe("{primitives.color.slate.light.1}");
	});

	test("aliases dark refs point to darkActiveSurface", () => {
		const result = generateDesignSystem(config);
		const surfDark1 = result.tokens.find(
			(t) => t.category === "aliases" && t.figmaName === "surface/dark/1",
		);
		expect(surfDark1?.originalValue).toBe("{primitives.color.sand.dark.1}");
	});

	test("preview radixGrayLight comes from activeSurface", () => {
		const result = generateDesignSystem(config);
		// slate is the light surface, so radixGrayLight should be slate
		expect(result.radixGrayLight).not.toBeNull();
	});

	test("preview radixGrayDark comes from darkActiveSurface", () => {
		const result = generateDesignSystem(config);
		// sand is the dark surface, so radixGrayDark should be sand (different from light)
		expect(result.radixGrayDark).not.toBeNull();
		if (result.radixGrayLight && result.radixGrayDark) {
			expect(result.radixGrayLight.light[0]).not.toBe(result.radixGrayDark.dark[0]);
		}
	});

	test("CSS :root has both light and dark surface vars for activeSurface", () => {
		const css = generateCss(config);
		const rootBlock = css.split(":root {")[1].split("}")[0];
		expect(rootBlock).toContain("--color-slate-light-1:");
		expect(rootBlock).toContain("--color-slate-dark-1:");
	});

	test("CSS :root also has darkActiveSurface vars when different", () => {
		const css = generateCss(config);
		const rootBlock = css.split(":root {")[1].split("}")[0];
		// sand is darkActiveSurface, so its light/dark vars should also be in :root
		expect(rootBlock).toContain("--color-sand-light-1:");
		expect(rootBlock).toContain("--color-sand-dark-1:");
	});

	test("CSS .dark semantic refs use darkActiveSurface dark vars", () => {
		const css = generateCss(config);
		const darkBlock = css.split(".dark {")[1].split("}")[0];
		expect(darkBlock).toContain("var(--color-sand-dark-");
	});

	test("falls back to activeSurface when darkActiveSurface omitted", () => {
		const fallbackConfig: BrandConfig = {
			...config,
			mapping: { primaryBrand: "blue", activeSurface: "slate" },
		};
		const result = generateDesignSystem(fallbackConfig);
		const surfDark1 = result.tokens.find(
			(t) => t.category === "aliases" && t.figmaName === "surface/dark/1",
		);
		expect(surfDark1?.originalValue).toBe("{primitives.color.slate.dark.1}");
	});
});
