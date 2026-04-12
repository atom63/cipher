import { describe, expect, test } from "vitest";
import {
	detectFontCategory,
	generateBaseTypographyStyles,
	inferTailwindFontKey,
	isFontFamilyVariable,
	isResponsiveMode,
	modeToMediaQuery,
	modeToSelector,
	normalizeName,
	TAILWIND_THEME_PREFIXES,
	TYPESCALE_BREAKPOINTS,
	TYPESCALE_ORDER,
	toFontStack,
	toVarName,
} from "../src/handlers/css-generator";

// =========================================================================
// toVarName — simple slash-to-dash conversion for CSS custom properties
// =========================================================================

describe("toVarName", () => {
	test("converts slash-separated names to dashes", () => {
		expect(toVarName("color/brand/primary/500", "COLOR")).toBe("--color-brand-primary-500");
		expect(toVarName("color/zinc/50", "COLOR")).toBe("--color-zinc-50");
	});

	test("lowercases the output", () => {
		expect(toVarName("Color/Primary", "COLOR")).toBe("--color-primary");
	});

	test("handles spacing, size, and other simple paths", () => {
		expect(toVarName("spacing/4", "FLOAT")).toBe("--spacing-4");
		expect(toVarName("size/0", "FLOAT")).toBe("--size-0");
		expect(toVarName("container/3xs", "FLOAT")).toBe("--container-3xs");
	});

	test("handles restructured paths that produce correct CSS", () => {
		expect(toVarName("z-layer/base", "FLOAT")).toBe("--z-layer-base");
		expect(toVarName("z-layer/modal", "FLOAT")).toBe("--z-layer-modal");
		expect(toVarName("duration/250", "FLOAT")).toBe("--duration-250");
		expect(toVarName("ease/linear", "FLOAT")).toBe("--ease-linear");
		expect(toVarName("breakpoint/sm", "FLOAT")).toBe("--breakpoint-sm");
	});

	test("semantics paths work the same (no special casing needed)", () => {
		expect(toVarName("background", "COLOR", "semantics")).toBe("--background");
		expect(toVarName("foreground", "COLOR", "semantics")).toBe("--foreground");
		expect(toVarName("card-foreground", "COLOR", "semantics")).toBe("--card-foreground");
	});

	test("font and screen paths preserve hyphens within segments", () => {
		expect(toVarName("font/family/sans", "STRING")).toBe("--font-family-sans");
		expect(toVarName("screen/iphone-16-pro", "FLOAT")).toBe("--screen-iphone-16-pro");
	});

	test("handles font typescale paths", () => {
		expect(toVarName("font/typescale/body/size/md", "FLOAT")).toBe("--font-typescale-body-size-md");
		expect(toVarName("font/typescale/body/line-height/md", "FLOAT")).toBe("--font-typescale-body-line-height-md");
	});

	test("handles shadow and blur paths", () => {
		expect(toVarName("shadow/md", "STRING")).toBe("--shadow-md");
		expect(toVarName("shadow/2xs", "STRING")).toBe("--shadow-2xs");
		expect(toVarName("shadow/0", "STRING")).toBe("--shadow-0"); // legacy numeric
		expect(toVarName("blur/xs", "FLOAT")).toBe("--blur-xs");
		expect(toVarName("rounded/lg", "FLOAT")).toBe("--rounded-lg");
	});
});

// =========================================================================
// normalizeName — name normalization for opacity matching
// =========================================================================

describe("normalizeName", () => {
	test("strips semantics prefix", () => {
		expect(normalizeName("semantics/muted-foreground")).toBe(
			"muted-foreground",
		);
	});

	test("strips aliases prefix", () => {
		expect(normalizeName("aliases/surface/1")).toBe("surface/1");
	});

	test("strips primitives prefix", () => {
		expect(normalizeName("primitives/gray/5")).toBe("gray/5");
	});

	test("handles names without collection prefix", () => {
		expect(normalizeName("muted-foreground")).toBe("muted-foreground");
	});

	test("removes /status/ segment from middle of path", () => {
		expect(normalizeName("foo/status/error")).toBe("foo/error");
	});

	test("lowercases output", () => {
		expect(normalizeName("Semantics/Primary")).toBe("primary");
	});
});

// =========================================================================
// modeToSelector — Figma mode name to CSS selector
// =========================================================================

describe("modeToSelector", () => {
	test("returns .dark for dark mode", () => {
		expect(modeToSelector("dark")).toBe(".dark");
		expect(modeToSelector("Dark")).toBe(".dark");
	});

	test("returns :root for light mode", () => {
		expect(modeToSelector("light")).toBe(":root");
		expect(modeToSelector("Light")).toBe(":root");
	});

	test("returns @media for responsive modes", () => {
		expect(modeToSelector("mobile")).toBe("@media (min-width: 640px)");
		expect(modeToSelector("tablet")).toBe("@media (min-width: 768px)");
		expect(modeToSelector("desktop")).toBe("@media (min-width: 1024px)");
	});

	test("returns data-mode attribute for unknown modes", () => {
		expect(modeToSelector("compact")).toBe('[data-mode="compact"]');
		expect(modeToSelector("tablet (sm)")).toBe('[data-mode="tablet (sm)"]');
	});
});

// =========================================================================
// isResponsiveMode / modeToMediaQuery
// =========================================================================

describe("isResponsiveMode", () => {
	test("recognizes responsive mode names", () => {
		expect(isResponsiveMode("mobile")).toBe(true);
		expect(isResponsiveMode("tablet")).toBe(true);
		expect(isResponsiveMode("desktop")).toBe(true);
		expect(isResponsiveMode("sm")).toBe(true);
		expect(isResponsiveMode("md")).toBe(true);
		expect(isResponsiveMode("lg")).toBe(true);
		expect(isResponsiveMode("xl")).toBe(true);
	});

	test("is case insensitive", () => {
		expect(isResponsiveMode("Mobile")).toBe(true);
		expect(isResponsiveMode("DESKTOP")).toBe(true);
	});

	test("rejects non-responsive modes", () => {
		expect(isResponsiveMode("dark")).toBe(false);
		expect(isResponsiveMode("light")).toBe(false);
		expect(isResponsiveMode("compact")).toBe(false);
	});
});

describe("modeToMediaQuery", () => {
	test("returns correct breakpoints", () => {
		expect(modeToMediaQuery("mobile")).toBe("@media (min-width: 640px)");
		expect(modeToMediaQuery("tablet")).toBe("@media (min-width: 768px)");
		expect(modeToMediaQuery("desktop")).toBe("@media (min-width: 1024px)");
		expect(modeToMediaQuery("xl")).toBe("@media (min-width: 1280px)");
	});

	test("returns null for non-responsive modes", () => {
		expect(modeToMediaQuery("dark")).toBeNull();
		expect(modeToMediaQuery("compact")).toBeNull();
	});
});

// =========================================================================
// Constants — TYPESCALE_BREAKPOINTS and TYPESCALE_ORDER
// =========================================================================

describe("TYPESCALE_BREAKPOINTS", () => {
	test("has 5 breakpoints (xs, sm, md, lg, xl)", () => {
		expect(TYPESCALE_BREAKPOINTS).toHaveLength(5);
		expect(TYPESCALE_BREAKPOINTS.map((b) => b.name)).toEqual([
			"xs",
			"sm",
			"md",
			"lg",
			"xl",
		]);
	});

	test("xs has no minWidth (mobile-first base)", () => {
		expect(TYPESCALE_BREAKPOINTS[0].minWidth).toBeNull();
	});

	test("sm through xl have ascending rem breakpoints", () => {
		const withWidths = TYPESCALE_BREAKPOINTS.filter((b) => b.minWidth);
		expect(withWidths).toHaveLength(4);

		const rems = withWidths.map((b) => Number.parseFloat(b.minWidth ?? "0"));
		for (let i = 1; i < rems.length; i++) {
			expect(rems[i]).toBeGreaterThan(rems[i - 1]);
		}
	});

	test("lg and xl reuse desktop (md) mode", () => {
		const lg = TYPESCALE_BREAKPOINTS.find((b) => b.name === "lg");
		const xl = TYPESCALE_BREAKPOINTS.find((b) => b.name === "xl");
		const md = TYPESCALE_BREAKPOINTS.find((b) => b.name === "md");
		expect(lg).toBeDefined();
		expect(xl).toBeDefined();
		expect(md).toBeDefined();
		expect(lg?.mode).toBe(md?.mode);
		expect(xl?.mode).toBe(md?.mode);
	});
});

describe("TYPESCALE_ORDER", () => {
	test("covers xs through 9xl in ascending order", () => {
		expect(TYPESCALE_ORDER).toEqual([
			"xs", "sm", "base", "lg", "xl",
			"2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
		]);
	});

	test("has 13 entries matching Tailwind text-* utilities", () => {
		expect(TYPESCALE_ORDER).toHaveLength(13);
	});
});

// =========================================================================
// TAILWIND_THEME_PREFIXES — Tailwind v4 theme namespaces
// =========================================================================

describe("TAILWIND_THEME_PREFIXES", () => {
	test("includes Tailwind v4 theme namespaces that need registration", () => {
		expect(TAILWIND_THEME_PREFIXES).toContain("--color-");
		expect(TAILWIND_THEME_PREFIXES).toContain("--shadow-");
		expect(TAILWIND_THEME_PREFIXES).toContain("--blur-");
		expect(TAILWIND_THEME_PREFIXES).toContain("--breakpoint-");
		expect(TAILWIND_THEME_PREFIXES).toContain("--ease-");
		expect(TAILWIND_THEME_PREFIXES).toContain("--duration-");
	});

	test("does not include namespaces with Tailwind built-in defaults", () => {
		// These have built-in Tailwind defaults — re-registering causes overrides
		expect(TAILWIND_THEME_PREFIXES).not.toContain("--spacing-");
		expect(TAILWIND_THEME_PREFIXES).not.toContain("--container-");
		expect(TAILWIND_THEME_PREFIXES).not.toContain("--rounded-");
		expect(TAILWIND_THEME_PREFIXES).not.toContain("--size-");
		expect(TAILWIND_THEME_PREFIXES).not.toContain("--font-weight-");
		expect(TAILWIND_THEME_PREFIXES).not.toContain("--z-");
		expect(TAILWIND_THEME_PREFIXES).not.toContain("--screen-");
	});
});

// =========================================================================
// inferTailwindFontKey — maps font variable paths to Tailwind utility names
// =========================================================================

describe("inferTailwindFontKey", () => {
	test("maps sans and primary to sans", () => {
		expect(inferTailwindFontKey("font/family/sans")).toBe("sans");
		expect(inferTailwindFontKey("font/family/primary")).toBe("sans");
	});

	test("maps serif and secondary to serif", () => {
		expect(inferTailwindFontKey("font/family/serif")).toBe("serif");
		expect(inferTailwindFontKey("font/family/secondary")).toBe("serif");
	});

	test("maps mono and tertiary to mono", () => {
		expect(inferTailwindFontKey("font/family/mono")).toBe("mono");
		expect(inferTailwindFontKey("font/family/tertiary")).toBe("mono");
	});

	test("returns null for unrecognized font paths", () => {
		expect(inferTailwindFontKey("font/family/custom")).toBeNull();
		expect(inferTailwindFontKey("font/weight/bold")).toBeNull();
	});
});

// =========================================================================
// isFontFamilyVariable — detects font family variables
// =========================================================================

describe("isFontFamilyVariable", () => {
	test("recognizes font/family/ paths", () => {
		expect(isFontFamilyVariable("font/family/sans")).toBe(true);
		expect(isFontFamilyVariable("font/family/primary")).toBe(true);
		expect(isFontFamilyVariable("font/family/mono")).toBe(true);
	});

	test("recognizes font-family/ paths", () => {
		expect(isFontFamilyVariable("font-family/heading")).toBe(true);
	});

	test("rejects non-font-family paths", () => {
		expect(isFontFamilyVariable("font/weight/400")).toBe(false);
		expect(isFontFamilyVariable("font/typescale/base/size/md")).toBe(false);
		expect(isFontFamilyVariable("color/brand/500")).toBe(false);
	});
});

// =========================================================================
// detectFontCategory — classifies font variables by category
// =========================================================================

describe("detectFontCategory", () => {
	test("detects sans from variable path", () => {
		expect(detectFontCategory("font/family/sans", "Inter")).toBe("sans");
		expect(detectFontCategory("font/family/primary", "Geist")).toBe("sans");
	});

	test("detects serif from variable path", () => {
		expect(detectFontCategory("font/family/serif", "Georgia")).toBe("serif");
		expect(detectFontCategory("font/family/secondary", "Merriweather")).toBe("serif");
	});

	test("detects mono from variable path", () => {
		expect(detectFontCategory("font/family/mono", "Fira Code")).toBe("mono");
		expect(detectFontCategory("font/family/tertiary", "JetBrains Mono")).toBe("mono");
	});

	test("falls back to font name pattern matching", () => {
		expect(detectFontCategory("font/family/custom", "Fira Code")).toBe("mono");
		expect(detectFontCategory("font/family/custom", "Source Code Pro")).toBe("mono");
		expect(detectFontCategory("font/family/custom", "Playfair Display")).toBe("serif");
	});

	test("defaults to sans for unknown fonts", () => {
		expect(detectFontCategory("font/family/custom", "CustomFont")).toBe("sans");
	});
});

// =========================================================================
// toFontStack — enriches bare font names with CSS fallbacks
// =========================================================================

describe("toFontStack", () => {
	test("wraps sans font with system fallbacks", () => {
		const stack = toFontStack("Inter", "font/family/sans");
		expect(stack).toContain('"Inter"');
		expect(stack).toContain("system-ui");
		expect(stack).toContain("sans-serif");
	});

	test("wraps serif font with serif fallbacks", () => {
		const stack = toFontStack("Merriweather", "font/family/serif");
		expect(stack).toContain('"Merriweather"');
		expect(stack).toContain("Georgia");
		expect(stack).toContain("serif");
	});

	test("wraps mono font with monospace fallbacks", () => {
		const stack = toFontStack("Fira Code", "font/family/mono");
		expect(stack).toContain('"Fira Code"');
		expect(stack).toContain("monospace");
		expect(stack).toContain("Consolas");
	});

	test("quotes font name even without spaces", () => {
		const stack = toFontStack("Inter", "font/family/primary");
		expect(stack.startsWith('"Inter"')).toBe(true);
	});

	test("defaults to sans fallbacks for unknown font", () => {
		const stack = toFontStack("CustomFont", "font/family/custom");
		expect(stack).toContain('"CustomFont"');
		expect(stack).toContain("sans-serif");
	});
});

// =========================================================================
// generateBaseTypographyStyles — @layer base element mappings
// =========================================================================

describe("generateBaseTypographyStyles", () => {
	/** Helper: build a baseValues map from scale → px entries */
	function makeBaseValues(entries: Record<string, number>): Map<string, string> {
		const map = new Map<string, string>();
		for (const [scale, px] of Object.entries(entries)) {
			map.set(`--typography-${scale}-font-size`, `calc(${px}px * var(--typography-scale, 1))`);
			map.set(`--typography-${scale}-line-height`, `calc(${Math.round(px * 1.5)}px * var(--typography-scale, 1))`);
		}
		return map;
	}

	test("returns empty for fewer than 3 scales", () => {
		const values = makeBaseValues({ base: 16, lg: 18 });
		expect(generateBaseTypographyStyles(["base", "lg"], values)).toEqual([]);
	});

	test("generates @layer base with h1-h5, h6, p, small for t-shirt sizes", () => {
		const values = makeBaseValues({
			xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
			"2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48,
		});
		const scaleNames = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];
		const lines = generateBaseTypographyStyles(scaleNames, values);
		const output = lines.join("\n");

		// Should have @layer base wrapper
		expect(output).toContain("@layer base {");

		// h1 should use the largest scale (5xl)
		expect(output).toContain("h1 {");
		expect(output).toContain("var(--typography-5xl-font-size)");

		// h2 → 4xl
		expect(output).toContain("h2 {");
		expect(output).toContain("var(--typography-4xl-font-size)");

		// p and h6 should use "base" (named match)
		expect(output).toContain("p {");
		expect(output).toContain("h6 {");
		expect(output).toMatch(/h6\s*\{[^}]*var\(--typography-base-font-size\)/);
		expect(output).toMatch(/h6\s*\{[^}]*font-weight: 600/);
		expect(output).toMatch(/p\s*\{[^}]*var\(--typography-base-font-size\)/);

		// small should use the smallest scale (xs)
		expect(output).toContain("small {");
		expect(output).toContain("var(--typography-xs-font-size)");

		// Scale utility classes
		expect(output).toContain(".text-scale-sm { --typography-scale: 0.8; }");
		expect(output).toContain(".text-scale-normal { --typography-scale: 1; }");
		expect(output).toContain(".text-scale-lg { --typography-scale: 1.2; }");
		expect(output).toContain(".text-scale-xl { --typography-scale: 1.4; }");
	});

	test("maps Apple HIG names correctly by size order", () => {
		const values = makeBaseValues({
			"caption-2": 11,
			"caption-1": 12,
			callout: 14,
			body: 16,
			headline: 18,
			"title-3": 20,
			"title-2": 24,
			"title-1": 28,
			"large-title": 34,
		});
		const scaleNames = [
			"caption-2", "caption-1", "callout", "body", "headline",
			"title-3", "title-2", "title-1", "large-title",
		];
		const lines = generateBaseTypographyStyles(scaleNames, values);
		const output = lines.join("\n");

		// h1 → large-title (largest)
		expect(output).toMatch(/h1\s*\{[^}]*var\(--typography-large-title-font-size\)/);

		// p → body (named match)
		expect(output).toMatch(/p\s*\{[^}]*var\(--typography-body-font-size\)/);

		// h6 → body with font-weight: 600
		expect(output).toMatch(/h6\s*\{[^}]*var\(--typography-body-font-size\)/);

		// small → caption-2 (smallest)
		expect(output).toMatch(/small\s*\{[^}]*var\(--typography-caption-2-font-size\)/);

		// blockquote → callout (named match)
		expect(output).toMatch(/blockquote\s*\{[^}]*var\(--typography-callout-font-size\)/);
	});

	test("handles exactly 3 scales gracefully", () => {
		const values = makeBaseValues({ sm: 14, base: 16, lg: 20 });
		const scaleNames = ["sm", "base", "lg"];
		const lines = generateBaseTypographyStyles(scaleNames, values);
		const output = lines.join("\n");

		// Only 1 heading scale above base
		expect(output).toContain("h1 {");
		expect(output).toContain("var(--typography-lg-font-size)");

		// p uses base
		expect(output).toContain("p {");
		expect(output).toMatch(/p\s*\{[^}]*var\(--typography-base-font-size\)/);

		// small uses sm
		expect(output).toContain("small {");
		expect(output).toContain("var(--typography-sm-font-size)");
	});

	test("skips scales without resolved font-size values", () => {
		const values = new Map<string, string>();
		values.set("--typography-base-font-size", "calc(16px * var(--typography-scale, 1))");
		values.set("--typography-base-line-height", "calc(24px * var(--typography-scale, 1))");
		values.set("--typography-lg-font-size", "calc(20px * var(--typography-scale, 1))");
		values.set("--typography-lg-line-height", "calc(30px * var(--typography-scale, 1))");
		// "sm" has no font-size entry
		values.set("--typography-sm-line-height", "calc(21px * var(--typography-scale, 1))");

		// Only 2 resolvable scales → too few
		const lines = generateBaseTypographyStyles(["sm", "base", "lg"], values);
		expect(lines).toEqual([]);
	});
});
