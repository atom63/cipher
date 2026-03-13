import { describe, expect, test } from "vitest";
import type { StringVarEntry, VarEntry } from "../src/libraries/rebind-matching";
import {
	colorKey,
	findFloatVar,
	findStringVar,
	normalizePath,
	WEIGHT_MAP,
} from "../src/libraries/rebind-matching";

// =============================================================================
// normalizePath
// =============================================================================

describe("normalizePath", () => {
	test("lowercases and strips hyphens", () => {
		expect(normalizePath("Font-Size")).toBe("fontsize");
	});

	test("strips underscores and spaces", () => {
		expect(normalizePath("font_weight extra")).toBe("fontweightextra");
	});

	test("preserves slashes (path separators)", () => {
		expect(normalizePath("typography/large-title")).toBe(
			"typography/largetitle",
		);
	});

	test("handles empty string", () => {
		expect(normalizePath("")).toBe("");
	});
});

// =============================================================================
// colorKey
// =============================================================================

describe("colorKey", () => {
	test("converts pure red", () => {
		expect(colorKey(1, 0, 0, 1)).toBe("255,0,0,100");
	});

	test("includes alpha", () => {
		expect(colorKey(0, 0, 0, 0.5)).toBe("0,0,0,50");
	});

	test("rounds to nearest integer", () => {
		expect(colorKey(0.502, 0.502, 0.502, 0.753)).toBe("128,128,128,75");
	});
});

// =============================================================================
// WEIGHT_MAP
// =============================================================================

describe("WEIGHT_MAP", () => {
	test("maps common font styles to numeric weights", () => {
		expect(WEIGHT_MAP.regular).toBe(400);
		expect(WEIGHT_MAP.medium).toBe(500);
		expect(WEIGHT_MAP.bold).toBe(700);
	});

	test("maps thin/hairline to 100", () => {
		expect(WEIGHT_MAP.thin).toBe(100);
		expect(WEIGHT_MAP.hairline).toBe(100);
	});

	test("maps black/heavy to 900", () => {
		expect(WEIGHT_MAP.black).toBe(900);
		expect(WEIGHT_MAP.heavy).toBe(900);
	});
});

// =============================================================================
// findFloatVar — path-based matching
// =============================================================================

describe("findFloatVar", () => {
	const vars: VarEntry[] = [
		{
			id: "1",
			name: "typography/large-title/font/size",
			values: [36, 32, 28],
		},
		{
			id: "2",
			name: "typography/large-title/line/height",
			values: [44, 40, 36],
		},
		{
			id: "3",
			name: "typography/body/font/size",
			values: [14, 14, 14],
		},
		{ id: "4", name: "spacing/9", values: [36] },
		{ id: "5", name: "font/weight/default", values: [400] },
		{ id: "6", name: "font/weight/strong", values: [500] },
	];

	test("matches by path: style name + property suffix", () => {
		const result = findFloatVar(
			vars,
			36,
			"typography/large-title",
			"font/size",
		);
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("1");
		expect(result?.type).toBe("exact");
	});

	test("does NOT match spacing variable with same value when path differs", () => {
		// spacing/9 has value 36, but path doesn't match typography/large-title/font/size
		const result = findFloatVar(
			vars,
			36,
			"typography/large-title",
			"font/size",
		);
		expect(result?.var.id).not.toBe("4");
	});

	test("matches line-height by path", () => {
		const result = findFloatVar(
			vars,
			44,
			"typography/large-title",
			"line/height",
		);
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("2");
		expect(result?.type).toBe("exact");
	});

	test("matches body font-size (not large-title)", () => {
		const result = findFloatVar(vars, 14, "typography/body", "font/size");
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("3");
		expect(result?.type).toBe("exact");
	});

	test("falls back to hint-based matching for font-weight", () => {
		// font/weight/default doesn't match path "typography/large-title/font/weight"
		// but "weight" hint matches "font/weight/default"
		const result = findFloatVar(
			vars,
			400,
			"typography/large-title",
			"font/weight",
			"weight",
		);
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("5");
		expect(result?.type).toBe("name");
	});

	test("matches font/weight/strong for medium (500)", () => {
		const result = findFloatVar(
			vars,
			500,
			"typography/large-title-strong",
			"font/weight",
			"weight",
		);
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("6");
		expect(result?.type).toBe("name");
	});

	test("returns undefined when no value matches", () => {
		const result = findFloatVar(
			vars,
			999,
			"typography/large-title",
			"font/size",
		);
		expect(result).toBeUndefined();
	});

	test("returns undefined when no hint matches", () => {
		const result = findFloatVar(
			vars,
			36,
			"typography/large-title",
			"no-such-prop",
		);
		expect(result).toBeUndefined();
	});

	test("matches responsive values across modes", () => {
		// large-title font-size has [36, 32, 28] — should match any mode
		const result32 = findFloatVar(
			vars,
			32,
			"typography/large-title",
			"font/size",
		);
		expect(result32).toBeDefined();
		expect(result32?.var.id).toBe("1");

		const result28 = findFloatVar(
			vars,
			28,
			"typography/large-title",
			"font/size",
		);
		expect(result28).toBeDefined();
		expect(result28?.var.id).toBe("1");
	});
});

// =============================================================================
// findStringVar — path-based matching
// =============================================================================

describe("findStringVar", () => {
	const vars: StringVarEntry[] = [
		{ id: "1", name: "font/family/primary", values: ["Inter"] },
		{ id: "2", name: "font/family/mono", values: ["JetBrains Mono"] },
		{
			id: "3",
			name: "typography/body/font/family",
			values: ["SF Pro Display"],
		},
	];

	test("matches by path when style name aligns with variable", () => {
		const result = findStringVar(
			vars,
			"SF Pro Display",
			"typography/body",
			"font/family",
		);
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("3");
		expect(result?.type).toBe("exact");
	});

	test("falls back to hint when path doesn't match", () => {
		// "font/family/primary" doesn't match path "typography/large-title/font/family"
		// but "family" hint matches "font/family/primary"
		const result = findStringVar(
			vars,
			"Inter",
			"typography/large-title",
			"font/family",
			"family",
		);
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("1");
		expect(result?.type).toBe("name");
	});

	test("case-insensitive value matching", () => {
		const result = findStringVar(
			vars,
			"inter",
			"typography/large-title",
			"font/family",
			"family",
		);
		expect(result).toBeDefined();
		expect(result?.var.id).toBe("1");
	});

	test("returns undefined when value not found", () => {
		const result = findStringVar(
			vars,
			"Helvetica",
			"typography/body",
			"font/family",
			"family",
		);
		expect(result).toBeUndefined();
	});
});

// =============================================================================
// Integration: full typography rebind scenario
// =============================================================================

describe("typography rebind scenario", () => {
	// Simulates real Figma variable setup with responsive + alias collections
	const floatVars: VarEntry[] = [
		// Responsive typography (3 modes: desktop, tablet, mobile)
		{
			id: "fs:lt",
			name: "typography/large-title/font/size",
			values: [36, 32, 28],
		},
		{
			id: "lh:lt",
			name: "typography/large-title/line/height",
			values: [44, 40, 36],
		},
		{ id: "fs:t1", name: "typography/title-1/font/size", values: [30, 28, 24] },
		{
			id: "lh:t1",
			name: "typography/title-1/line/height",
			values: [38, 36, 32],
		},
		{ id: "fs:b", name: "typography/body/font/size", values: [14, 14, 14] },
		{ id: "lh:b", name: "typography/body/line/height", values: [20, 20, 20] },
		// Alias: font weights
		{ id: "fw:d", name: "font/weight/default", values: [400] },
		{ id: "fw:s", name: "font/weight/strong", values: [500] },
		// Spacing (should NOT match typography)
		{ id: "sp:9", name: "spacing/9", values: [36] },
		{ id: "sp:5", name: "spacing/5", values: [20] },
	];

	const stringVars: StringVarEntry[] = [
		{ id: "ff:p", name: "font/family/primary", values: ["Inter"] },
	];

	test("large-title fontSize → typography/large-title/font/size (not spacing/9)", () => {
		const result = findFloatVar(
			floatVars,
			36,
			"typography/large-title",
			"font/size",
		);
		expect(result?.var.id).toBe("fs:lt");
		expect(result?.var.id).not.toBe("sp:9");
	});

	test("large-title lineHeight → typography/large-title/line/height", () => {
		const result = findFloatVar(
			floatVars,
			44,
			"typography/large-title",
			"line/height",
		);
		expect(result?.var.id).toBe("lh:lt");
	});

	test("body fontSize → typography/body/font/size (not spacing/5 even though both are 20)", () => {
		// body font-size is 14, not 20 — spacing/5 is 20
		const result = findFloatVar(floatVars, 14, "typography/body", "font/size");
		expect(result?.var.id).toBe("fs:b");
	});

	test("body lineHeight → typography/body/line/height (not spacing/5)", () => {
		const result = findFloatVar(
			floatVars,
			20,
			"typography/body",
			"line/height",
		);
		expect(result?.var.id).toBe("lh:b");
		expect(result?.var.id).not.toBe("sp:5");
	});

	test("fontWeight Regular → font/weight/default", () => {
		const weight = WEIGHT_MAP.regular; // 400
		const result = findFloatVar(
			floatVars,
			weight,
			"typography/large-title",
			"font/weight",
			"weight",
		);
		expect(result?.var.id).toBe("fw:d");
	});

	test("fontWeight Medium → font/weight/strong", () => {
		const weight = WEIGHT_MAP.medium; // 500
		const result = findFloatVar(
			floatVars,
			weight,
			"typography/large-title-strong",
			"font/weight",
			"weight",
		);
		expect(result?.var.id).toBe("fw:s");
	});

	test("fontFamily → font/family/primary", () => {
		const result = findStringVar(
			stringVars,
			"Inter",
			"typography/large-title",
			"font/family",
			"family",
		);
		expect(result?.var.id).toBe("ff:p");
	});

	test("different styles don't cross-match", () => {
		// title-1 font-size should match title-1, not large-title
		const result = findFloatVar(
			floatVars,
			30,
			"typography/title-1",
			"font/size",
		);
		expect(result?.var.id).toBe("fs:t1");
	});
});
