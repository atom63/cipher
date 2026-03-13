import { describe, expect, test } from "vitest";
import {
	convertColor,
	rgbToHex,
	rgbToOklch,
	rgbToRgba,
} from "../src/libraries/color-converters";
import { parseHexColor, parseOKLCHColor } from "../src/parsers/color-parsers";

describe("rgbToHex", () => {
	test("converts pure red", () => {
		expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe("#ff0000");
	});

	test("converts pure green", () => {
		expect(rgbToHex({ r: 0, g: 1, b: 0 })).toBe("#00ff00");
	});

	test("converts pure blue", () => {
		expect(rgbToHex({ r: 0, g: 0, b: 1 })).toBe("#0000ff");
	});

	test("converts black", () => {
		expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
	});

	test("converts white", () => {
		expect(rgbToHex({ r: 1, g: 1, b: 1 })).toBe("#ffffff");
	});

	test("includes alpha when < 1", () => {
		const result = rgbToHex({ r: 1, g: 0, b: 0, a: 0.5 });
		expect(result).toBe("#ff000080");
	});

	test("omits alpha when fully opaque", () => {
		const result = rgbToHex({ r: 1, g: 0, b: 0, a: 1 });
		expect(result).toBe("#ff0000");
	});

	test("handles mid-range values", () => {
		const result = rgbToHex({ r: 0.5, g: 0.5, b: 0.5 });
		expect(result).toBe("#808080");
	});
});

describe("rgbToRgba", () => {
	test("converts to rgba string", () => {
		expect(rgbToRgba({ r: 1, g: 0, b: 0 })).toBe("rgba(255, 0, 0, 1)");
	});

	test("includes alpha", () => {
		expect(rgbToRgba({ r: 1, g: 0, b: 0, a: 0.5 })).toBe(
			"rgba(255, 0, 0, 0.5)",
		);
	});

	test("defaults alpha to 1", () => {
		const result = rgbToRgba({ r: 0, g: 0, b: 0 });
		expect(result).toContain(", 1)");
	});
});

describe("rgbToOklch", () => {
	test("converts black", () => {
		const result = rgbToOklch({ r: 0, g: 0, b: 0 });
		expect(result).toMatch(/^oklch\(/);
		expect(result).toContain("0.000000");
	});

	test("converts white", () => {
		const result = rgbToOklch({ r: 1, g: 1, b: 1 });
		expect(result).toMatch(/^oklch\(/);
		// L should be close to 1
		const match = result.match(/oklch\(([0-9.]+)/);
		expect(Number.parseFloat(match?.[1] ?? "")).toBeCloseTo(1, 2);
	});

	test("includes alpha when < 1", () => {
		const result = rgbToOklch({ r: 1, g: 0, b: 0, a: 0.5 });
		expect(result).toContain("/");
	});

	test("omits alpha when fully opaque", () => {
		const result = rgbToOklch({ r: 1, g: 0, b: 0 });
		expect(result).not.toContain("/");
	});
});

describe("convertColor", () => {
	const red = { r: 1, g: 0, b: 0 };

	test("converts to hex", () => {
		expect(convertColor(red, "hex")).toBe("#ff0000");
	});

	test("converts to rgba", () => {
		expect(convertColor(red, "rgba")).toBe("rgba(255, 0, 0, 1)");
	});

	test("converts to oklch", () => {
		expect(convertColor(red, "oklch")).toMatch(/^oklch\(/);
	});

	test("defaults to oklch for unknown format", () => {
		expect(convertColor(red, "whatever")).toMatch(/^oklch\(/);
	});
});

describe("roundtrip conversions", () => {
	const testColors = [
		{ r: 1, g: 0, b: 0 },
		{ r: 0, g: 1, b: 0 },
		{ r: 0, g: 0, b: 1 },
		{ r: 0.2, g: 0.4, b: 0.8 },
		{ r: 0.9, g: 0.1, b: 0.5 },
		{ r: 0.5, g: 0.5, b: 0.5 },
	];

	test("hex roundtrip: rgb → hex → rgb", () => {
		for (const color of testColors) {
			const hex = rgbToHex(color);
			const back = parseHexColor(hex);
			expect(back).toBeDefined();
			expect(back?.r).toBeCloseTo(color.r, 2);
			expect(back?.g).toBeCloseTo(color.g, 2);
			expect(back?.b).toBeCloseTo(color.b, 2);
		}
	});

	test("oklch roundtrip: rgb → oklch → rgb", () => {
		for (const color of testColors) {
			const oklch = rgbToOklch(color);
			const back = parseOKLCHColor(oklch);
			expect(back).toBeDefined();
			expect(back?.r).toBeCloseTo(color.r, 2);
			expect(back?.g).toBeCloseTo(color.g, 2);
			expect(back?.b).toBeCloseTo(color.b, 2);
		}
	});
});
