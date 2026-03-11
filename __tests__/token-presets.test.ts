import { describe, expect, test } from "vitest";
import {
	computeRadiusScale,
	computeTypescale,
	DEFAULT_TYPESCALE,
	DURATION_RAW,
	DURATION_SEMANTIC,
	FONT_FAMILIES,
	FONT_WEIGHTS,
	SHADOW_SCALE,
	SPACING_SCALE,
} from "../generators/token-presets";

// =========================================================================
// computeRadiusScale — radius t-shirt sizes from anchor
// =========================================================================

describe("computeRadiusScale", () => {
	test("produces all t-shirt sizes plus none and full", () => {
		const scale = computeRadiusScale(10);
		const keys = Object.keys(scale);
		expect(keys).toContain("none");
		expect(keys).toContain("2xs");
		expect(keys).toContain("xs");
		expect(keys).toContain("sm");
		expect(keys).toContain("md");
		expect(keys).toContain("lg");
		expect(keys).toContain("xl");
		expect(keys).toContain("2xl");
		expect(keys).toContain("3xl");
		expect(keys).toContain("4xl");
		expect(keys).toContain("full");
	});

	test("lg equals anchor value", () => {
		expect(computeRadiusScale(10).lg).toBe(10);
		expect(computeRadiusScale(8).lg).toBe(8);
		expect(computeRadiusScale(16).lg).toBe(16);
	});

	test("none is always 0", () => {
		expect(computeRadiusScale(10).none).toBe(0);
		expect(computeRadiusScale(0).none).toBe(0);
	});

	test("full is always 9999", () => {
		expect(computeRadiusScale(10).full).toBe(9999);
	});

	test("sizes increase from 2xs to 4xl", () => {
		const scale = computeRadiusScale(10);
		const ordered = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"];
		for (let i = 1; i < ordered.length; i++) {
			expect(scale[ordered[i]]).toBeGreaterThan(scale[ordered[i - 1]]);
		}
	});

	test("values never go negative", () => {
		const scale = computeRadiusScale(2);
		for (const [, value] of Object.entries(scale)) {
			expect(value).toBeGreaterThanOrEqual(0);
		}
	});

	test("accepts plain number (multiplier defaults to 1)", () => {
		const fromNumber = computeRadiusScale(10);
		const fromConfig = computeRadiusScale({ anchor: 10, multiplier: 1 });
		expect(fromNumber).toEqual(fromConfig);
	});

	test("multiplier scales all values proportionally", () => {
		const base = computeRadiusScale({ anchor: 10, multiplier: 1 });
		const doubled = computeRadiusScale({ anchor: 10, multiplier: 2 });
		expect(doubled.lg).toBe(base.lg * 2);
		expect(doubled.xl).toBe(base.xl * 2);
	});

	test("multiplier 0 produces all zeros except full", () => {
		const scale = computeRadiusScale({ anchor: 10, multiplier: 0 });
		for (const [name, value] of Object.entries(scale)) {
			if (name === "full") {
				expect(value).toBe(0); // 9999 * 0
			} else {
				expect(value).toBe(0);
			}
		}
	});
});

// =========================================================================
// computeTypescale — mathematical type ramp generation
// =========================================================================

describe("computeTypescale", () => {
	test("default config produces 9 steps (6 up + base + 2 down)", () => {
		const steps = computeTypescale();
		expect(steps).toHaveLength(9);
	});

	test("step names are ordered largest to smallest", () => {
		const steps = computeTypescale();
		const expectedOrder = ["5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"];
		expect(steps.map((s) => s.name)).toEqual(expectedOrder);
	});

	test("font sizes decrease from top to bottom", () => {
		const steps = computeTypescale();
		for (let i = 1; i < steps.length; i++) {
			expect(steps[i].size).toBeLessThanOrEqual(steps[i - 1].size);
		}
	});

	test("base step matches configured base size", () => {
		const steps = computeTypescale({ ...DEFAULT_TYPESCALE, base: 18 });
		const base = steps.find((s) => s.name === "base");
		expect(base?.size).toBe(18);
	});

	test("all values are rounded to whole numbers", () => {
		const steps = computeTypescale();
		for (const step of steps) {
			expect(step.size).toBe(Math.round(step.size));
			expect(step.lineHeight).toBe(Math.round(step.lineHeight));
		}
	});

	test("line-height is always >= font size", () => {
		const steps = computeTypescale();
		for (const step of steps) {
			expect(step.lineHeight).toBeGreaterThanOrEqual(step.size);
		}
	});

	test("downscale never goes below 11px minimum", () => {
		const steps = computeTypescale({
			...DEFAULT_TYPESCALE,
			base: 14,
			ratio: "golden-ratio",
			stepsDown: 2,
		});
		for (const step of steps) {
			expect(step.size).toBeGreaterThanOrEqual(11);
		}
	});

	test("different ratios produce different heading sizes", () => {
		const small = computeTypescale({ ...DEFAULT_TYPESCALE, ratio: "minor-third" });
		const large = computeTypescale({ ...DEFAULT_TYPESCALE, ratio: "golden-ratio" });
		const smallXl = small.find((s) => s.name === "xl");
		const largeXl = large.find((s) => s.name === "xl");
		expect(largeXl!.size).toBeGreaterThan(smallXl!.size);
	});

	test("custom stepsUp/stepsDown adjust step count", () => {
		const steps = computeTypescale({
			...DEFAULT_TYPESCALE,
			stepsUp: 2,
			stepsDown: 1,
		});
		// 2 up + base + 1 down = 4
		expect(steps).toHaveLength(4);
	});
});

// =========================================================================
// Data integrity — verify preset data structures
// =========================================================================

describe("preset data integrity", () => {
	test("SPACING_SCALE has positive values", () => {
		for (const [key, value] of Object.entries(SPACING_SCALE)) {
			expect(value, `spacing "${key}" should be non-negative`).toBeGreaterThanOrEqual(0);
		}
	});

	test("SPACING_SCALE includes common stops", () => {
		expect(SPACING_SCALE["0"]).toBe(0);
		expect(SPACING_SCALE["4"]).toBe(16);
		expect(SPACING_SCALE["8"]).toBe(32);
	});

	test("SHADOW_SCALE has levels 0-6", () => {
		for (let i = 0; i <= 6; i++) {
			expect(SHADOW_SCALE[String(i)], `shadow level ${i} missing`).toBeDefined();
		}
	});

	test("shadow 0 has zero opacity", () => {
		expect(SHADOW_SCALE["0"][0].opacity).toBe(0);
		expect(SHADOW_SCALE["0"][0].blur).toBe(0);
	});

	test("shadow complexity increases with level", () => {
		for (let i = 1; i <= 6; i++) {
			const layers = SHADOW_SCALE[String(i)];
			expect(layers.length).toBeGreaterThanOrEqual(1);
		}
	});

	test("DURATION_RAW has monotonically increasing values", () => {
		const entries = Object.entries(DURATION_RAW)
			.filter(([k]) => k !== "none")
			.sort(([a], [b]) => Number(a) - Number(b));
		for (let i = 1; i < entries.length; i++) {
			expect(entries[i][1]).toBeGreaterThan(entries[i - 1][1]);
		}
	});

	test("DURATION_SEMANTIC references exist in DURATION_RAW", () => {
		for (const [alias, rawKey] of Object.entries(DURATION_SEMANTIC)) {
			expect(
				DURATION_RAW[rawKey],
				`Duration alias "${alias}" references "${rawKey}" which doesn't exist in DURATION_RAW`,
			).toBeDefined();
		}
	});

	test("FONT_FAMILIES includes sans, serif, mono", () => {
		expect(FONT_FAMILIES.sans).toBeDefined();
		expect(FONT_FAMILIES.serif).toBeDefined();
		expect(FONT_FAMILIES.mono).toBeDefined();
	});

	test("FONT_WEIGHTS covers standard CSS weight values", () => {
		expect(FONT_WEIGHTS.normal).toBe(400);
		expect(FONT_WEIGHTS.bold).toBe(700);
		expect(FONT_WEIGHTS.medium).toBe(500);
	});

	test("FONT_WEIGHTS values are between 100 and 900", () => {
		for (const [name, value] of Object.entries(FONT_WEIGHTS)) {
			expect(value, `weight "${name}" should be 100-900`).toBeGreaterThanOrEqual(100);
			expect(value, `weight "${name}" should be 100-900`).toBeLessThanOrEqual(900);
		}
	});
});
