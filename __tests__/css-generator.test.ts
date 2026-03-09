import { describe, expect, test } from "vitest";
import {
	inferPrefix,
	isResponsiveMode,
	modeToMediaQuery,
	modeToSelector,
	normalizeName,
	TAILWIND_TEXT_MAP,
	TYPESCALE_BREAKPOINTS,
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

	test("returns 'color' for motion/easing paths (not duration)", () => {
		expect(inferPrefix("motion/ease", "FLOAT")).toBe("color");
		expect(inferPrefix("motion/easing/linear", "FLOAT")).toBe("color");
	});

	test("returns 'size' for font typescale size paths", () => {
		expect(inferPrefix("font/typescale/body/size/md", "FLOAT")).toBe("size");
	});

	test("returns 'color' for font typescale line-height paths (default)", () => {
		expect(inferPrefix("font/typescale/body/line-height/md", "FLOAT")).toBe(
			"color",
		);
	});

	test("returns 'rounded' for rounded paths", () => {
		expect(inferPrefix("rounded/lg", "FLOAT")).toBe("rounded");
	});

	test("defaults to 'color' for unrecognized paths (matching generate-tokens.js)", () => {
		expect(inferPrefix("custom-value", "FLOAT")).toBe("color");
		expect(inferPrefix("opacity/50", "FLOAT")).toBe("color");
		expect(inferPrefix("font-family", "STRING")).toBe("color");
		expect(inferPrefix("shadow/lg", "FLOAT")).toBe("color");
		expect(inferPrefix("breakpoints/sm", "FLOAT")).toBe("color");
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

	test("strips shadcn/ prefix for semantics collection", () => {
		expect(toVarName("shadcn/background", "COLOR", "semantics")).toBe(
			"--background",
		);
		expect(toVarName("shadcn/foreground", "COLOR", "semantics")).toBe(
			"--foreground",
		);
		expect(toVarName("shadcn/card-foreground", "COLOR", "semantics")).toBe(
			"--card-foreground",
		);
	});

	test("semantics non-shadcn vars have no prefix", () => {
		expect(toVarName("theme/theme", "STRING", "semantics")).toBe(
			"--theme-theme",
		);
		expect(toVarName("util/overlay-transparent", "COLOR", "semantics")).toBe(
			"--util-overlay-transparent",
		);
	});

	test("motion/duration keeps full path with --duration- prefix", () => {
		expect(toVarName("motion/duration/250", "FLOAT")).toBe(
			"--duration-motion-duration-250",
		);
	});

	test("motion/easing gets --color- prefix (not duration)", () => {
		expect(toVarName("motion/easing/linear", "FLOAT")).toBe(
			"--color-motion-easing-linear",
		);
	});

	test("zlayer paths produce --z-layer-* naming", () => {
		expect(toVarName("zlayer/default", "FLOAT")).toBe("--z-layer-default");
		expect(toVarName("zlayer/modal", "FLOAT")).toBe("--z-layer-modal");
	});

	test("font typescale size paths get --size- prefix", () => {
		expect(toVarName("font/typescale/body/size/md", "FLOAT")).toBe(
			"--size-font-typescale-body-size-md",
		);
	});

	test("font typescale line-height paths get --color- prefix", () => {
		expect(toVarName("font/typescale/body/line-height/md", "FLOAT")).toBe(
			"--color-font-typescale-body-line-height-md",
		);
	});

	test("font paths get --color- prefix by default", () => {
		expect(toVarName("font/family/sans", "STRING")).toBe(
			"--color-font-family-sans",
		);
	});

	test("uses --color- prefix for unrecognized FLOAT paths", () => {
		expect(toVarName("container/3xs", "FLOAT")).toBe("--color-container-3xs");
		expect(toVarName("breakpoints/sm", "FLOAT")).toBe("--color-breakpoints-sm");
		expect(toVarName("screen/iphone-16-pro", "FLOAT")).toBe(
			"--color-screen-iphone-16-pro",
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

	test("strips shadcn prefix", () => {
		expect(normalizeName("shadcn/muted-foreground")).toBe("muted-foreground");
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
	test("maps standard Tailwind text utilities", () => {
		const map = new Map(TAILWIND_TEXT_MAP);
		expect(map.get("text-xs")).toBe("caption-1");
		expect(map.get("text-sm")).toBe("callout");
		expect(map.get("text-base")).toBe("body");
		expect(map.get("text-lg")).toBe("headline");
	});

	test("covers text-xs through text-9xl", () => {
		const names = TAILWIND_TEXT_MAP.map(([tw]) => tw);
		expect(names).toContain("text-xs");
		expect(names).toContain("text-9xl");
		expect(names.length).toBe(13);
	});

	test("all mappings reference valid typescale names", () => {
		const validScales = new Set([
			"caption-1",
			"caption-2",
			"footnote",
			"subhead",
			"callout",
			"body",
			"headline",
			"title-3",
			"title-2",
			"title-1",
			"large-title",
		]);
		for (const [, scale] of TAILWIND_TEXT_MAP) {
			expect(
				validScales.has(scale),
				`"${scale}" is not a valid typescale name`,
			).toBe(true);
		}
	});
});
