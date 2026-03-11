import { describe, expect, test } from "vitest";
import {
	detectFontCategory,
	inferPrefix,
	isFontFamilyVariable,
	isResponsiveMode,
	modeToMediaQuery,
	modeToSelector,
	normalizeName,
	TAILWIND_TEXT_MAP,
	TYPESCALE_BREAKPOINTS,
	toFontStack,
	toVarName,
} from "../handlers/css-generator";

// =========================================================================
// inferPrefix — maps variable name + type to CSS prefix
// =========================================================================

describe("inferPrefix", () => {
	test("returns 'color' for COLOR type", () => {
		expect(inferPrefix("anything/here", "COLOR")).toBe("color");
		expect(inferPrefix("primary", "COLOR")).toBe("color");
	});

	test("returns 'spacing' for spacing paths", () => {
		expect(inferPrefix("spacing/md", "FLOAT")).toBe("spacing");
		expect(inferPrefix("layout/spacing/4", "FLOAT")).toBe("spacing");
	});

	test("returns 'radius' for radius paths", () => {
		expect(inferPrefix("radius/lg", "FLOAT")).toBe("radius");
		expect(inferPrefix("component/radius/sm", "FLOAT")).toBe("radius");
	});

	test("returns 'size' for size/sizes paths", () => {
		expect(inferPrefix("size/button", "FLOAT")).toBe("size");
		expect(inferPrefix("sizes/icon", "FLOAT")).toBe("size");
	});

	test("returns 'z' for z-index/zlayer paths", () => {
		expect(inferPrefix("z-index/modal", "FLOAT")).toBe("z");
		expect(inferPrefix("zindex/popover", "FLOAT")).toBe("z");
		expect(inferPrefix("zlayer/default", "FLOAT")).toBe("z");
	});

	test("returns 'duration' for paths containing 'duration'", () => {
		expect(inferPrefix("duration/fast", "FLOAT")).toBe("duration");
		expect(inferPrefix("motion/duration/250", "FLOAT")).toBe("duration");
	});

	test("returns 'ease' for motion/easing paths", () => {
		expect(inferPrefix("motion/easing/linear", "FLOAT")).toBe("ease");
	});

	test("returns 'font' for font typescale size paths", () => {
		expect(inferPrefix("font/typescale/body/size/md", "FLOAT")).toBe("font");
	});

	test("returns 'font' for font typescale line-height paths", () => {
		expect(inferPrefix("font/typescale/body/line-height/md", "FLOAT")).toBe(
			"font",
		);
	});

	test("returns 'rounded' for rounded paths", () => {
		expect(inferPrefix("rounded/lg", "FLOAT")).toBe("rounded");
	});

	test("returns correct prefix for known paths", () => {
		expect(inferPrefix("shadow/lg", "FLOAT")).toBe("shadow");
		expect(inferPrefix("breakpoints/sm", "FLOAT")).toBe("breakpoint");
		expect(inferPrefix("container/3xs", "FLOAT")).toBe("container");
		expect(inferPrefix("screen/iphone-16-pro", "FLOAT")).toBe("screen");
		expect(inferPrefix("blur/md", "FLOAT")).toBe("blur");
		expect(inferPrefix("font/family/sans", "STRING")).toBe("font");
	});

	test("defaults to 'color' for unrecognized paths", () => {
		expect(inferPrefix("custom-value", "FLOAT")).toBe("color");
		expect(inferPrefix("opacity/50", "FLOAT")).toBe("color");
		expect(inferPrefix("icon/lg", "FLOAT")).toBe("color");
	});
});

// =========================================================================
// toVarName — variable name to CSS custom property
// =========================================================================

describe("toVarName", () => {
	test("converts slash-separated names to dashes with color prefix", () => {
		expect(toVarName("zinc/50", "COLOR")).toBe("--color-zinc-50");
	});

	test("strips redundant 'color/' from color paths", () => {
		expect(toVarName("color/zinc/50", "COLOR")).toBe("--color-zinc-50");
	});

	test("doesn't double prefix when name starts with prefix", () => {
		expect(toVarName("spacing/md", "FLOAT")).toBe("--spacing-md");
	});

	test("lowercases the output", () => {
		expect(toVarName("Color/Primary", "COLOR")).toBe("--color-primary");
	});

	test("strips sizes/ to produce --size-*", () => {
		expect(toVarName("sizes/0", "FLOAT")).toBe("--size-0");
		expect(toVarName("sizes/icon", "FLOAT")).toBe("--size-icon");
	});

	test("semantics vars have no prefix", () => {
		expect(toVarName("background", "COLOR", "semantics")).toBe(
			"--background",
		);
		expect(toVarName("foreground", "COLOR", "semantics")).toBe(
			"--foreground",
		);
		expect(toVarName("card-foreground", "COLOR", "semantics")).toBe(
			"--card-foreground",
		);
		expect(toVarName("theme/theme", "STRING", "semantics")).toBe(
			"--theme-theme",
		);
		expect(toVarName("util/overlay-transparent", "COLOR", "semantics")).toBe(
			"--util-overlay-transparent",
		);
	});

	test("motion/duration keeps duration path with --duration- prefix", () => {
		expect(toVarName("motion/duration/250", "FLOAT")).toBe("--duration-250");
	});

	test("motion/easing gets --ease- prefix", () => {
		expect(toVarName("motion/easing/linear", "FLOAT")).toBe(
			"--ease-linear",
		);
	});

	test("zlayer paths produce --z-layer-* naming", () => {
		expect(toVarName("zlayer/default", "FLOAT")).toBe("--z-layer-default");
		expect(toVarName("zlayer/modal", "FLOAT")).toBe("--z-layer-modal");
	});

	test("font typescale size paths get --font- prefix", () => {
		expect(toVarName("font/typescale/body/size/md", "FLOAT")).toBe(
			"--font-typescale-body-size-md",
		);
	});

	test("font typescale line-height paths get --font- prefix", () => {
		expect(toVarName("font/typescale/body/line-height/md", "FLOAT")).toBe(
			"--font-typescale-body-line-height-md",
		);
	});

	test("font paths get --font- prefix", () => {
		expect(toVarName("font/family/sans", "STRING")).toBe(
			"--font-family-sans",
		);
	});

	test("uses correct prefix for container, breakpoint, screen paths", () => {
		expect(toVarName("container/3xs", "FLOAT")).toBe("--container-3xs");
		expect(toVarName("breakpoints/sm", "FLOAT")).toBe("--breakpoint-sm");
		expect(toVarName("screen/iphone-16-pro", "FLOAT")).toBe(
			"--screen-iphone-16-pro",
		);
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

	test("strips abstractions prefix", () => {
		expect(normalizeName("abstractions/surface/1")).toBe("surface/1");
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
// Constants — TYPESCALE_BREAKPOINTS and TAILWIND_TEXT_MAP
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

describe("TAILWIND_TEXT_MAP", () => {
	test("maps standard Tailwind text utilities to typescale steps", () => {
		const map = new Map(TAILWIND_TEXT_MAP);
		expect(map.get("text-xs")).toBe("xs");
		expect(map.get("text-sm")).toBe("sm");
		expect(map.get("text-base")).toBe("base");
		expect(map.get("text-lg")).toBe("lg");
		expect(map.get("text-xl")).toBe("xl");
	});

	test("covers text-xs through text-5xl", () => {
		const names = TAILWIND_TEXT_MAP.map(([tw]) => tw);
		expect(names).toContain("text-xs");
		expect(names).toContain("text-5xl");
		expect(names.length).toBe(9);
	});

	test("all mappings reference valid typescale names", () => {
		const validScales = new Set([
			"xs", "sm", "base", "lg", "xl",
			"2xl", "3xl", "4xl", "5xl",
		]);
		for (const [, scale] of TAILWIND_TEXT_MAP) {
			expect(
				validScales.has(scale),
				`"${scale}" is not a valid typescale name`,
			).toBe(true);
		}
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
