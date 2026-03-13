import { describe, expect, test } from "vitest";
import {
	adjustSaturation,
	generateColorScale,
	generateNeutralScale,
	hexToRgb,
	oklchToRgb,
	rgbToHex,
	rgbToOklch,
	SHADE_STEPS,
} from "../src/generators/color-scale";

describe("rgbToOklch", () => {
	test("converts pure red", () => {
		const oklch = rgbToOklch(1, 0, 0);
		expect(oklch.l).toBeCloseTo(0.6279, 2);
		expect(oklch.c).toBeGreaterThan(0.2);
		expect(oklch.h).toBeCloseTo(29.2, 0);
	});

	test("converts pure white", () => {
		const oklch = rgbToOklch(1, 1, 1);
		expect(oklch.l).toBeCloseTo(1, 2);
		expect(oklch.c).toBeCloseTo(0, 2);
	});

	test("converts pure black", () => {
		const oklch = rgbToOklch(0, 0, 0);
		expect(oklch.l).toBeCloseTo(0, 2);
		expect(oklch.c).toBeCloseTo(0, 2);
	});
});

describe("oklchToRgb", () => {
	test("round-trips through OKLCH", () => {
		const original = { r: 0.2, g: 0.5, b: 0.8 };
		const oklch = rgbToOklch(original.r, original.g, original.b);
		const result = oklchToRgb(oklch);
		expect(result.r).toBeCloseTo(original.r, 2);
		expect(result.g).toBeCloseTo(original.g, 2);
		expect(result.b).toBeCloseTo(original.b, 2);
	});

	test("clamps out-of-gamut values", () => {
		const result = oklchToRgb({ l: 0.9, c: 0.4, h: 150 });
		expect(result.r).toBeGreaterThanOrEqual(0);
		expect(result.r).toBeLessThanOrEqual(1);
		expect(result.g).toBeGreaterThanOrEqual(0);
		expect(result.g).toBeLessThanOrEqual(1);
		expect(result.b).toBeGreaterThanOrEqual(0);
		expect(result.b).toBeLessThanOrEqual(1);
	});
});

describe("hexToRgb / rgbToHex", () => {
	test("converts 6-digit hex", () => {
		const rgb = hexToRgb("#3B82F6");
		expect(rgb.r).toBeCloseTo(0.231, 2);
		expect(rgb.g).toBeCloseTo(0.51, 2);
		expect(rgb.b).toBeCloseTo(0.965, 2);
	});

	test("handles short hex", () => {
		const rgb = hexToRgb("#fff");
		expect(rgb.r).toBeCloseTo(1, 2);
		expect(rgb.g).toBeCloseTo(1, 2);
		expect(rgb.b).toBeCloseTo(1, 2);
	});

	test("round-trips hex", () => {
		expect(rgbToHex(hexToRgb("#3b82f6"))).toBe("#3b82f6");
	});
});

describe("generateColorScale", () => {
	test("generates all 11 shade steps", () => {
		const scale = generateColorScale("blue", "#3B82F6");
		expect(Object.keys(scale.shades)).toHaveLength(SHADE_STEPS.length);
		expect(Object.keys(scale.hexValues)).toHaveLength(SHADE_STEPS.length);
	});

	test("lightness decreases from 50 to 950", () => {
		const scale = generateColorScale("blue", "#3B82F6");
		for (let i = 1; i < SHADE_STEPS.length; i++) {
			const prevShade = scale.shades[SHADE_STEPS[i - 1]];
			const currShade = scale.shades[SHADE_STEPS[i]];
			// Luminance should decrease (lighter → darker)
			const prevLum =
				0.2126 * prevShade.r + 0.7152 * prevShade.g + 0.0722 * prevShade.b;
			const currLum =
				0.2126 * currShade.r + 0.7152 * currShade.g + 0.0722 * currShade.b;
			expect(prevLum).toBeGreaterThan(currLum);
		}
	});

	test("shade 50 is very light", () => {
		const scale = generateColorScale("emerald", "#10B981");
		const shade50 = scale.shades[50];
		const lum = 0.2126 * shade50.r + 0.7152 * shade50.g + 0.0722 * shade50.b;
		expect(lum).toBeGreaterThan(0.85);
	});

	test("shade 950 is very dark", () => {
		const scale = generateColorScale("emerald", "#10B981");
		const shade950 = scale.shades[950];
		const lum = 0.2126 * shade950.r + 0.7152 * shade950.g + 0.0722 * shade950.b;
		expect(lum).toBeLessThan(0.1);
	});

	test("hex values are valid", () => {
		const scale = generateColorScale("red", "#EF4444");
		for (const step of SHADE_STEPS) {
			expect(scale.hexValues[step]).toMatch(/^#[0-9a-f]{6}$/);
		}
	});
});

describe("adjustSaturation", () => {
	test("multiplier=1 returns original colors", () => {
		const colors = ["#fcfcfd", "#f1f3f5", "#8b8d98"];
		expect(adjustSaturation(colors, 1)).toEqual(colors);
	});

	test("multiplier=0 produces near-gray colors", () => {
		const colors = ["#f1f3f5", "#dce0e5"];
		const desaturated = adjustSaturation(colors, 0);
		for (const hex of desaturated) {
			const rgb = hexToRgb(hex);
			const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
			expect(oklch.c).toBeLessThan(0.002);
		}
	});

	test("multiplier=2 increases chroma", () => {
		const colors = ["#f1f3f5"];
		const rgb1 = hexToRgb(colors[0]);
		const oklch1 = rgbToOklch(rgb1.r, rgb1.g, rgb1.b);

		const boosted = adjustSaturation(colors, 2);
		const rgb2 = hexToRgb(boosted[0]);
		const oklch2 = rgbToOklch(rgb2.r, rgb2.g, rgb2.b);

		expect(oklch2.c).toBeGreaterThan(oklch1.c);
	});
});

describe("generateNeutralScale", () => {
	test("returns 12 steps for light and dark", () => {
		const scale = generateNeutralScale("#3B82F6");
		expect(scale.light).toHaveLength(12);
		expect(scale.dark).toHaveLength(12);
	});

	test("saturation=0 produces near-gray neutrals", () => {
		const scale = generateNeutralScale("#3B82F6", 0);
		for (const hex of scale.light) {
			const rgb = hexToRgb(hex);
			const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
			expect(oklch.c).toBeLessThan(0.002);
		}
	});

	test("saturation=2 produces more saturated neutrals", () => {
		const normal = generateNeutralScale("#3B82F6", 1);
		const boosted = generateNeutralScale("#3B82F6", 2);
		// Compare mid-range step (step 8) which has most visible chroma
		const normalRgb = hexToRgb(normal.light[7]);
		const boostedRgb = hexToRgb(boosted.light[7]);
		const normalOklch = rgbToOklch(normalRgb.r, normalRgb.g, normalRgb.b);
		const boostedOklch = rgbToOklch(boostedRgb.r, boostedRgb.g, boostedRgb.b);
		expect(boostedOklch.c).toBeGreaterThan(normalOklch.c);
	});
});
