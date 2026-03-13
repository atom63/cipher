import { describe, expect, test } from "vitest";
import {
	parseColor,
	parseColorToRGBA,
	parseHexColor,
	parseHslColor,
	parseOKLCHColor,
	parseRgbColor,
} from "../src/parsers/color-parsers";

describe("parseHexColor", () => {
	test("parses 6-digit hex", () => {
		expect(parseHexColor("#ff0000")).toEqual({ r: 1, g: 0, b: 0 });
		expect(parseHexColor("#000000")).toEqual({ r: 0, g: 0, b: 0 });
		expect(parseHexColor("#ffffff")).toEqual({ r: 1, g: 1, b: 1 });
	});

	test("parses without # prefix", () => {
		expect(parseHexColor("ff0000")).toEqual({ r: 1, g: 0, b: 0 });
	});

	test("parses 3-digit shorthand", () => {
		expect(parseHexColor("#f00")).toEqual({ r: 1, g: 0, b: 0 });
		expect(parseHexColor("#fff")).toEqual({ r: 1, g: 1, b: 1 });
	});

	test("parses 8-digit hex with alpha", () => {
		const result = parseHexColor("#ff000080");
		expect(result).toBeDefined();
		expect(result?.r).toBe(1);
		expect(result?.g).toBe(0);
		expect(result?.b).toBe(0);
		expect(result?.a).toBeCloseTo(0.502, 2);
	});

	test("parses 4-digit shorthand with alpha", () => {
		const result = parseHexColor("#f008");
		expect(result).toBeDefined();
		expect(result?.r).toBe(1);
		expect(result?.a).toBeCloseTo(0.533, 2);
	});

	test("returns null for invalid hex", () => {
		expect(parseHexColor("#xyz")).toBeNull();
		expect(parseHexColor("#12")).toBeNull();
		expect(parseHexColor("#1234567890")).toBeNull();
	});

	test("parses mid-range colors accurately", () => {
		const result = parseHexColor("#808080");
		expect(result?.r).toBeCloseTo(0.502, 2);
		expect(result?.g).toBeCloseTo(0.502, 2);
		expect(result?.b).toBeCloseTo(0.502, 2);
	});
});

describe("parseRgbColor", () => {
	test("parses rgb()", () => {
		expect(parseRgbColor("rgb(255, 0, 0)")).toEqual({ r: 1, g: 0, b: 0, a: 1 });
	});

	test("parses rgba()", () => {
		const result = parseRgbColor("rgba(255, 0, 0, 0.5)");
		expect(result).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
	});

	test("parses rgb with no spaces", () => {
		expect(parseRgbColor("rgb(128,64,32)")).toBeDefined();
	});

	test("returns null for invalid rgb", () => {
		expect(parseRgbColor("not a color")).toBeNull();
		expect(parseRgbColor("rgb()")).toBeNull();
	});
});

describe("parseHslColor", () => {
	test("parses hsl() - red", () => {
		const result = parseHslColor("hsl(0, 100%, 50%)");
		expect(result).toBeDefined();
		expect(result?.r).toBeCloseTo(1, 2);
		expect(result?.g).toBeCloseTo(0, 2);
		expect(result?.b).toBeCloseTo(0, 2);
	});

	test("parses hsl() - green", () => {
		const result = parseHslColor("hsl(120, 100%, 50%)");
		expect(result).toBeDefined();
		expect(result?.g).toBeCloseTo(1, 2);
	});

	test("parses hsl() - blue", () => {
		const result = parseHslColor("hsl(240, 100%, 50%)");
		expect(result).toBeDefined();
		expect(result?.b).toBeCloseTo(1, 2);
	});

	test("parses hsla() with alpha", () => {
		const result = parseHslColor("hsla(0, 100%, 50%, 0.5)");
		expect(result).toBeDefined();
		expect(result?.a).toBe(0.5);
	});

	test("returns null for invalid hsl", () => {
		expect(parseHslColor("not a color")).toBeNull();
	});
});

describe("parseOKLCHColor", () => {
	test("parses oklch() without alpha", () => {
		const result = parseOKLCHColor("oklch(0.5 0.1 180)");
		expect(result).toBeDefined();
		expect(result?.r).toBeGreaterThanOrEqual(0);
		expect(result?.r).toBeLessThanOrEqual(1);
		expect(result?.a).toBe(1);
	});

	test("parses oklch() with alpha", () => {
		const result = parseOKLCHColor("oklch(0.5 0.1 180 / 0.5)");
		expect(result).toBeDefined();
		expect(result?.a).toBe(0.5);
	});

	test("parses black (L=0)", () => {
		const result = parseOKLCHColor("oklch(0 0 0)");
		expect(result).toBeDefined();
		expect(result?.r).toBeCloseTo(0, 2);
		expect(result?.g).toBeCloseTo(0, 2);
		expect(result?.b).toBeCloseTo(0, 2);
	});

	test("parses white (L=1)", () => {
		const result = parseOKLCHColor("oklch(1 0 0)");
		expect(result).toBeDefined();
		expect(result?.r).toBeCloseTo(1, 2);
		expect(result?.g).toBeCloseTo(1, 2);
		expect(result?.b).toBeCloseTo(1, 2);
	});

	test("clamps out-of-gamut values to 0-1", () => {
		const result = parseOKLCHColor("oklch(0.9 0.4 30)");
		expect(result).toBeDefined();
		expect(result?.r).toBeGreaterThanOrEqual(0);
		expect(result?.r).toBeLessThanOrEqual(1);
		expect(result?.g).toBeGreaterThanOrEqual(0);
		expect(result?.g).toBeLessThanOrEqual(1);
		expect(result?.b).toBeGreaterThanOrEqual(0);
		expect(result?.b).toBeLessThanOrEqual(1);
	});

	test("returns null for invalid oklch", () => {
		expect(parseOKLCHColor("not oklch")).toBeNull();
		expect(parseOKLCHColor("oklch()")).toBeNull();
	});
});

describe("parseColor (generic)", () => {
	test("routes hex colors", () => {
		expect(parseColor("#ff0000")).toEqual({ r: 1, g: 0, b: 0 });
	});

	test("routes rgb colors", () => {
		const result = parseColor("rgb(255, 0, 0)");
		expect(result).toBeDefined();
		expect(result?.r).toBe(1);
	});

	test("routes hsl colors", () => {
		const result = parseColor("hsl(0, 100%, 50%)");
		expect(result).toBeDefined();
		expect(result?.r).toBeCloseTo(1, 2);
	});

	test("routes oklch colors", () => {
		const result = parseColor("oklch(0.5 0.1 180)");
		expect(result).toBeDefined();
	});

	test("trims whitespace", () => {
		expect(parseColor("  #ff0000  ")).toEqual({ r: 1, g: 0, b: 0 });
	});

	test("returns null for unsupported formats", () => {
		expect(parseColor("not a color")).toBeNull();
		expect(parseColor("")).toBeNull();
	});
});

describe("parseColorToRGBA", () => {
	test("returns RGBA with default alpha", () => {
		const result = parseColorToRGBA("#ff0000");
		expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
	});

	test("preserves explicit alpha", () => {
		const result = parseColorToRGBA("rgba(255, 0, 0, 0.5)");
		expect(result.a).toBe(0.5);
	});

	test("returns fallback for invalid color", () => {
		const result = parseColorToRGBA("invalid");
		expect(result).toEqual({ r: 0.5, g: 0.5, b: 0.5, a: 1 });
	});

	test("accepts custom fallback", () => {
		const fallback = { r: 1, g: 1, b: 1, a: 1 };
		const result = parseColorToRGBA("invalid", fallback);
		expect(result).toEqual(fallback);
	});
});
