import { describe, expect, test } from "vitest";
import type { BrandConfig } from "../generators/three-tier";
import { generateDesignSystem } from "../generators/three-tier";
import { SHADOW_SCALE } from "../generators/token-presets";

const defaultConfig: BrandConfig = {
	primary: "#3B82F6",
};

const _configWithSecondary: BrandConfig = {
	primary: "#3B82F6",
	secondary: "#8B5CF6",
};

// =========================================================================
// Helper: recursively collect all leaf style definitions (objects with id + type)
// Mirrors the logic of processStyleGroup in import-handler.ts
// =========================================================================

interface StyleLeaf {
	data: Record<string, any>;
	path: string;
}

function collectStyleLeaves(
	obj: Record<string, any>,
	parentPath = "",
): StyleLeaf[] {
	const leaves: StyleLeaf[] = [];
	for (const [key, value] of Object.entries(obj)) {
		const fullPath = parentPath ? `${parentPath}/${key}` : key;
		if (value && typeof value === "object" && "id" in value && "type" in value) {
			leaves.push({ path: fullPath, data: value });
		} else if (value && typeof value === "object") {
			leaves.push(...collectStyleLeaves(value, fullPath));
		}
	}
	return leaves;
}

// =========================================================================
// Top-level styles structure
// =========================================================================

describe("generateStyles — structure", () => {
	test("styles object has paint, text, effect keys", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		expect(styles).toHaveProperty("paint");
		expect(styles).toHaveProperty("text");
		expect(styles).toHaveProperty("effect");
	});

	test("no empty top-level style categories", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		for (const category of ["paint", "text", "effect"]) {
			const leaves = collectStyleLeaves(styles[category]);
			expect(leaves.length).toBeGreaterThan(0);
		}
	});
});

// =========================================================================
// Every leaf has id + type (import-handler compatibility)
// =========================================================================

describe("generateStyles — import-handler compatibility", () => {
	test("every paint leaf has id and type", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.paint);
		expect(leaves.length).toBeGreaterThan(0);
		for (const leaf of leaves) {
			expect(leaf.data).toHaveProperty("id");
			expect(leaf.data).toHaveProperty("type");
			expect(typeof leaf.data.id).toBe("string");
			expect(leaf.data.id.length).toBeGreaterThan(0);
		}
	});

	test("every text leaf has id and type", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.text);
		expect(leaves.length).toBeGreaterThan(0);
		for (const leaf of leaves) {
			expect(leaf.data).toHaveProperty("id");
			expect(leaf.data).toHaveProperty("type");
			expect(typeof leaf.data.id).toBe("string");
			expect(leaf.data.id.length).toBeGreaterThan(0);
		}
	});

	test("every effect leaf has id and type", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.effect);
		expect(leaves.length).toBeGreaterThan(0);
		for (const leaf of leaves) {
			expect(leaf.data).toHaveProperty("id");
			expect(leaf.data).toHaveProperty("type");
			expect(typeof leaf.data.id).toBe("string");
			expect(leaf.data.id.length).toBeGreaterThan(0);
		}
	});

	test("all style leaf ids are unique across all categories", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const allIds: string[] = [];
		for (const category of ["paint", "text", "effect"]) {
			const leaves = collectStyleLeaves(styles[category]);
			allIds.push(...leaves.map((l) => l.data.id));
		}
		expect(new Set(allIds).size).toBe(allIds.length);
	});
});

// =========================================================================
// Paint styles
// =========================================================================

describe("generateStyles — paint", () => {
	test("paint styles are nested under semantics", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		expect(styles.paint).toHaveProperty("semantics");
	});

	test("paint leaves have type 'color' and fills array", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.paint);
		for (const leaf of leaves) {
			expect(leaf.data.type).toBe("color");
			expect(Array.isArray(leaf.data.fills)).toBe(true);
			expect(leaf.data.fills.length).toBeGreaterThan(0);
		}
	});

	test("solid paint fills have boundVariable with variableName and collectionName", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.paint);
		for (const leaf of leaves) {
			const fill = leaf.data.fills[0];
			if (fill.type === "solid") {
				expect(fill.boundVariable).toBeDefined();
				expect(fill.boundVariable.variableName).toBeDefined();
				expect(fill.boundVariable.collectionName).toBe("semantics");
			} else if (fill.type === "linear") {
				// Gradient fills bind variables on each stop
				expect(fill.gradientStops.length).toBe(2);
				for (const stop of fill.gradientStops) {
					expect(stop.boundVariable).toBeDefined();
					expect(stop.boundVariable.variableName).toBeDefined();
					expect(stop.boundVariable.collectionName).toBe("semantics");
				}
			}
		}
	});

	test("accent paint style uses gradient fill with 80% fill-level opacity", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const accentLeaf = collectStyleLeaves(styles.paint).find(
			(l) => l.path === "semantics/accent",
		);
		expect(accentLeaf).toBeDefined();
		const fill = accentLeaf?.data.fills[0];
		expect(fill.type).toBe("linear");
		expect(fill.opacity).toBe(0.8);
		expect(fill.gradientStops).toHaveLength(2);
		for (const stop of fill.gradientStops) {
			expect(stop.boundVariable.variableName).toBe("accent");
		}
	});

	test("includes core semantic colors", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.paint);
		const names = leaves.map((l) => l.path);
		// Core semantic tokens should be present as paint styles
		const expected = [
			"semantics/background",
			"semantics/foreground",
			"semantics/primary",
			"semantics/primary-foreground",
			"semantics/border",
			"semantics/ring",
			"semantics/muted",
			"semantics/muted-foreground",
		];
		for (const name of expected) {
			expect(names).toContain(name);
		}
	});
});

// =========================================================================
// Text styles
// =========================================================================

describe("generateStyles — text", () => {
	test("text styles are nested under primary, secondary, tertiary", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		expect(styles.text).toHaveProperty("primary");
		expect(styles.text).toHaveProperty("secondary");
		expect(styles.text).toHaveProperty("tertiary");
	});

	test("text leaves have type 'text' and required font properties", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.text);
		for (const leaf of leaves) {
			expect(leaf.data.type).toBe("text");
			expect(leaf.data.fontFamily).toBeDefined();
			expect(leaf.data.fontStyle).toBeDefined();
			expect(leaf.data.fontSize).toMatch(/^\d+px$/);
			expect(leaf.data.lineHeight).toMatch(/^\d+px$/);
		}
	});

	test("generates one variant per typescale step per font family", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.text);
		const names = leaves.map((l) => l.path);

		// 9 steps × 1 variant × 3 families = 27
		const expectedSteps = ["5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"];
		for (const family of ["primary", "secondary", "tertiary"]) {
			for (const step of expectedSteps) {
				expect(names).toContain(`${family}/${step}`);
			}
		}
		// No strong variants
		expect(names.some((n) => n.endsWith("-strong"))).toBe(false);
	});

	test("all text styles use Regular fontStyle", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.text);
		for (const leaf of leaves) {
			expect(leaf.data.fontStyle).toBe("Regular");
		}
	});

	test("text styles bind fontSize to responsive collection variables", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.text);
		for (const leaf of leaves) {
			expect(leaf.data.fontSizeBoundVariable).toBeDefined();
			expect(leaf.data.fontSizeBoundVariable.collectionName).toBe("responsive");
			expect(leaf.data.fontSizeBoundVariable.variableName).toMatch(
				/^typography\/.+\/font\/size$/,
			);
		}
	});

	test("text styles bind lineHeight to responsive collection variables", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.text);
		for (const leaf of leaves) {
			expect(leaf.data.lineHeightBoundVariable).toBeDefined();
			expect(leaf.data.lineHeightBoundVariable.collectionName).toBe("responsive");
			expect(leaf.data.lineHeightBoundVariable.variableName).toMatch(
				/^typography\/.+\/line\/height$/,
			);
		}
	});

	test("each font family binds to its corresponding abstraction variable", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const familyMap: Record<string, string> = {
			primary: "font/family/primary",
			secondary: "font/family/secondary",
			tertiary: "font/family/tertiary",
		};

		for (const [familyKey, varName] of Object.entries(familyMap)) {
			const leaves = collectStyleLeaves(styles.text[familyKey]);
			expect(leaves.length).toBeGreaterThan(0);
			for (const leaf of leaves) {
				expect(leaf.data.fontFamilyBoundVariable).toBeDefined();
				expect(leaf.data.fontFamilyBoundVariable.variableName).toBe(varName);
				expect(leaf.data.fontFamilyBoundVariable.collectionName).toBe("abstractions");
			}
		}
	});

	test("text styles do not bind fontWeight (handled by Tailwind natively)", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const leaves = collectStyleLeaves(styles.text);
		for (const leaf of leaves) {
			expect(leaf.data.fontWeightBoundVariable).toBeUndefined();
		}
	});

	test("respects custom font family for primary", () => {
		const config: BrandConfig = {
			primary: "#3B82F6",
			fonts: { sans: "Geist" },
		};
		const { styles } = generateDesignSystem(config);
		const leaves = collectStyleLeaves(styles.text.primary);
		for (const leaf of leaves) {
			expect(leaf.data.fontFamily).toBe("Geist");
		}
	});
});

// =========================================================================
// Effect styles
// =========================================================================

describe("generateStyles — effect", () => {
	test("effect styles include shadow, blur, and backdrop-blur groups", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		expect(styles.effect).toHaveProperty("shadow");
		expect(styles.effect).toHaveProperty("blur");
		expect(styles.effect).toHaveProperty("backdrop-blur");
	});

	test("shadow styles match SHADOW_SCALE levels (0-6)", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		const shadowKeys = Object.keys(SHADOW_SCALE);
		for (const level of shadowKeys) {
			expect(styles.effect.shadow).toHaveProperty(level);
			expect(styles.effect.shadow[level].type).toBe("effect");
			expect(styles.effect.shadow[level].id).toBeDefined();
		}
	});

	test("shadow effects have correct drop-shadow structure", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		// Level 2 has 2 layers
		const shadow2 = styles.effect.shadow["2"];
		expect(shadow2.effects.length).toBe(2);
		for (const eff of shadow2.effects) {
			expect(eff.type).toBe("drop-shadow");
			expect(eff.offsetX).toMatch(/px$/);
			expect(eff.offsetY).toMatch(/px$/);
			expect(eff.radius).toMatch(/px$/);
			expect(eff.spread).toMatch(/px$/);
			expect(eff.color).toMatch(/^rgba\(/);
			expect(eff.visible).toBe(true);
		}
	});

	test("blur styles have layer-blur effects for Tailwind scale", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		for (const key of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"]) {
			const blur = styles.effect.blur[key];
			expect(blur.type).toBe("effect");
			expect(blur.id).toBeDefined();
			expect(blur.effects[0].type).toBe("layer-blur");
			expect(blur.effects[0].radius).toMatch(/px$/);
		}
	});

	test("backdrop-blur styles match blur scale with background-blur type", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		for (const key of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"]) {
			const bb = styles.effect["backdrop-blur"][key];
			expect(bb.type).toBe("effect");
			expect(bb.id).toBeDefined();
			expect(bb.effects[0].type).toBe("background-blur");
		}
	});
});

// =========================================================================
// processStyleGroup simulation — ensures no leaf is missed
// =========================================================================

describe("generateStyles — processStyleGroup simulation", () => {
	test("collectStyleLeaves finds all leaves that processStyleGroup would find", () => {
		const { styles } = generateDesignSystem(defaultConfig);
		let totalLeaves = 0;
		for (const category of ["paint", "text", "effect"]) {
			const leaves = collectStyleLeaves(styles[category]);
			totalLeaves += leaves.length;
		}
		// Should have: paint (shadcn semantics) + text (typescale×3 families) + effect (7 shadow + 7 blur + 7 backdrop)
		// Paint: at least 10 shadcn colors
		// Text: 9 steps × 1 variant × 3 families = 27
		// Effect: 7 + 7 + 7 = 21
		expect(totalLeaves).toBeGreaterThanOrEqual(58);
	});

	test("no nested object without id+type is mistakenly treated as a leaf", () => {
		const { styles } = generateDesignSystem(defaultConfig);

		// Walk the full tree and confirm every object with both id and type
		// is actually a valid style definition (has fills or effects)
		for (const category of ["paint", "text", "effect"]) {
			const leaves = collectStyleLeaves(styles[category]);
			for (const leaf of leaves) {
				const hasContent =
					leaf.data.fills ||
					leaf.data.effects ||
					leaf.data.fontFamily;
				expect(hasContent).toBeTruthy();
			}
		}
	});

	test("no objects without id are silently skipped (regression guard)", () => {
		const { styles } = generateDesignSystem(defaultConfig);

		// Walk every nested value and confirm that any object with 'type'
		// also has 'id' — if not, processStyleGroup would skip it
		function assertAllTypedHaveId(obj: any, path = "") {
			for (const [key, value] of Object.entries(obj)) {
				const fullPath = path ? `${path}/${key}` : key;
				if (value && typeof value === "object" && !Array.isArray(value)) {
					if ("type" in value) {
						expect(value).toHaveProperty(
							"id",
							expect.any(String),
						);
					} else {
						// Recurse into groups
						assertAllTypedHaveId(value, fullPath);
					}
				}
			}
		}

		assertAllTypedHaveId(styles.paint);
		assertAllTypedHaveId(styles.text);
		assertAllTypedHaveId(styles.effect);
	});
});
