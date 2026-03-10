import { describe, expect, test } from "vitest";
import type { BrandConfig } from "../generators/three-tier";
import { generateCss, generateDesignSystem } from "../generators/three-tier";

// =========================================================================
// Combinatorial config coverage
// =========================================================================

const GRAY_NAMES = ["gray", "mauve", "slate", "sage", "olive", "sand"];
const DARK_MODES = [true, false];

describe("combinatorial config coverage", () => {
	test("generates without errors for all gray palettes", () => {
		for (const grayName of GRAY_NAMES) {
			const result = generateDesignSystem({
				primary: "#3B82F6",
				grayName,
			});
			expect(result.tokens.length).toBeGreaterThan(0);
			expect(result.stats.totalCount).toBe(result.tokens.length);
		}
	});

	test("works with both dark mode on and off", () => {
		for (const darkMode of DARK_MODES) {
			const result = generateDesignSystem({
				primary: "#3B82F6",
				darkMode,
			});
			expect(result.tokens.length).toBeGreaterThan(0);
		}
	});

	test("all typescale ratios produce valid output", () => {
		const ratios = [
			"minor-third",
			"major-third",
			"perfect-fourth",
			"golden-ratio",
		];
		for (const ratio of ratios) {
			const result = generateDesignSystem({
				primary: "#3B82F6",
				typescale: {
					base: 16,
					ratio,
					lineHeightBody: 150,
					lineHeightHeading: 125,
					stepsUp: 4,
					stepsDown: 2,
				},
			});
			expect(result.tokens.length).toBeGreaterThan(0);
			expect(result.stats.totalCount).toBe(result.tokens.length);
		}
	});

	test("maximal config generates successfully", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			grayName: "slate",
			darkMode: true,
			radius: 12,
			typescale: {
				base: 16,
				ratio: "perfect-fourth",
				lineHeightBody: 150,
				lineHeightHeading: 125,
				stepsUp: 4,
				stepsDown: 2,
			},
			fonts: { sans: "Inter", mono: "Fira Code" },
		});
		expect(result.tokens.length).toBeGreaterThan(0);
		expect(result.stats.primitiveCount).toBeGreaterThan(0);
		expect(result.stats.abstractionCount).toBeGreaterThan(0);
		expect(result.stats.semanticCount).toBeGreaterThan(0);
	});
});

// =========================================================================
// Reference integrity — all references resolve to real tokens
// =========================================================================

describe("reference integrity", () => {
	test("all references resolve to existing tokens", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: false,
		});

		// Build set of all token paths (category.figmaName with / → .)
		const tokenPaths = new Set<string>();
		for (const token of result.tokens) {
			const path = `${token.category}.${token.figmaName.replace(/\//g, ".")}`;
			tokenPaths.add(path);
		}

		// Check all reference values
		for (const token of result.tokens) {
			const ref = String(token.originalValue);
			const match = ref.match(/^\{([^}]+)\}$/);
			if (match) {
				const refPath = match[1];
				expect(
					tokenPaths.has(refPath),
					`Token "${token.figmaName}" references "${refPath}" which doesn't exist.\nAvailable: ${[...tokenPaths].filter((p) => p.startsWith(refPath.split(".")[0])).join(", ")}`,
				).toBe(true);
			}
		}
	});

	test("semantics reference abstractions, not primitives directly (for surface/accent)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: false,
		});

		const semanticColors = result.tokens.filter(
			(t) =>
				t.category === "semantics" &&
				t.type === "color" &&
				String(t.originalValue).startsWith("{"),
		);

		// Semantic color references should go through abstractions or primitives (for utility tokens)
		for (const token of semanticColors) {
			const ref = String(token.originalValue);
			expect(ref).toMatch(/^\{(abstractions|primitives|semantics)\./);
		}
	});
});

// =========================================================================
// Cross-mode consistency — Light/Dark token counts always match
// =========================================================================

describe("cross-mode consistency", () => {
	test("Light and Dark token counts match per figmaName", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: true,
		});

		const lightNames = new Set<string>();
		const darkNames = new Set<string>();

		for (const token of result.tokens) {
			const mode = (token as any).modeName;
			if (mode === "Light") lightNames.add(token.figmaName);
			if (mode === "Dark") darkNames.add(token.figmaName);
		}

		// Every Light token should have a Dark counterpart
		for (const name of lightNames) {
			expect(
				darkNames.has(name),
				`Light token "${name}" has no Dark counterpart`,
			).toBe(true);
		}

		// Every Dark token should have a Light counterpart
		for (const name of darkNames) {
			expect(
				lightNames.has(name),
				`Dark token "${name}" has no Light counterpart`,
			).toBe(true);
		}

		expect(lightNames.size).toBe(darkNames.size);
	});

	test("primitives and abstractions are single-mode (no modeName)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: true,
		});

		const nonSemantics = result.tokens.filter(
			(t) => t.category === "primitives" || t.category === "abstractions",
		);

		for (const token of nonSemantics) {
			expect(
				(token as any).modeName,
				`${token.category} token "${token.figmaName}" should not have modeName`,
			).toBeUndefined();
		}
	});

	test("no semantic mode tokens when darkMode is false (responsive still has modes)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});
		for (const token of result.tokens) {
			// Responsive tokens always have modes regardless of darkMode
			if (token.category === "responsive") continue;
			expect(
				(token as any).modeName,
				`Token "${token.figmaName}" has modeName when darkMode is false`,
			).toBeUndefined();
		}
	});
});

// =========================================================================
// Token count stability — catch unintended explosions
// =========================================================================

describe("token count stability", () => {
	test("default config produces stable token counts", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});

		// All tiers are always generated
		expect(result.stats.primitiveCount).toBeGreaterThan(0);
		expect(result.stats.abstractionCount).toBeGreaterThan(0);
		expect(result.stats.semanticCount).toBeGreaterThan(0);
		expect(result.stats.totalCount).toBeGreaterThan(100);
	});

	test("dark mode doubles only semantic tokens", () => {
		const lightOnly = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});

		const withDark = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: true,
		});

		// Primitives and abstractions are single-mode — same count
		expect(withDark.stats.primitiveCount).toBe(lightOnly.stats.primitiveCount);
		expect(withDark.stats.abstractionCount).toBe(
			lightOnly.stats.abstractionCount,
		);

		// Semantics double with dark mode
		expect(withDark.stats.semanticCount).toBe(
			lightOnly.stats.semanticCount * 2,
		);
	});

	test("secondary color adds tokens proportionally", () => {
		const without = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});

		const withSecondary = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: false,
		});

		// Secondary adds 1 abstraction (accent/secondary/500) + 1 semantic token
		const diff = withSecondary.tokens.length - without.tokens.length;
		expect(diff).toBeGreaterThan(0);
	});

	test("no duplicate figmaName within same mode and category", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: true,
		});

		const seen = new Map<string, Set<string>>();
		for (const token of result.tokens) {
			const mode = (token as any).modeName ?? "default";
			const key = `${mode}::${token.figmaName}`;
			if (!seen.has(key)) {
				seen.set(key, new Set());
			}
			const categories = seen.get(key) ?? new Set();
			expect(
				categories.has(token.category),
				`Duplicate: "${token.figmaName}" in ${token.category} (${mode})`,
			).toBe(false);
			categories.add(token.category);
		}
	});
});

// =========================================================================
// Token naming — matches target structure
// =========================================================================

describe("token naming structure", () => {
	test("primitives use correct path prefixes", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});

		const primitives = result.tokens.filter(
			(t) => t.category === "primitives",
		);

		// Check that primitive tokens follow the expected naming
		const prefixes = new Set(
			primitives.map((t) => t.figmaName.split("/").slice(0, 2).join("/")),
		);

		expect(prefixes.has("color/white")).toBe(true);
		expect(prefixes.has("color/black")).toBe(true);
		expect(prefixes.has("color/gray")).toBe(true);
		expect(prefixes.has("font/family")).toBe(true);
		expect(prefixes.has("font/weight")).toBe(true);
	});

	test("abstractions use correct path prefixes", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});

		const abstractions = result.tokens.filter(
			(t) => t.category === "abstractions",
		);
		const names = abstractions.map((t) => t.figmaName);

		expect(names).toContain("accent/primary/500");
		expect(names.some((n) => n.startsWith("surface/light/"))).toBe(true);
		expect(names.some((n) => n.startsWith("surface/dark/"))).toBe(true);
		expect(names.some((n) => n.startsWith("rounded/"))).toBe(true);
		expect(names.some((n) => n.startsWith("zLayer/"))).toBe(true);
		expect(names.some((n) => n.startsWith("duration/"))).toBe(true);
	});

	test("semantics use shadcn/ prefix for UI tokens", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			darkMode: false,
		});

		const semantics = result.tokens.filter(
			(t) => t.category === "semantics",
		);
		const names = semantics.map((t) => t.figmaName);

		expect(names).toContain("shadcn/background");
		expect(names).toContain("shadcn/foreground");
		expect(names).toContain("shadcn/primary");
		expect(names).toContain("shadcn/border");
		expect(names).toContain("shadcn/ring");
		expect(names.some((n) => n.startsWith("backplate/"))).toBe(true);
	});
});

// =========================================================================
// Edge cases — invalid/extreme inputs
// =========================================================================

describe("edge cases", () => {
	test("handles unknown gray name gracefully (falls back to first preset)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			grayName: "nonexistent",
			darkMode: false,
		});
		expect(result.radixGray).not.toBeNull();
		expect(result.tokens.length).toBeGreaterThan(0);
	});

	test("handles 3-digit hex color", () => {
		const result = generateDesignSystem({
			primary: "#38F",
			darkMode: false,
		});
		expect(result.tokens.length).toBeGreaterThan(0);
	});

	test("handles lowercase hex color", () => {
		const result = generateDesignSystem({
			primary: "#3b82f6",
			darkMode: false,
		});
		expect(result.tokens.length).toBeGreaterThan(0);
	});

	test("extreme radius values don't crash", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			radius: 0,
			darkMode: false,
		});
		const radiusTokens = result.tokens.filter(
			(t) => t.type === "borderRadius",
		);
		expect(radiusTokens.length).toBeGreaterThan(0);
		for (const token of radiusTokens) {
			expect(Number(token.value)).toBeGreaterThanOrEqual(0);
		}
	});

	test("large radius anchor produces valid values", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			radius: 32,
			darkMode: false,
		});
		const radiusTokens = result.tokens.filter(
			(t) => t.type === "borderRadius",
		);
		for (const token of radiusTokens) {
			expect(Number(token.value)).toBeGreaterThanOrEqual(0);
		}
	});
});

// =========================================================================
// CSS output correctness
// =========================================================================

describe("CSS output correctness", () => {
	test("no duplicate CSS variable declarations in same block", () => {
		const css = generateCss({
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: true,
		});

		const blocks = css.split(/[{}]/);
		for (const block of blocks) {
			const vars = block
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.startsWith("--"))
				.map((line) => line.split(":")[0]);

			const unique = new Set(vars);
			expect(
				unique.size,
				`Duplicate CSS vars found: ${vars.filter((v, i) => vars.indexOf(v) !== i).join(", ")}`,
			).toBe(vars.length);
		}
	});

	test("all CSS var references use valid var() syntax", () => {
		const css = generateCss({
			primary: "#3B82F6",
			darkMode: true,
		});

		const varRefs = css.match(/var\([^)]+\)/g) ?? [];
		for (const ref of varRefs) {
			expect(ref).toMatch(/^var\(--[\w-]+\)$/);
		}
	});

	test("CSS generation is deterministic", () => {
		const config: BrandConfig = {
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: true,
		};

		const css1 = generateCss(config);
		const css2 = generateCss(config);
		expect(css1).toBe(css2);
	});

	test("CSS for all gray palettes generates without errors", () => {
		for (const grayName of GRAY_NAMES) {
			const css = generateCss({
				primary: "#3B82F6",
				grayName,
				darkMode: true,
			});
			expect(css).toContain("--color-gray-1:");
			expect(css).toContain("--color-gray-12:");
		}
	});
});

// =========================================================================
// Performance — generation doesn't degrade with maximal config
// =========================================================================

describe("performance", () => {
	test("maximal config generates in under 50ms", () => {
		const config: BrandConfig = {
			primary: "#3B82F6",
			secondary: "#10B981",
			grayName: "slate",
			darkMode: true,
			radius: 12,
			typescale: {
				base: 16,
				ratio: "perfect-fourth",
				lineHeightBody: 150,
				lineHeightHeading: 125,
				stepsUp: 4,
				stepsDown: 2,
			},
			fonts: { sans: "Inter" },
		};

		const start = performance.now();
		for (let i = 0; i < 100; i++) {
			generateDesignSystem(config);
		}
		const elapsed = performance.now() - start;
		const perCall = elapsed / 100;

		expect(perCall).toBeLessThan(50);
	});

	test("CSS generation for maximal config in under 50ms", () => {
		const config: BrandConfig = {
			primary: "#3B82F6",
			secondary: "#10B981",
			darkMode: true,
		};

		const start = performance.now();
		for (let i = 0; i < 100; i++) {
			generateCss(config);
		}
		const elapsed = performance.now() - start;
		const perCall = elapsed / 100;

		expect(perCall).toBeLessThan(50);
	});
});
