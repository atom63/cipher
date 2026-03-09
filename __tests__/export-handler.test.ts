import { describe, expect, test } from "vitest";
import {
	convertVariableValue,
	figmaTypeToTokenType,
} from "../handlers/export-handler";

describe("figmaTypeToTokenType", () => {
	test("maps COLOR to color", () => {
		expect(figmaTypeToTokenType("COLOR", "background")).toBe("color");
	});

	test("maps STRING to string", () => {
		expect(figmaTypeToTokenType("STRING", "font-family")).toBe("string");
	});

	test("maps BOOLEAN to boolean", () => {
		expect(figmaTypeToTokenType("BOOLEAN", "visible")).toBe("boolean");
	});

	describe("FLOAT type inference from name", () => {
		test("infers borderRadius from radius path", () => {
			expect(figmaTypeToTokenType("FLOAT", "radius/lg")).toBe("borderRadius");
			expect(figmaTypeToTokenType("FLOAT", "component/radius/sm")).toBe(
				"borderRadius",
			);
		});

		test("infers spacing from spacing path", () => {
			expect(figmaTypeToTokenType("FLOAT", "spacing/md")).toBe("spacing");
			expect(figmaTypeToTokenType("FLOAT", "layout/spacing/4")).toBe("spacing");
		});

		test("infers sizing from size/sizes path", () => {
			expect(figmaTypeToTokenType("FLOAT", "sizes/icon")).toBe("sizing");
			expect(figmaTypeToTokenType("FLOAT", "size/button")).toBe("sizing");
		});

		test("defaults to number for unrecognized FLOAT", () => {
			expect(figmaTypeToTokenType("FLOAT", "opacity")).toBe("number");
			expect(figmaTypeToTokenType("FLOAT", "custom-value")).toBe("number");
		});
	});

	test("returns unknown for unrecognized types", () => {
		expect(figmaTypeToTokenType("VARIANT", "mode")).toBe("unknown");
	});
});

describe("convertVariableValue", () => {
	// convertVariableValue uses figma.variables.getVariableById for aliases,
	// which is not available in test. We test direct value conversion only.

	const makeVariable = (resolvedType: string) =>
		({ resolvedType }) as any;

	test("converts COLOR to formatted string", () => {
		const value = { r: 1, g: 0, b: 0 };
		const result = convertVariableValue(value, makeVariable("COLOR"), "hex");
		expect(result).toBe("#ff0000");
	});

	test("converts COLOR with oklch format", () => {
		const value = { r: 1, g: 0, b: 0 };
		const result = convertVariableValue(value, makeVariable("COLOR"), "oklch");
		expect(result).toContain("oklch(");
	});

	test("converts FLOAT to px string", () => {
		const result = convertVariableValue(16, makeVariable("FLOAT"));
		expect(result).toBe("16px");
	});

	test("converts STRING directly", () => {
		const result = convertVariableValue("Inter", makeVariable("STRING"));
		expect(result).toBe("Inter");
	});

	test("converts BOOLEAN to string", () => {
		expect(convertVariableValue(true, makeVariable("BOOLEAN"))).toBe("true");
		expect(convertVariableValue(false, makeVariable("BOOLEAN"))).toBe("false");
	});

	test("converts zero FLOAT correctly", () => {
		const result = convertVariableValue(0, makeVariable("FLOAT"));
		expect(result).toBe("0px");
	});
});
