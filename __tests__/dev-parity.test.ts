/**
 * Dev Parity Tests — Integration
 *
 * Reads the actual dev CSS files from exports/styles/tokens/ and compares
 * against generator output. No hardcoded values — if the dev CSS changes,
 * these tests automatically reflect the new expectations.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { RADIX_GRAYS } from "../generators/radix-grays";
import { generateDesignSystem } from "../generators/three-tier";
import {
	computeRadiusScale,
	computeTypescale,
	DEFAULT_TYPESCALE,
	DURATION_RAW,
	DURATION_SEMANTIC,
	FONT_WEIGHTS,
	SHADOW_SCALE,
	SPACING_SCALE,
} from "../generators/token-presets";

// =========================================================================
// CSS parsing helpers — extract vars and values from dev CSS files
// =========================================================================

const TOKENS_DIR = resolve(import.meta.dirname, "../exports/styles/tokens");

function readDevCss(filename: string): string {
	return readFileSync(resolve(TOKENS_DIR, filename), "utf-8");
}

/** Extract all CSS custom property declarations from a CSS string.
 *  Returns Map<varName, rawValue> e.g. "--spacing-4" → "16px"
 *  Handles multi-line values by joining until the next semicolon.
 */
function parseCssVars(css: string): Map<string, string> {
	const vars = new Map<string, string>();
	// Match --prop: value; across potential multi-line values
	const regex = /(--[\w-]+)\s*:\s*([^;]+);/g;
	for (const match of css.matchAll(regex)) {
		const name = match[1].trim();
		const value = match[2].trim().replace(/\s+/g, " ");
		vars.set(name, value);
	}
	return vars;
}

/** Extract var names from a specific CSS block (e.g. :root { ... } or .dark { ... }) */
function parseCssBlock(css: string, selector: string): Map<string, string> {
	// Find the block for this selector
	// Handle both `:root {` and `.dark {`
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const blockRegex = new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, "g");

	const vars = new Map<string, string>();
	for (const blockMatch of css.matchAll(blockRegex)) {
		const blockContent = blockMatch[1];
		const innerVars = parseCssVars(`${blockContent};`); // ensure trailing ;
		for (const [k, v] of innerVars) {
			vars.set(k, v);
		}
	}
	return vars;
}

/** Extract px value from CSS value strings like "16px", "calc(16px * ...)", etc. */
function extractPxValue(cssValue: string): number | null {
	// Direct "16px"
	const directMatch = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
	if (directMatch) return Number(directMatch[1]);

	// calc(16px * var(...))
	const calcMatch = cssValue.match(/calc\((\d+(?:\.\d+)?)px/);
	if (calcMatch) return Number(calcMatch[1]);

	return null;
}

/** Extract rgba values → hex for comparison */
function rgbaToHex(rgbaStr: string): string | null {
	const match = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
	if (!match) return null;
	const r = Number(match[1]);
	const g = Number(match[2]);
	const b = Number(match[3]);
	return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// =========================================================================
// Load dev CSS files
// =========================================================================

const devPrimitivesCss = readDevCss("primitives.css");
const devAbstractionsCss = readDevCss("abstractions.css");
const devSemanticsCss = readDevCss("semantics.css");
const devShadowCss = readDevCss("shadow-tokens.css");
const devTypescalesCss = readDevCss("typescales.css");
const devRadiusCss = readDevCss("radius.css");

// =========================================================================
// Spacing — generator matches dev primitives.css
// =========================================================================

describe("spacing parity with dev primitives.css", () => {
	const devVars = parseCssVars(devPrimitivesCss);

	test("every dev spacing token value matches generator SPACING_SCALE", () => {
		const devSpacing = new Map<string, number>();
		for (const [name, value] of devVars) {
			if (name.startsWith("--spacing-")) {
				const key = name.replace("--spacing-", "").replace("_", ".");
				const px = extractPxValue(value);
				if (px !== null) devSpacing.set(key, px);
			}
		}

		expect(devSpacing.size).toBeGreaterThan(0);

		for (const [key, devPx] of devSpacing) {
			expect(
				SPACING_SCALE[key],
				`Dev spacing "${key}" (${devPx}px) missing from generator SPACING_SCALE`,
			).toBeDefined();
			expect(
				SPACING_SCALE[key],
				`Spacing "${key}": dev=${devPx}px, generator=${SPACING_SCALE[key]}px`,
			).toBe(devPx);
		}
	});

	test("generator SPACING_SCALE covers all dev spacing keys", () => {
		const devKeys = new Set<string>();
		for (const [name] of devVars) {
			if (name.startsWith("--spacing-")) {
				devKeys.add(name.replace("--spacing-", "").replace("_", "."));
			}
		}

		for (const devKey of devKeys) {
			expect(
				SPACING_SCALE[devKey],
				`Dev spacing key "${devKey}" not in generator`,
			).toBeDefined();
		}
	});
});

// =========================================================================
// Gray palette — Radix grays match dev primitives.css
// =========================================================================

describe("gray palette parity with dev primitives.css", () => {
	const devVars = parseCssVars(devPrimitivesCss);

	test("Radix gray light values match dev --color-gray-light-* hex values", () => {
		const radixGray = RADIX_GRAYS.find((g) => g.name === "gray");
		expect(radixGray).toBeDefined();

		for (let i = 1; i <= 12; i++) {
			const devVar = devVars.get(`--color-gray-light-${i}`);
			expect(devVar, `Dev --color-gray-light-${i} not found`).toBeDefined();

			const devHex = rgbaToHex(devVar ?? "");
			expect(devHex, `Could not parse hex from "${devVar}"`).not.toBeNull();

			expect(
				radixGray?.light[i - 1].toLowerCase(),
				`Gray light step ${i}: dev=${devHex}, radix=${radixGray?.light[i - 1]}`,
			).toBe(devHex?.toLowerCase());
		}
	});

	test("Radix gray dark values match dev --color-gray-dark-* hex values", () => {
		const radixGray = RADIX_GRAYS.find((g) => g.name === "gray");
		expect(radixGray).toBeDefined();

		for (let i = 1; i <= 12; i++) {
			const devVar = devVars.get(`--color-gray-dark-${i}`);
			expect(devVar, `Dev --color-gray-dark-${i} not found`).toBeDefined();

			const devHex = rgbaToHex(devVar ?? "");
			expect(devHex, `Could not parse hex from "${devVar}"`).not.toBeNull();

			expect(
				radixGray?.dark[i - 1].toLowerCase(),
				`Gray dark step ${i}: dev=${devHex}, radix=${radixGray?.dark[i - 1]}`,
			).toBe(devHex?.toLowerCase());
		}
	});
});

// =========================================================================
// Duration — generator aliases match dev abstractions.css
// =========================================================================

describe("duration parity with dev abstractions.css", () => {
	const devVars = parseCssBlock(devAbstractionsCss, ":root");

	test("every dev duration alias exists in generator DURATION_SEMANTIC", () => {
		const devDurations = new Map<string, string>();
		for (const [name, value] of devVars) {
			if (name.startsWith("--duration-")) {
				devDurations.set(name.replace("--duration-", ""), value);
			}
		}

		expect(devDurations.size).toBeGreaterThan(0);

		for (const [name] of devDurations) {
			expect(
				DURATION_SEMANTIC[name],
				`Dev duration alias "${name}" missing from generator`,
			).toBeDefined();
		}
	});

	test("duration raw values match dev primitives.css", () => {
		const devPrimVars = parseCssVars(devPrimitivesCss);

		for (const [name, value] of devPrimVars) {
			const match = name.match(/^--duration-(\w+)$/);
			if (!match) continue;

			const key = match[1];
			const devMs = extractPxValue(value.replace("ms", "px")); // trick: reuse px parser
			if (devMs === null) continue;

			expect(
				DURATION_RAW[key],
				`Dev duration raw "${key}" (${devMs}ms): dev value doesn't match generator`,
			).toBe(devMs);
		}
	});
});

// =========================================================================
// Radius — generator values match dev radius.css
// =========================================================================

describe("radius parity with dev radius.css", () => {
	test("default radius scale matches dev radius.css comment values", () => {
		const radiusScale = computeRadiusScale({ anchor: 10, multiplier: 1 });

		// Parse the dev radius.css for expected computed values from comments
		// e.g. `--radius-lg: calc(var(--corner-radius) * var(--radius-multiplier)); /* 10px */`
		const commentValues = new Map<string, number>();
		const commentRegex = /--radius-([\w-]+):.*?\/\*\s*(\d+)px\s*\*\//g;
		for (const match of devRadiusCss.matchAll(commentRegex)) {
			commentValues.set(match[1], Number(match[2]));
		}

		// Also check the rounded-* vars from abstractions which have direct values
		const devAbsVars = parseCssBlock(devAbstractionsCss, ":root");
		for (const [name, value] of devAbsVars) {
			const roundedMatch = name.match(/^--rounded-([\w-]+)$/);
			if (!roundedMatch) continue;
			const px = extractPxValue(value);
			if (px !== null) {
				commentValues.set(roundedMatch[1], px);
			}
		}

		expect(commentValues.size).toBeGreaterThan(0);

		for (const [size, devPx] of commentValues) {
			if (radiusScale[size] !== undefined) {
				expect(
					radiusScale[size],
					`Radius "${size}": dev=${devPx}px, generator=${radiusScale[size]}px`,
				).toBe(devPx);
			}
		}
	});
});

// =========================================================================
// Shadows — generator levels match dev shadow-tokens.css
// =========================================================================

describe("shadow parity with dev shadow-tokens.css", () => {
	const devVars = parseCssVars(devShadowCss);

	test("every dev shadow level exists in generator SHADOW_SCALE", () => {
		const devShadowLevels: string[] = [];
		for (const [name] of devVars) {
			const match = name.match(/^--shadow-(\d+)$/);
			if (match) devShadowLevels.push(match[1]);
		}

		expect(devShadowLevels.length).toBeGreaterThan(0);

		for (const level of devShadowLevels) {
			expect(
				SHADOW_SCALE[level],
				`Dev shadow level ${level} missing from generator SHADOW_SCALE`,
			).toBeDefined();
		}
	});

	test("shadow 0 is no-shadow in both dev and generator", () => {
		const devShadow0 = devVars.get("--shadow-0");
		expect(devShadow0).toBeDefined();
		// Both should have 0 opacity / 0 blur
		expect(devShadow0).toContain("0, 0, 0, 0");

		const genShadow0 = SHADOW_SCALE["0"];
		expect(genShadow0[0].opacity).toBe(0);
		expect(genShadow0[0].blur).toBe(0);
	});

	test("shadow level count matches dev", () => {
		const devCount = [...devVars.keys()].filter((k) =>
			/^--shadow-\d+$/.test(k),
		).length;
		const genCount = Object.keys(SHADOW_SCALE).length;

		expect(genCount).toBe(devCount);
	});
});

// =========================================================================
// Typography — mathematical typescale generator
// =========================================================================

describe("mathematical typescale generation", () => {
	test("default config produces correct number of steps", () => {
		const steps = computeTypescale(DEFAULT_TYPESCALE);
		// 6 up + 1 base + 2 down = 9
		expect(steps.length).toBe(9);
	});

	test("base step matches configured base size", () => {
		const steps = computeTypescale({ ...DEFAULT_TYPESCALE, base: 18 });
		const base = steps.find((s: { name: string }) => s.name === "base");
		expect(base?.size).toBe(18);
	});

	test("steps are ordered largest to smallest", () => {
		const steps = computeTypescale(DEFAULT_TYPESCALE);
		for (let i = 1; i < steps.length; i++) {
			expect(steps[i].size).toBeLessThanOrEqual(steps[i - 1].size);
		}
	});

	test("line-height is proportional to font size", () => {
		const steps = computeTypescale({
			...DEFAULT_TYPESCALE,
			lineHeightBody: 150,
			lineHeightHeading: 125,
		});
		for (const step of steps) {
			// With rounding, line-height should be close to 1.5x size
			expect(step.lineHeight).toBeGreaterThanOrEqual(step.size);
			expect(step.lineHeight / step.size).toBeCloseTo(1.5, 0);
		}
	});

	test("values are always rounded to whole numbers", () => {
		const steps = computeTypescale(DEFAULT_TYPESCALE);
		for (const step of steps) {
			expect(step.size).toBe(Math.round(step.size));
			expect(step.lineHeight).toBe(Math.round(step.lineHeight));
		}
	});
});

// =========================================================================
// Semantics — generator covers all dev semantic token names
// =========================================================================

describe("semantic token coverage vs dev semantics.css", () => {
	test("generator produces tokens for every core dev semantic var", () => {
		// Parse dev :root block for semantic var names
		const rootVars = parseCssBlock(devSemanticsCss, ":root");

		// Core semantic names from dev (excluding utility/theme-specific ones)
		const coreDevNames: string[] = [];
		for (const [name] of rootVars) {
			// Skip utility/theme tokens, chart tokens, sidebar aliases, backplate
			if (
				name.startsWith("--util-") ||
				name.startsWith("--theme-") ||
				name.startsWith("--chart-") ||
				name.startsWith("--sidebar-") ||
				name.startsWith("--backplate-") ||
				name === "--light" ||
				name === "--dark"
			)
				continue;
			coreDevNames.push(name.replace(/^--/, ""));
		}

		expect(coreDevNames.length).toBeGreaterThan(0);

		// Map dev names to generator naming convention (shadcn/ prefix)
		const nameMapping: Record<string, string> = {
			background: "shadcn/background",
			foreground: "shadcn/foreground",
			card: "shadcn/card",
			"card-foreground": "shadcn/card-foreground",
			popover: "shadcn/popover",
			"popover-foreground": "shadcn/popover-foreground",
			primary: "shadcn/primary",
			"primary-foreground": "shadcn/primary-foreground",
			secondary: "shadcn/secondary",
			"secondary-foreground": "shadcn/secondary-foreground",
			muted: "shadcn/muted",
			"muted-foreground": "shadcn/muted-foreground",
			accent: "shadcn/accent",
			"accent-foreground": "shadcn/accent-foreground",
			destructive: "shadcn/destructive",
			border: "shadcn/border",
			input: "shadcn/input",
			ring: "shadcn/ring",
			success: "shadcn/success",
			warning: "shadcn/warning",
			info: "shadcn/info",
		};

		const result = generateDesignSystem({
			primary: "#0090FF",
			secondary: "#10B981",
			grayName: "gray",
			darkMode: true,
		});
		const genNames = new Set(
			result.tokens
				.filter((t) => t.category === "semantics")
				.map((t) => t.figmaName),
		);

		const missing: string[] = [];
		for (const devName of coreDevNames) {
			const genName = nameMapping[devName];
			if (genName === null) continue; // known gap (status colors)
			if (genName === undefined) continue; // unmapped
			if (!genNames.has(genName)) {
				missing.push(`${devName} → ${genName}`);
			}
		}

		expect(
			missing,
			`Missing semantic tokens:\n${missing.join("\n")}`,
		).toHaveLength(0);
	});

	test("dev semantic gray step references match generator", () => {
		const rootVars = parseCssBlock(devSemanticsCss, ":root");
		const darkVars = parseCssBlock(devSemanticsCss, ".dark");

		// Extract which gray step each dev semantic uses
		// e.g. "--card: var(--color-surface-light-1)" → step 1
		function extractGrayStep(value: string): number | null {
			const match = value.match(/surface-(?:light|dark)-(\d+)/);
			return match ? Number(match[1]) : null;
		}

		const result = generateDesignSystem({
			primary: "#0090FF",
			grayName: "gray",
			darkMode: true,
		});

		// Map of dev name → generator name → check gray step
		const checks: {
			devName: string;
			genName: string;
			mode: "light" | "dark";
		}[] = [
			{ devName: "--card", genName: "shadcn/card", mode: "light" },
			{ devName: "--card", genName: "shadcn/card", mode: "dark" },
			{ devName: "--popover", genName: "shadcn/popover", mode: "light" },
			{ devName: "--popover", genName: "shadcn/popover", mode: "dark" },
			{ devName: "--input", genName: "shadcn/input", mode: "light" },
			{ devName: "--input", genName: "shadcn/input", mode: "dark" },
			{ devName: "--ring", genName: "shadcn/ring", mode: "light" },
			{ devName: "--ring", genName: "shadcn/ring", mode: "dark" },
		];

		for (const check of checks) {
			const devValue =
				check.mode === "light"
					? rootVars.get(check.devName)
					: darkVars.get(check.devName);
			if (!devValue) continue;

			const devStep = extractGrayStep(devValue);
			if (devStep === null) continue;

			const modeName = check.mode === "light" ? "Light" : "Dark";
			const genToken = result.tokens.find(
				(t) =>
					t.figmaName === check.genName &&
					t.category === "semantics" &&
					(t as any).modeName === modeName,
			);

			if (!genToken) continue;

			const genRef = String(genToken.originalValue);
			const genStep = genRef.match(/\.(\d+)\}$/);
			if (!genStep) continue;

			expect(
				Number(genStep[1]),
				`${check.genName} ${check.mode}: dev uses gray step ${devStep}, generator uses step ${genStep[1]}`,
			).toBe(devStep);
		}
	});
});

// =========================================================================
// Abstraction layer — generator structure matches dev abstractions.css
// =========================================================================

describe("abstraction layer parity with dev abstractions.css", () => {
	const devAbsVars = parseCssBlock(devAbstractionsCss, ":root");

	test("surface abstractions cover same 1-12 range as dev", () => {
		// Dev has --color-surface-light-1 through -12
		const devSurfaceSteps = new Set<number>();
		for (const [name] of devAbsVars) {
			const match = name.match(/--color-surface-light-(\d+)/);
			if (match) devSurfaceSteps.add(Number(match[1]));
		}

		expect(devSurfaceSteps.size).toBe(12);

		// Generator produces surface/light/1 through surface/light/12 in abstractions
		const result = generateDesignSystem({
			primary: "#0090FF",
			grayName: "gray",
			darkMode: true,
		});

		const genSurfaceSteps = new Set<number>();
		for (const token of result.tokens) {
			if (token.category === "abstractions") {
				const match = token.figmaName.match(/^surface\/light\/(\d+)$/);
				if (match) genSurfaceSteps.add(Number(match[1]));
			}
		}

		for (const step of devSurfaceSteps) {
			expect(
				genSurfaceSteps.has(step),
				`Dev surface step ${step} missing from generator surface abstractions`,
			).toBe(true);
		}
	});

	test("typography step names from dev abstractions align with computed scale", () => {
		const steps = computeTypescale(DEFAULT_TYPESCALE);
		const stepNames = steps.map((s) => s.name);

		// Check that at least the core step names (base, sm, lg, xl) appear in dev abstractions
		for (const name of ["base", "sm", "lg", "xl"]) {
			expect(
				stepNames.includes(name),
				`Step "${name}" should exist in computed typescale`,
			).toBe(true);
		}

		// Every computed step should have positive size and line-height
		for (const step of steps) {
			expect(step.size).toBeGreaterThan(0);
			expect(step.lineHeight).toBeGreaterThan(0);
			expect(step.lineHeight).toBeGreaterThanOrEqual(step.size);
		}
	});

	test("radius t-shirt sizes from dev abstractions match generator", () => {
		const radiusScale = computeRadiusScale({ anchor: 10, multiplier: 1 });

		for (const [name, value] of devAbsVars) {
			const match = name.match(/^--rounded-([\w-]+)$/);
			if (!match) continue;
			const size = match[1];
			const devPx = extractPxValue(value);
			if (devPx === null) continue;

			if (radiusScale[size] !== undefined) {
				expect(
					radiusScale[size],
					`Radius "${size}": dev=${devPx}px, generator=${radiusScale[size]}px`,
				).toBe(devPx);
			}
		}
	});

	test("duration semantic aliases from dev abstractions resolve correctly", () => {
		for (const [name, value] of devAbsVars) {
			const match = name.match(/^--duration-([\w-]+)$/);
			if (!match) continue;

			const aliasName = match[1];
			if (!DURATION_SEMANTIC[aliasName]) continue;

			// Dev value is a var reference like `var(--duration-250)`
			// Extract the raw key
			const refMatch = value.match(/duration-(\w+)\)/);
			if (!refMatch) continue;

			const devRawKey = refMatch[1];
			const genRawKey = DURATION_SEMANTIC[aliasName];

			expect(
				genRawKey,
				`Duration "${aliasName}": dev references "${devRawKey}", generator references "${genRawKey}"`,
			).toBe(devRawKey);
		}
	});
});

// =========================================================================
// Font weights — generator matches dev primitives.css
// =========================================================================

describe("font weight parity with dev primitives.css", () => {
	const devVars = parseCssVars(devPrimitivesCss);

	test("dev font weight numeric values (100-900) are in generator", () => {
		// Dev uses --color-font-weight-variable-* with px values like "400px"
		// which map to weight numbers
		const devWeights = new Map<string, number>();
		for (const [name, value] of devVars) {
			const match = name.match(/^--color-font-weight-variable-([\w-]+)$/);
			if (!match) continue;
			const px = extractPxValue(value);
			if (px !== null) {
				// normalize name: "semi-bold" → "semibold", "extra-light" → "extralight"
				const normalized = match[1].replace(/-/g, "");
				devWeights.set(normalized, px);
			}
		}

		expect(devWeights.size).toBeGreaterThan(0);

		for (const [name, devValue] of devWeights) {
			if (FONT_WEIGHTS[name] !== undefined) {
				expect(
					FONT_WEIGHTS[name],
					`Font weight "${name}": dev=${devValue}, generator=${FONT_WEIGHTS[name]}`,
				).toBe(devValue);
			}
		}
	});
});

// =========================================================================
// Shadow CSS structure — validate dev shadow-tokens.css format
// =========================================================================

describe("shadow-tokens.css structure", () => {
	test("has :root block with --shadow-N custom properties", () => {
		const vars = parseCssVars(devShadowCss);
		const shadowLevels = [...vars.keys()].filter((k) =>
			/^--shadow-\d+$/.test(k),
		);
		expect(shadowLevels.length).toBeGreaterThanOrEqual(7);
	});

	test("shadow values use rgba() format", () => {
		const vars = parseCssVars(devShadowCss);
		for (const [name, value] of vars) {
			if (/^--shadow-\d+$/.test(name)) {
				expect(value).toMatch(/rgba\(/);
			}
		}
	});

	test("has @layer utilities block with .shadow-N classes", () => {
		expect(devShadowCss).toContain("@layer utilities");
		for (let i = 0; i <= 6; i++) {
			expect(devShadowCss).toContain(`.shadow-${i}`);
			expect(devShadowCss).toContain(`var(--shadow-${i})`);
		}
	});

	test("shadow levels are ordered 0-6", () => {
		const vars = parseCssVars(devShadowCss);
		for (let i = 0; i <= 6; i++) {
			expect(vars.has(`--shadow-${i}`), `--shadow-${i} missing`).toBe(true);
		}
	});
});

// =========================================================================
// Typescales CSS structure — validate dev typescales.css format
// =========================================================================

describe("typescales.css structure", () => {
	const expectedScales = [
		"large-title",
		"title-1",
		"title-2",
		"title-3",
		"headline",
		"body",
		"callout",
		"subhead",
		"footnote",
		"caption-1",
		"caption-2",
	];

	test("has :root block with all typescale custom properties", () => {
		const rootVars = parseCssBlock(devTypescalesCss, ":root");
		for (const scale of expectedScales) {
			expect(
				rootVars.has(`--typography-${scale}-font-size`),
				`Missing --typography-${scale}-font-size`,
			).toBe(true);
			expect(
				rootVars.has(`--typography-${scale}-line-height`),
				`Missing --typography-${scale}-line-height`,
			).toBe(true);
		}
	});

	test("all values use calc() with --typography-scale multiplier", () => {
		const rootVars = parseCssBlock(devTypescalesCss, ":root");
		for (const [name, value] of rootVars) {
			if (name.startsWith("--typography-")) {
				expect(value).toContain("calc(");
				expect(value).toContain("var(--typography-scale, 1)");
			}
		}
	});

	test("has @media breakpoints at 40rem, 48rem, 64rem, 80rem", () => {
		expect(devTypescalesCss).toContain("@media (min-width: 40rem)");
		expect(devTypescalesCss).toContain("@media (min-width: 48rem)");
		expect(devTypescalesCss).toContain("@media (min-width: 64rem)");
		expect(devTypescalesCss).toContain("@media (min-width: 80rem)");
	});

	test("has [data-window-size] selectors for xs, sm, md, lg, xl", () => {
		for (const size of ["xs", "sm", "md", "lg", "xl"]) {
			expect(devTypescalesCss).toContain(`[data-window-size="${size}"]`);
		}
	});

	test("has .size-* utility classes for each scale", () => {
		for (const scale of expectedScales) {
			expect(devTypescalesCss).toContain(`.size-${scale}`);
		}
	});

	test("has .leading-* utility classes for each scale", () => {
		for (const scale of expectedScales) {
			expect(devTypescalesCss).toContain(`.leading-${scale}`);
		}
	});

	test("has .type-* combined utility classes for each scale", () => {
		for (const scale of expectedScales) {
			expect(devTypescalesCss).toContain(`.type-${scale}`);
		}
	});

	test("has Tailwind .text-* utility mappings", () => {
		const tailwindSizes = [
			"text-xs",
			"text-sm",
			"text-base",
			"text-lg",
			"text-xl",
			"text-2xl",
			"text-3xl",
			"text-4xl",
			"text-5xl",
			"text-6xl",
			"text-7xl",
			"text-8xl",
			"text-9xl",
		];
		for (const tw of tailwindSizes) {
			expect(devTypescalesCss).toContain(`.${tw}`);
		}
	});

	test("font sizes decrease from large-title to caption-2 at :root", () => {
		const rootVars = parseCssBlock(devTypescalesCss, ":root");
		const sizes: number[] = [];
		for (const scale of expectedScales) {
			const value = rootVars.get(`--typography-${scale}-font-size`);
			if (value) {
				const px = extractPxValue(value);
				if (px !== null) sizes.push(px);
			}
		}
		// Sizes should be monotonically non-increasing
		for (let i = 1; i < sizes.length; i++) {
			expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
		}
	});
});

// =========================================================================
// Radius CSS structure — validate dev radius.css format
// =========================================================================

describe("radius.css structure", () => {
	test("has @theme inline block", () => {
		expect(devRadiusCss).toContain("@theme inline");
	});

	test("defines radius scale from 2xs to full", () => {
		const sizes = [
			"2xs",
			"xs",
			"sm",
			"md",
			"lg",
			"xl",
			"2xl",
			"3xl",
			"4xl",
			"full",
		];
		for (const size of sizes) {
			expect(devRadiusCss).toContain(`--radius-${size}`);
		}
	});

	test("all radius values use calc() with --radius-multiplier", () => {
		const regex = /--radius-([\w-]+):\s*([^;]+);/g;
		for (const match of devRadiusCss.matchAll(regex)) {
			const [, name, value] = match;
			if (name === "multiplier") continue; // skip the multiplier itself
			expect(value, `--radius-${name} should use calc()`).toContain("calc(");
			expect(
				value,
				`--radius-${name} should use --radius-multiplier`,
			).toContain("var(--radius-multiplier)");
		}
	});

	test("has :root with --corner-radius anchor and --radius-multiplier", () => {
		const rootVars = parseCssBlock(devRadiusCss, ":root");
		expect(rootVars.has("--corner-radius")).toBe(true);
		expect(rootVars.has("--radius-multiplier")).toBe(true);
	});

	test("--corner-radius anchor is 10px", () => {
		const rootVars = parseCssBlock(devRadiusCss, ":root");
		const anchor = rootVars.get("--corner-radius");
		expect(anchor).toBeDefined();
		const px = extractPxValue(anchor ?? "");
		expect(px).toBe(10);
	});

	test("--radius-multiplier defaults to 1", () => {
		const rootVars = parseCssBlock(devRadiusCss, ":root");
		expect(rootVars.get("--radius-multiplier")).toBe("1");
	});

	test("--radius-full uses 9999px for pill shape", () => {
		expect(devRadiusCss).toContain("9999px");
	});

	test("--radius-lg is the anchor (no offset)", () => {
		expect(devRadiusCss).toMatch(
			/--radius-lg:\s*calc\(var\(--corner-radius\)\s*\*\s*var\(--radius-multiplier\)\)/,
		);
	});
});

// =========================================================================
// CSS generator naming — validate prefix and naming conventions
// =========================================================================

describe("CSS variable naming conventions match dev output", () => {
	test("primitives has no @theme inline block", () => {
		expect(devPrimitivesCss).not.toContain("@theme inline");
	});

	test("abstractions has @theme inline before :root", () => {
		const themePos = devAbstractionsCss.indexOf("@theme inline");
		const rootPos = devAbstractionsCss.indexOf(":root");
		expect(themePos).toBeGreaterThan(-1);
		expect(rootPos).toBeGreaterThan(-1);
		expect(themePos).toBeLessThan(rootPos);
	});

	test("abstractions uses --z-layer-* naming (not --z-zlayer-*)", () => {
		const absVars = parseCssBlock(devAbstractionsCss, ":root");
		const zVars = [...absVars.keys()].filter((k) => k.startsWith("--z-"));
		expect(zVars.length).toBeGreaterThan(0);
		for (const name of zVars) {
			expect(name).toMatch(/^--z-layer-/);
			expect(name).not.toContain("zlayer");
		}
	});

	test("abstractions typescale size vars use --size- prefix", () => {
		const absVars = parseCssBlock(devAbstractionsCss, ":root");
		const sizeVars = [...absVars.keys()].filter(
			(k) =>
				k.includes("typescale") &&
				k.includes("size") &&
				!k.includes("line-height"),
		);
		expect(sizeVars.length).toBeGreaterThan(0);
		for (const name of sizeVars) {
			expect(name).toMatch(/^--size-/);
		}
	});

	test("abstractions typescale line-height vars use --color- prefix", () => {
		const absVars = parseCssBlock(devAbstractionsCss, ":root");
		const lhVars = [...absVars.keys()].filter(
			(k) => k.includes("typescale") && k.includes("line-height"),
		);
		expect(lhVars.length).toBeGreaterThan(0);
		for (const name of lhVars) {
			expect(name).toMatch(/^--color-/);
		}
	});

	test("primitives motion easing vars use --color- prefix (not --duration-)", () => {
		const primVars = parseCssVars(devPrimitivesCss);
		const easingVars = [...primVars.keys()].filter((k) => k.includes("easing"));
		expect(easingVars.length).toBeGreaterThan(0);
		for (const name of easingVars) {
			expect(name).toMatch(/^--color-motion-easing-/);
		}
	});

	test("primitives direct alpha colors use rgba() not color-mix()", () => {
		const primVars = parseCssVars(devPrimitivesCss);
		// white-0 and black-0 have alpha = 0
		const white0 = primVars.get("--color-white-0");
		const black0 = primVars.get("--color-black-0");
		expect(white0).toBeDefined();
		expect(black0).toBeDefined();
		expect(white0).toMatch(/^rgba\(/);
		expect(black0).toMatch(/^rgba\(/);
		expect(white0).not.toContain("color-mix");
		expect(black0).not.toContain("color-mix");
	});

	test("semantics @theme inline entries are alphabetically sorted by name", () => {
		const themeMatch = devSemanticsCss.match(/@theme inline\s*\{([^}]+)\}/);
		expect(themeMatch).not.toBeNull();
		const entries = themeMatch?.[1]
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l.startsWith("--"));
		expect(entries.length).toBeGreaterThan(0);
		// Sort by variable name (before the colon), not the full line
		const names = entries.map((e) => e.split(":")[0]);
		const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
		expect(names).toEqual(sortedNames);
	});

	test("abstractions @theme inline includes non-color vars (rounded, z-layer, duration)", () => {
		const themeMatch = devAbstractionsCss.match(/@theme inline\s*\{([^}]+)\}/);
		expect(themeMatch).not.toBeNull();
		const content = themeMatch?.[1];
		expect(content).toContain("--rounded-");
		expect(content).toContain("--z-layer-");
		expect(content).toContain("--duration-");
	});

	test("index.css uses double quotes for imports", () => {
		const indexCss = readDevCss("index.css");
		const imports = indexCss.split("\n").filter((l) => l.startsWith("@import"));
		expect(imports.length).toBeGreaterThan(0);
		for (const imp of imports) {
			expect(imp).toContain('"');
			expect(imp).not.toMatch(/@import\s+'/);
		}
	});
});

// =========================================================================
// Coverage report — list tokens in dev but not in generator
// =========================================================================

describe("gap analysis", () => {
	test("report dev semantic tokens not yet in generator (informational)", () => {
		const rootVars = parseCssBlock(devSemanticsCss, ":root");

		const result = generateDesignSystem({
			primary: "#0090FF",
			secondary: "#10B981",
			grayName: "gray",
			darkMode: true,
		});
		const _genNames = new Set(
			result.tokens
				.filter((t) => t.category === "semantics")
				.map((t) => t.figmaName),
		);

		// Known mapping from dev → generator names
		const mapped = new Set([
			"background",
			"foreground",
			"card",
			"card-foreground",
			"popover",
			"popover-foreground",
			"primary",
			"primary-foreground",
			"secondary",
			"secondary-foreground",
			"muted",
			"muted-foreground",
			"accent",
			"accent-foreground",
			"destructive",
			"success",
			"warning",
			"info",
			"border",
			"input",
			"ring",
		]);

		// These are intentionally not in the generator (utility/decoration)
		const excluded = new Set([
			"util-overlay-transparent",
			"util-mask",
			"util-transparent",
			"theme-theme",
			"theme-is-dark",
			"light",
			"dark",
		]);

		const gaps: string[] = [];
		for (const [name] of rootVars) {
			const clean = name.replace(/^--/, "");
			if (excluded.has(clean)) continue;
			if (clean.startsWith("chart-")) continue;
			if (clean.startsWith("sidebar-") || clean === "sidebar") continue;
			if (clean.startsWith("backplate-")) continue;
			if (mapped.has(clean)) continue;

			gaps.push(clean);
		}

		// This test is informational — it passes but logs gaps
		// Status colors (success, warning, info) are known gaps
		const knownGaps = new Set<string>([]);
		const unknownGaps = gaps.filter((g) => !knownGaps.has(g));

		expect(
			unknownGaps,
			`Unknown semantic tokens in dev but not in generator:\n${unknownGaps.join("\n")}`,
		).toHaveLength(0);
	});
});
