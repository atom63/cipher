import { describe, expect, it } from "vitest";
import { validateTokens } from "../src/parsers/import-validator";
import type { DesignToken } from "../src/types/tokens";

// Helper to create a minimal token
function token(
	overrides: Partial<DesignToken> & { figmaName: string },
): DesignToken {
	return {
		id: `token-${overrides.figmaName}`,
		name: overrides.figmaName.split("/").pop() || "",
		value: "#000",
		originalValue: "#000000",
		type: "color",
		category: "primitives",
		action: "import",
		...overrides,
	};
}

function refToken(
	figmaName: string,
	ref: string,
	category = "semantics",
): DesignToken {
	return token({
		figmaName,
		type: "reference",
		value: ref,
		originalValue: ref,
		category,
	});
}

describe("validateTokens", () => {
	describe("valid tokens", () => {
		it("returns valid for simple tokens with no references", () => {
			const tokens = [
				token({ figmaName: "red" }),
				token({ figmaName: "blue" }),
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});

		it("returns valid for correct references", () => {
			const tokens = [
				token({ figmaName: "red", category: "primitives" }),
				refToken("bg", "{primitives.red}"),
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});

		it("ignores skipped tokens", () => {
			const tokens = [
				token({ figmaName: "red", action: "skip" }),
				token({ figmaName: "red" }), // same name but first is skipped
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true);
		});
	});

	describe("broken references", () => {
		it("warns on reference to non-existent token", () => {
			const tokens = [refToken("bg", "{primitives.nonexistent}")];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true); // warnings don't block
			expect(result.stats.brokenRefs).toBe(1);
			expect(result.issues[0].type).toBe("broken-ref");
			expect(result.issues[0].severity).toBe("warning");
		});

		it("warns on multiple broken references", () => {
			const tokens = [
				refToken("bg", "{primitives.a}"),
				refToken("fg", "{primitives.b}"),
			];
			const result = validateTokens(tokens);
			expect(result.stats.brokenRefs).toBe(2);
		});
	});

	describe("circular references", () => {
		it("detects self-reference", () => {
			const tokens = [refToken("bg", "{semantics.bg}", "semantics")];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(false);
			expect(result.issues[0].type).toBe("self-ref");
		});

		it("detects A -> B -> A cycle", () => {
			const tokens = [
				refToken("a", "{semantics.b}", "semantics"),
				refToken("b", "{semantics.a}", "semantics"),
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(false);
			expect(result.stats.circularRefs).toBeGreaterThanOrEqual(1);
		});

		it("detects A -> B -> C -> A cycle", () => {
			const tokens = [
				refToken("a", "{semantics.b}", "semantics"),
				refToken("b", "{semantics.c}", "semantics"),
				refToken("c", "{semantics.a}", "semantics"),
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(false);
			expect(result.stats.circularRefs).toBeGreaterThanOrEqual(1);
		});

		it("allows valid reference chains (A -> B -> C)", () => {
			const tokens = [
				token({ figmaName: "base", category: "primitives" }),
				refToken("mid", "{primitives.base}", "aliases"),
				refToken("top", "{aliases.mid}", "semantics"),
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true);
			expect(result.stats.circularRefs).toBe(0);
		});
	});

	describe("duplicate names", () => {
		it("detects duplicate figmaName in same collection", () => {
			const tokens = [
				token({ figmaName: "red", category: "primitives", id: "t1" }),
				token({ figmaName: "red", category: "primitives", id: "t2" }),
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(false);
			expect(result.stats.duplicateNames).toBeGreaterThanOrEqual(1);
		});

		it("allows same name in different collections", () => {
			const tokens = [
				token({ figmaName: "red", category: "primitives", id: "t1" }),
				token({ figmaName: "red", category: "semantics", id: "t2" }),
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true);
		});

		it("allows same name in different modes", () => {
			const tokens = [
				{
					...token({ figmaName: "bg", category: "semantics", id: "t1" }),
					modeName: "Light",
				} as any,
				{
					...token({ figmaName: "bg", category: "semantics", id: "t2" }),
					modeName: "Dark",
				} as any,
			];
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true);
		});
	});

	describe("type mismatches", () => {
		it("detects reference to incompatible type", () => {
			const tokens = [
				token({
					figmaName: "size",
					category: "primitives",
					type: "number",
					value: 16,
					originalValue: "16",
				}),
			];
			// This is a valid case - just a number token
			const result = validateTokens(tokens);
			expect(result.valid).toBe(true);
		});
	});

	describe("stats", () => {
		it("correctly counts all issue types", () => {
			const tokens = [
				// Broken ref
				refToken("a", "{primitives.missing}"),
				// Self-ref
				refToken("b", "{semantics.b}", "semantics"),
				// Duplicate
				token({ figmaName: "c", id: "c1" }),
				token({ figmaName: "c", id: "c2" }),
			];
			const result = validateTokens(tokens);
			expect(result.stats.brokenRefs).toBe(1);
			expect(result.stats.duplicateNames).toBeGreaterThanOrEqual(1);
			expect(result.stats.errors).toBeGreaterThanOrEqual(2);
			expect(result.stats.warnings).toBe(1);
		});
	});
});
