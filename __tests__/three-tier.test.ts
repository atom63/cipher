import { describe, expect, test } from "vitest";
import { SHADE_STEPS } from "../generators/color-scale";
import type { BrandConfig } from "../generators/three-tier";
import {
	generateDesignSystem,
	generateThreeTierSystem,
} from "../generators/three-tier";

const defaultConfig: BrandConfig = {
	primary: "#3B82F6",
};

describe("generateDesignSystem", () => {
	test("generates tokens for selected layers", () => {
		const result = generateDesignSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("semantics");
		// Default mode is "semantic" — no abstractions
		expect(categories).not.toContain("abstractions");
	});

	test("stats match actual token counts", () => {
		const result = generateDesignSystem(defaultConfig);
		expect(result.stats.totalCount).toBe(result.tokens.length);

		const primitives = result.tokens.filter((t) => t.category === "primitives");
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const semantics = result.tokens.filter((t) => t.category === "semantics");

		expect(primitives.length).toBe(result.stats.primitiveCount);
		expect(abstractions.length).toBe(result.stats.abstractionCount);
		expect(semantics.length).toBe(result.stats.semanticCount);
	});

	test("all tokens have action 'import'", () => {
		const result = generateDesignSystem(defaultConfig);
		for (const token of result.tokens) {
			expect(token.action).toBe("import");
		}
	});

	test("all tokens have unique IDs", () => {
		const result = generateDesignSystem(defaultConfig);
		const ids = result.tokens.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

// =========================================================================
// Primitives-only mode
// =========================================================================

describe("primitives-only mode", () => {
	test("generates only primitives", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
		});
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toEqual(new Set(["primitives"]));
		expect(result.stats.abstractionCount).toBe(0);
		expect(result.stats.semanticCount).toBe(0);
	});

	test("creates brand and gray scales with white/black", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
		});
		const names = result.tokens.map((t) => t.figmaName);

		for (const step of SHADE_STEPS) {
			expect(names).toContain(`brand/${step}`);
			expect(names).toContain(`zinc/${step}`);
		}
		expect(names).toContain("white");
		expect(names).toContain("black");
	});

	test("primitive values are direct colors, not references", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
		});
		for (const token of result.tokens) {
			expect(token.originalValue).not.toMatch(/^\{/);
		}
	});

	test("uses custom gray name", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "primitives",
			grayName: "slate",
		});
		const names = result.tokens.map((t) => t.figmaName);
		expect(names).toContain("slate/500");
		expect(names).not.toContain("zinc/500");
	});
});

// =========================================================================
// Semantic mode (primitives + semantics, no abstractions)
// =========================================================================

describe("semantic mode (default)", () => {
	test("generates primitives and semantics, no abstractions", () => {
		const result = generateDesignSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("semantics");
		expect(categories).not.toContain("abstractions");
		expect(result.stats.abstractionCount).toBe(0);
	});

	test("semantic tokens reference primitives directly", () => {
		const result = generateDesignSystem(defaultConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		for (const token of semantics) {
			expect(token.originalValue).toMatch(/^\{primitives\./);
		}
	});

	test("background/default references gray scale", () => {
		const result = generateDesignSystem(defaultConfig);
		const bgDefaults = result.tokens.filter(
			(t) => t.category === "semantics" && t.figmaName === "background/default",
		);
		const light = bgDefaults.find((t) => (t as any).modeName === "Light");
		const dark = bgDefaults.find((t) => (t as any).modeName === "Dark");
		expect(light?.originalValue).toBe("{primitives.zinc.50}");
		expect(dark?.originalValue).toBe("{primitives.zinc.950}");
	});

	test("has Light/Dark mode entries by default", () => {
		const result = generateDesignSystem(defaultConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const lightTokens = semantics.filter(
			(t) => (t as any).modeName === "Light",
		);
		const darkTokens = semantics.filter((t) => (t as any).modeName === "Dark");
		expect(lightTokens.length).toBe(darkTokens.length);
		expect(lightTokens.length).toBeGreaterThan(0);
	});

	test("single mode when darkMode is false", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		for (const token of semantics) {
			expect((token as any).modeName).toBeUndefined();
		}
	});

	test("includes accent semantics when secondary provided", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);
		expect(names).toContain("background/accent");
		expect(names).toContain("foreground/accent");
	});
});

// =========================================================================
// Three-tier mode (primitives + abstractions + semantics)
// =========================================================================

describe("three-tier mode", () => {
	const threeTierConfig: BrandConfig = {
		primary: "#3B82F6",
		layers: "three-tier",
	};

	test("generates all three layers", () => {
		const result = generateDesignSystem(threeTierConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("abstractions");
		expect(categories).toContain("semantics");
	});

	test("abstractions reference primitives", () => {
		const result = generateDesignSystem(threeTierConfig);
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		for (const token of abstractions) {
			expect(token.originalValue).toMatch(/^\{primitives\./);
		}
	});

	test("semantics reference abstractions (not primitives)", () => {
		const result = generateDesignSystem(threeTierConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		for (const token of semantics) {
			// Should reference abstractions or primitives.white/black
			expect(token.originalValue).toMatch(/^\{(abstractions|primitives)\./);
		}
		// At least some should reference abstractions
		const absRefs = semantics.filter((t) =>
			t.originalValue.toString().startsWith("{abstractions."),
		);
		expect(absRefs.length).toBeGreaterThan(0);
	});

	test("primary abstractions point to brand scale", () => {
		const result = generateDesignSystem(threeTierConfig);
		const primary500 = result.tokens.find(
			(t) => t.category === "abstractions" && t.figmaName === "primary/500",
		);
		expect(primary500?.originalValue).toBe("{primitives.brand.500}");
	});

	test("creates accent abstractions when secondary provided", () => {
		const result = generateDesignSystem({
			...threeTierConfig,
			secondary: "#10B981",
		});
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);
		expect(names).toContain("accent/500");
	});

	test("no accent abstractions without secondary", () => {
		const result = generateDesignSystem(threeTierConfig);
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);
		expect(names).not.toContain("accent/500");
	});
});

// =========================================================================
// Token compatibility
// =========================================================================

describe("token compatibility", () => {
	test("all tokens have required DesignToken fields", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			layers: "three-tier",
		});

		for (const token of result.tokens) {
			expect(token.id).toBeTruthy();
			expect(token.name).toBeTruthy();
			expect(token.figmaName).toBeTruthy();
			expect(token.value).toBeDefined();
			expect(token.originalValue).toBeTruthy();
			expect(token.type).toBeTruthy();
			expect(token.category).toBeTruthy();
			expect(token.action).toBe("import");
		}
	});

	test("reference values use correct format for import handler", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "three-tier",
		});
		const refs = result.tokens.filter(
			(t) =>
				typeof t.originalValue === "string" && t.originalValue.startsWith("{"),
		);

		expect(refs.length).toBeGreaterThan(0);
		for (const token of refs) {
			// Format: {collection.path} or {collection.path.step}
			expect(token.originalValue).toMatch(/^\{[a-z]+\.[a-z-]+(\.\d+)?\}$/);
		}
	});
});

// =========================================================================
// Backwards compatibility
// =========================================================================

describe("generateThreeTierSystem (deprecated)", () => {
	test("still works and produces three-tier output", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("abstractions");
		expect(categories).toContain("semantics");
	});
});
