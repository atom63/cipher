import { describe, expect, test } from "vitest";
import {
	generateColorScale,
	hexToRgb,
	oklchToRgb,
	rgbToHex,
	rgbToOklch,
	SHADE_STEPS,
} from "../generators/color-scale";

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

