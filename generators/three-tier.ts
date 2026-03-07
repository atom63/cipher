// Design system token generator
// Flexible layer generation: primitives-only, two-tier, or full three-tier
// Output is DesignToken[] compatible with the existing import handler

import type { ColorValue, DesignToken } from "../types/tokens";
import {
	type ColorScale,
	generateColorScale,
	generateGrayScale,
	rgbToHex,
	SHADE_STEPS,
	type ShadeStep,
} from "./color-scale";

// --- Configuration types ---

/** Which layers to generate */
export type LayerMode =
	| "primitives" // Just raw color scales
	| "semantic" // Primitives + semantics (semantics reference primitives directly)
	| "three-tier"; // Primitives + abstractions + semantics (full indirection)

export interface BrandConfig {
	/** Primary brand color (hex) */
	primary: string;
	/** Secondary/accent brand color (hex, optional) */
	secondary?: string;
	/** Neutral gray palette name (default: "zinc") */
	grayName?: string;
	/** Which layers to generate (default: "semantic") */
	layers?: LayerMode;
	/** Whether to generate light+dark semantic modes (default: true, ignored for "primitives" mode) */
	darkMode?: boolean;
}

export interface GeneratedSystem {
	tokens: DesignToken[];
	primitives: ColorScale[];
	abstractions: AbstractionMapping[];
	stats: {
		primitiveCount: number;
		abstractionCount: number;
		semanticCount: number;
		totalCount: number;
	};
}

interface AbstractionMapping {
	name: string;
	step: ShadeStep;
	pointsTo: { collection: string; path: string };
}

// --- Generator ---

let tokenIdCounter = 0;
function nextId(): string {
	return `gen-${++tokenIdCounter}`;
}

function makeToken(
	figmaName: string,
	value: string | ColorValue,
	category: string,
	opts?: {
		description?: string;
		type?: string;
		originalValue?: string;
	},
): DesignToken {
	const strValue = typeof value === "string" ? value : rgbToHex(value);

	return {
		id: nextId(),
		name: figmaName,
		figmaName,
		value: typeof value === "string" ? value : value,
		originalValue: opts?.originalValue ?? strValue,
		type: (opts?.type ?? "color") as DesignToken["type"],
		category: category as DesignToken["category"],
		action: "import",
		description: opts?.description,
	};
}

// =========================================================================
// Primitives — raw color values
// =========================================================================

function generatePrimitives(
	config: BrandConfig,
	grayName: string,
): { tokens: DesignToken[]; scales: ColorScale[] } {
	const tokens: DesignToken[] = [];

	const brandScale = generateColorScale("brand", config.primary);
	const grayScale = generateGrayScale(grayName, config.primary);
	const scales: ColorScale[] = [grayScale, brandScale];

	if (config.secondary) {
		scales.push(generateColorScale("secondary", config.secondary));
	}

	for (const scale of scales) {
		for (const step of SHADE_STEPS) {
			tokens.push(
				makeToken(`${scale.name}/${step}`, scale.shades[step], "primitives", {
					description: `${scale.name} ${step}`,
					originalValue: scale.hexValues[step],
				}),
			);
		}
	}

	tokens.push(
		makeToken("white", { r: 1, g: 1, b: 1 }, "primitives", {
			originalValue: "#ffffff",
		}),
	);
	tokens.push(
		makeToken("black", { r: 0, g: 0, b: 0 }, "primitives", {
			originalValue: "#000000",
		}),
	);

	return { tokens, scales };
}

// =========================================================================
// Abstractions — indirection layer (primary -> brand, neutral -> gray)
// =========================================================================

function generateAbstractions(
	config: BrandConfig,
	grayName: string,
): { tokens: DesignToken[]; mappings: AbstractionMapping[] } {
	const tokens: DesignToken[] = [];
	const mappings: AbstractionMapping[] = [];

	// Primary -> brand
	for (const step of SHADE_STEPS) {
		const ref = `{primitives.brand.${step}}`;
		tokens.push(
			makeToken(`primary/${step}`, ref, "abstractions", {
				description: `Primary color ${step} (references brand)`,
				originalValue: ref,
				type: "color",
			}),
		);
		mappings.push({
			name: `primary/${step}`,
			step,
			pointsTo: { collection: "primitives", path: `brand/${step}` },
		});
	}

	// Neutral -> gray
	for (const step of SHADE_STEPS) {
		const ref = `{primitives.${grayName}.${step}}`;
		tokens.push(
			makeToken(`neutral/${step}`, ref, "abstractions", {
				description: `Neutral color ${step} (references ${grayName})`,
				originalValue: ref,
				type: "color",
			}),
		);
		mappings.push({
			name: `neutral/${step}`,
			step,
			pointsTo: { collection: "primitives", path: `${grayName}/${step}` },
		});
	}

	// Accent -> secondary
	if (config.secondary) {
		for (const step of SHADE_STEPS) {
			const ref = `{primitives.secondary.${step}}`;
			tokens.push(
				makeToken(`accent/${step}`, ref, "abstractions", {
					description: `Accent color ${step} (references secondary)`,
					originalValue: ref,
					type: "color",
				}),
			);
			mappings.push({
				name: `accent/${step}`,
				step,
				pointsTo: { collection: "primitives", path: `secondary/${step}` },
			});
		}
	}

	return { tokens, mappings };
}

// =========================================================================
// Semantics — contextual tokens (background, foreground, border, surface)
// =========================================================================

interface SemanticDef {
	name: string;
	light: string;
	dark: string;
	description: string;
}

/**
 * Build semantic definitions.
 * `refBase` controls whether semantics reference abstractions or primitives directly.
 *   - "abstractions" -> {abstractions.primary.500}
 *   - "primitives"   -> {primitives.brand.500}
 */
function buildSemanticDefs(
	refBase: "abstractions" | "primitives",
	grayName: string,
	hasSecondary: boolean,
): SemanticDef[] {
	// Map logical names to the actual token paths depending on mode
	const primary = (step: number) =>
		refBase === "abstractions"
			? `{abstractions.primary.${step}}`
			: `{primitives.brand.${step}}`;

	const neutral = (step: number) =>
		refBase === "abstractions"
			? `{abstractions.neutral.${step}}`
			: `{primitives.${grayName}.${step}}`;

	const white = "{primitives.white}";

	const defs: SemanticDef[] = [
		// Background
		{
			name: "background/default",
			light: neutral(50),
			dark: neutral(950),
			description: "Default page background",
		},
		{
			name: "background/subtle",
			light: neutral(100),
			dark: neutral(900),
			description: "Subtle background for cards and sections",
		},
		{
			name: "background/muted",
			light: neutral(200),
			dark: neutral(800),
			description: "Muted background for hover states",
		},
		{
			name: "background/emphasis",
			light: primary(500),
			dark: primary(400),
			description: "Emphasized background (buttons, badges)",
		},
		{
			name: "background/inverse",
			light: neutral(900),
			dark: neutral(50),
			description: "Inverted background",
		},

		// Foreground / Text
		{
			name: "foreground/default",
			light: neutral(900),
			dark: neutral(50),
			description: "Default text color",
		},
		{
			name: "foreground/muted",
			light: neutral(500),
			dark: neutral(400),
			description: "Muted/secondary text",
		},
		{
			name: "foreground/subtle",
			light: neutral(400),
			dark: neutral(500),
			description: "Subtle text (placeholders, disabled)",
		},
		{
			name: "foreground/on-emphasis",
			light: white,
			dark: white,
			description: "Text on emphasized background",
		},
		{
			name: "foreground/primary",
			light: primary(600),
			dark: primary(400),
			description: "Primary-colored text (links, accents)",
		},

		// Border
		{
			name: "border/default",
			light: neutral(200),
			dark: neutral(800),
			description: "Default border",
		},
		{
			name: "border/muted",
			light: neutral(100),
			dark: neutral(900),
			description: "Subtle border (dividers)",
		},
		{
			name: "border/emphasis",
			light: primary(500),
			dark: primary(400),
			description: "Emphasized border (focus rings)",
		},

		// Surface
		{
			name: "surface/primary",
			light: primary(50),
			dark: primary(950),
			description: "Primary surface (light tint)",
		},
		{
			name: "surface/primary-hover",
			light: primary(100),
			dark: primary(900),
			description: "Primary surface hover state",
		},
	];

	if (hasSecondary) {
		const accent = (step: number) =>
			refBase === "abstractions"
				? `{abstractions.accent.${step}}`
				: `{primitives.secondary.${step}}`;

		defs.push(
			{
				name: "background/accent",
				light: accent(500),
				dark: accent(400),
				description: "Accent background",
			},
			{
				name: "foreground/accent",
				light: accent(600),
				dark: accent(400),
				description: "Accent text",
			},
			{
				name: "border/accent",
				light: accent(500),
				dark: accent(400),
				description: "Accent border",
			},
			{
				name: "surface/accent",
				light: accent(50),
				dark: accent(950),
				description: "Accent surface",
			},
		);
	}

	return defs;
}

function generateSemantics(
	config: BrandConfig,
	grayName: string,
	refBase: "abstractions" | "primitives",
): DesignToken[] {
	const darkMode = config.darkMode !== false;
	const defs = buildSemanticDefs(refBase, grayName, !!config.secondary);
	const tokens: DesignToken[] = [];

	if (darkMode) {
		// Two tokens per def: Light mode + Dark mode
		for (const def of defs) {
			for (const [modeName, modeValue] of [
				["Light", def.light],
				["Dark", def.dark],
			] as const) {
				const token = makeToken(def.name, modeValue, "semantics", {
					description: def.description,
					originalValue: modeValue,
				});
				(token as any).modeName = modeName;
				tokens.push(token);
			}
		}
	} else {
		// Single mode — use the light value
		for (const def of defs) {
			tokens.push(
				makeToken(def.name, def.light, "semantics", {
					description: def.description,
					originalValue: def.light,
				}),
			);
		}
	}

	return tokens;
}

// =========================================================================
// Public API
// =========================================================================

/**
 * Generate a design system from brand configuration.
 *
 * Supports three layer modes:
 * - "primitives" — Just raw color scales (brand, gray, white, black)
 * - "semantic"   — Primitives + semantic tokens referencing primitives directly
 * - "three-tier" — Primitives + abstractions + semantics (full indirection for rebranding)
 */
export function generateDesignSystem(config: BrandConfig): GeneratedSystem {
	tokenIdCounter = 0;

	const grayName = config.grayName ?? "zinc";
	const layers = config.layers ?? "semantic";

	const { tokens: primitiveTokens, scales } = generatePrimitives(
		config,
		grayName,
	);
	const tokens: DesignToken[] = [...primitiveTokens];
	const primitiveCount = primitiveTokens.length;

	let abstractionCount = 0;
	let abstractionMappings: AbstractionMapping[] = [];

	// Add abstractions only in three-tier mode
	if (layers === "three-tier") {
		const abs = generateAbstractions(config, grayName);
		tokens.push(...abs.tokens);
		abstractionCount = abs.tokens.length;
		abstractionMappings = abs.mappings;
	}

	let semanticCount = 0;

	// Add semantics in semantic or three-tier mode
	if (layers === "semantic" || layers === "three-tier") {
		const refBase = layers === "three-tier" ? "abstractions" : "primitives";
		const semanticTokens = generateSemantics(config, grayName, refBase);
		tokens.push(...semanticTokens);
		semanticCount = semanticTokens.length;
	}

	return {
		tokens,
		primitives: scales,
		abstractions: abstractionMappings,
		stats: {
			primitiveCount,
			abstractionCount,
			semanticCount,
			totalCount: tokens.length,
		},
	};
}

/** @deprecated Use generateDesignSystem instead */
export function generateThreeTierSystem(config: BrandConfig): GeneratedSystem {
	return generateDesignSystem({ ...config, layers: "three-tier" });
}
