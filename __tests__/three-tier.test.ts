import { describe, expect, test } from "vitest";
import { SHADE_STEPS } from "../generators/color-scale";
import type { BrandConfig } from "../generators/three-tier";
import { generateThreeTierSystem } from "../generators/three-tier";

const defaultConfig: BrandConfig = {
	primary: "#3B82F6",
};

describe("generateThreeTierSystem", () => {
	test("generates tokens for all three layers", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const categories = new Set(result.tokens.map((t) => t.category));
		expect(categories).toContain("primitives");
		expect(categories).toContain("abstractions");
		expect(categories).toContain("semantics");
	});

	test("stats match actual token counts", () => {
		const result = generateThreeTierSystem(defaultConfig);
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
		const result = generateThreeTierSystem(defaultConfig);
		for (const token of result.tokens) {
			expect(token.action).toBe("import");
		}
	});

	test("all tokens have unique IDs", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const ids = result.tokens.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("primitives layer", () => {
	test("creates brand and gray scales with white/black", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const primitives = result.tokens.filter((t) => t.category === "primitives");
		const names = primitives.map((t) => t.figmaName);

		// Brand scale
		for (const step of SHADE_STEPS) {
			expect(names).toContain(`brand/${step}`);
		}

		// Gray scale (default name: zinc)
		for (const step of SHADE_STEPS) {
			expect(names).toContain(`zinc/${step}`);
		}

		// White and black
		expect(names).toContain("white");
		expect(names).toContain("black");
	});

	test("primitive values are direct colors, not references", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const primitives = result.tokens.filter((t) => t.category === "primitives");
		for (const token of primitives) {
			expect(token.originalValue).not.toMatch(/^\{/);
		}
	});

	test("uses custom gray name", () => {
		const result = generateThreeTierSystem({
			primary: "#3B82F6",
			grayName: "slate",
		});
		const primitives = result.tokens.filter((t) => t.category === "primitives");
		const names = primitives.map((t) => t.figmaName);
		expect(names).toContain("slate/500");
		expect(names).not.toContain("zinc/500");
	});
});

describe("abstractions layer", () => {
	test("creates primary and neutral aliases", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);

		for (const step of SHADE_STEPS) {
			expect(names).toContain(`primary/${step}`);
			expect(names).toContain(`neutral/${step}`);
		}
	});

	test("abstraction values are references to primitives", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		for (const token of abstractions) {
			expect(token.originalValue).toMatch(/^\{primitives\./);
		}
	});

	test("primary references brand scale", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const primary500 = result.tokens.find(
			(t) => t.category === "abstractions" && t.figmaName === "primary/500",
		);
		expect(primary500?.originalValue).toBe("{primitives.brand.500}");
	});

	test("creates accent aliases when secondary provided", () => {
		const result = generateThreeTierSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
		});
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);
		expect(names).toContain("accent/500");
	});

	test("no accent aliases without secondary", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);
		expect(names).not.toContain("accent/500");
	});
});

describe("semantics layer", () => {
	test("creates background, foreground, border, surface tokens", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);

		expect(names).toContain("background/default");
		expect(names).toContain("foreground/default");
		expect(names).toContain("border/default");
		expect(names).toContain("surface/primary");
	});

	test("semantic tokens have Light and Dark mode entries when darkMode enabled", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const semantics = result.tokens.filter((t) => t.category === "semantics");

		// Each semantic def produces 2 tokens (Light + Dark)
		const lightTokens = semantics.filter(
			(t) => (t as any).modeName === "Light",
		);
		const darkTokens = semantics.filter((t) => (t as any).modeName === "Dark");
		expect(lightTokens.length).toBe(darkTokens.length);
		expect(lightTokens.length).toBeGreaterThan(0);
	});

	test("semantic values reference abstractions", () => {
		const result = generateThreeTierSystem(defaultConfig);
		const bgDefaults = result.tokens.filter(
			(t) => t.category === "semantics" && t.figmaName === "background/default",
		);
		const light = bgDefaults.find((t) => (t as any).modeName === "Light");
		const dark = bgDefaults.find((t) => (t as any).modeName === "Dark");
		expect(light?.originalValue).toBe("{abstractions.neutral.50}");
		expect(dark?.originalValue).toBe("{abstractions.neutral.950}");
	});

	test("no modeName when darkMode is false", () => {
		const result = generateThreeTierSystem({
			primary: "#3B82F6",
			darkMode: false,
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		for (const token of semantics) {
			expect((token as any).modeName).toBeUndefined();
		}
	});

	test("includes accent semantics when secondary provided", () => {
		const result = generateThreeTierSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
		});
		const semantics = result.tokens.filter((t) => t.category === "semantics");
		const names = semantics.map((t) => t.figmaName);
		expect(names).toContain("background/accent");
		expect(names).toContain("foreground/accent");
	});
});

describe("token compatibility", () => {
	test("all tokens have required DesignToken fields", () => {
		const result = generateThreeTierSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
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
		const result = generateThreeTierSystem(defaultConfig);
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
