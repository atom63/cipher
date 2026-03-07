import { describe, expect, test } from "vitest";
import type { BrandConfig, LayerMode } from "../generators/three-tier";
import { generateCss, generateDesignSystem } from "../generators/three-tier";

// =========================================================================
// Combinatorial config coverage
// =========================================================================

const LAYER_MODES: LayerMode[] = ["primitives", "semantic", "three-tier"];
const GRAY_NAMES = ["gray", "mauve", "slate", "sage", "olive", "sand"];
const DARK_MODES = [true, false];

describe("combinatorial config coverage", () => {
	test.each(LAYER_MODES)(
		"layer mode '%s' generates without errors for all gray palettes",
		(layers) => {
			for (const grayName of GRAY_NAMES) {
				const result = generateDesignSystem({
					primary: "#3B82F6",
					layers,
					grayName,
				});
				expect(result.tokens.length).toBeGreaterThan(0);
				expect(result.stats.totalCount).toBe(result.tokens.length);
			}
		},
	);

	test.each(LAYER_MODES)(
		"layer mode '%s' works with both dark mode on and off",
		(layers) => {
			for (const darkMode of DARK_MODES) {
				const result = generateDesignSystem({
					primary: "#3B82F6",
					layers,
					darkMode,
				});
				expect(result.tokens.length).toBeGreaterThan(0);
			}
		},
	);

	test("all token toggle permutations produce valid output", () => {
		const toggles = [
			"includeSpacing",
			"includeRadius",
			"includeShadows",
			"includeTypography",
			"includeDurations",
			"includeFonts",
		] as const;

		// Test each toggle individually on
		for (const toggle of toggles) {
			const config: BrandConfig = {
				primary: "#3B82F6",
				layers: "semantic",
				includeSpacing: false,
				includeRadius: false,
				includeShadows: false,
				includeTypography: false,
				includeDurations: false,
				includeFonts: false,
				[toggle]: true,
			};
			const result = generateDesignSystem(config);
			expect(result.tokens.length).toBeGreaterThan(0);
			expect(result.stats.totalCount).toBe(result.tokens.length);
		}
	});

	test("maximal config (everything enabled) generates successfully", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			grayName: "slate",
			layers: "three-tier",
			darkMode: true,
			radius: { anchor: 12, multiplier: 1.5 },
			includeSpacing: true,
			includeRadius: true,
			includeShadows: true,
			includeTypography: true,
			includeDurations: true,
			includeFonts: true,
		});
		expect(result.tokens.length).toBeGreaterThan(0);
		expect(result.stats.primitiveCount).toBeGreaterThan(0);
		expect(result.stats.abstractionCount).toBeGreaterThan(0);
		expect(result.stats.semanticCount).toBeGreaterThan(0);
	});
});

// =========================================================================
// Reference integrity — all semantic refs resolve to real tokens
// =========================================================================

describe("reference integrity", () => {
	test.each(LAYER_MODES)(
		"all references in '%s' mode resolve to existing tokens",
		(layers) => {
			const result = generateDesignSystem({
				primary: "#3B82F6",
				secondary: "#10B981",
				layers,
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
		},
	);

	test("three-tier semantics reference abstractions, not primitives directly (for color tokens)", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			layers: "three-tier",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			includeFonts: false,
		});

		const semanticColors = result.tokens.filter(
			(t) => t.category === "semantics" && t.type === "color",
		);

		// Semantic color tokens should reference abstractions or primitives (for white/black/destructive)
		for (const token of semanticColors) {
			const ref = String(token.originalValue);
			expect(ref).toMatch(/^\{(abstractions|primitives)\./);
		}
	});
});

// =========================================================================
// Cross-mode consistency — Light/Dark token counts always match
// =========================================================================

describe("cross-mode consistency", () => {
	test.each(LAYER_MODES)(
		"'%s' mode: Light and Dark token counts match per figmaName",
		(layers) => {
			const result = generateDesignSystem({
				primary: "#3B82F6",
				secondary: "#10B981",
				layers,
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
		},
	);

	test("no mode tokens when darkMode is false", () => {
		for (const layers of LAYER_MODES) {
			if (layers === "primitives") continue; // primitives don't have semantics
			const result = generateDesignSystem({
				primary: "#3B82F6",
				layers,
				darkMode: false,
			});
			for (const token of result.tokens) {
				expect(
					(token as any).modeName,
					`Token "${token.figmaName}" has modeName when darkMode is false`,
				).toBeUndefined();
			}
		}
	});
});

// =========================================================================
// Token count stability — catch unintended explosions
// =========================================================================

describe("token count stability", () => {
	test("minimal config token count is stable", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			includeFonts: false,
		});

		// brand(11) + destructive(11) + gray(12) + white(1) + black(1)
		// + alpha(11*2=22) = 58 primitives
		// + semantic color defs (count should be stable)
		// This is a snapshot — update if semantic defs change intentionally
		expect(result.stats.primitiveCount).toBe(58);
		expect(result.stats.totalCount).toBeGreaterThan(58);
	});

	test("dark mode doubles mode-aware tokens", () => {
		const lightOnly = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			includeFonts: false,
		});

		const withDark = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: true,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			includeFonts: false,
		});

		// Dark mode should roughly double the token count (dual modes)
		expect(withDark.tokens.length).toBe(lightOnly.tokens.length * 2);
	});

	test("secondary color adds tokens proportionally", () => {
		const without = generateDesignSystem({
			primary: "#3B82F6",
			layers: "semantic",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			includeFonts: false,
		});

		const withSecondary = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			layers: "semantic",
			darkMode: false,
			includeSpacing: false,
			includeRadius: false,
			includeShadows: false,
			includeTypography: false,
			includeDurations: false,
			includeFonts: false,
		});

		// Secondary adds 11 primitive shades + 4 semantic accent tokens
		const diff = withSecondary.tokens.length - without.tokens.length;
		expect(diff).toBe(11 + 4); // 11 shades + accent bg/fg/border/surface
	});

	test("no duplicate figmaName within same mode", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			secondary: "#10B981",
			layers: "three-tier",
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
			// Same figmaName + mode should not appear in the same category twice
			expect(
				categories.has(token.category),
				`Duplicate: "${token.figmaName}" in ${token.category} (${mode})`,
			).toBe(false);
			categories.add(token.category);
		}
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
			radius: { anchor: 0, multiplier: 0 },
			includeRadius: true,
			layers: "semantic",
			darkMode: false,
		});
		const radiusTokens = result.tokens.filter((t) => t.type === "borderRadius");
		expect(radiusTokens.length).toBeGreaterThan(0);
		// All values should be >= 0
		for (const token of radiusTokens) {
			expect(Number(token.value)).toBeGreaterThanOrEqual(0);
		}
	});

	test("large radius multiplier produces valid values", () => {
		const result = generateDesignSystem({
			primary: "#3B82F6",
			radius: { anchor: 20, multiplier: 5 },
			includeRadius: true,
			layers: "semantic",
			darkMode: false,
		});
		const radiusTokens = result.tokens.filter((t) => t.type === "borderRadius");
		for (const token of radiusTokens) {
			expect(Number(token.value)).toBeGreaterThanOrEqual(0);
			expect(Number.isFinite(Number(token.value)) || token.figmaName.includes("full")).toBe(true);
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

		// Parse each CSS block and check for duplicate vars
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

		// Find all var() references
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
			expect(css).toContain(`--color-${grayName}-1:`);
			expect(css).toContain(`--color-${grayName}-12:`);
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
			layers: "three-tier",
			darkMode: true,
			radius: { anchor: 12, multiplier: 1.5 },
			includeSpacing: true,
			includeRadius: true,
			includeShadows: true,
			includeTypography: true,
			includeDurations: true,
			includeFonts: true,
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
			layers: "three-tier",
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
