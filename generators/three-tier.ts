// Three-tier design system generator
// Generates Primitives -> Abstractions -> Semantics token layers
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

export interface BrandConfig {
	/** Primary brand color (hex) */
	primary: string;
	/** Secondary/accent brand color (hex, optional — auto-generated if omitted) */
	secondary?: string;
	/** Neutral gray palette name (default: "zinc") */
	grayName?: string;
	/** Whether to generate light+dark semantic modes (default: true) */
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

/**
 * Generate a complete three-tier design system from brand configuration.
 *
 * Layer 1 — Primitives: Raw color scales (zinc/50..950, brand/50..950)
 * Layer 2 — Abstractions: Semantic aliases (primary/500 -> {brand.500})
 * Layer 3 — Semantics: Context tokens with Light/Dark modes
 *           (background -> {zinc.50} in Light, {zinc.950} in Dark)
 */
export function generateThreeTierSystem(config: BrandConfig): GeneratedSystem {
	tokenIdCounter = 0;

	const grayName = config.grayName ?? "zinc";
	const darkMode = config.darkMode !== false;
	const tokens: DesignToken[] = [];

	// =========================================================================
	// LAYER 1: Primitives — raw color values
	// =========================================================================

	const brandScale = generateColorScale("brand", config.primary);
	const grayScale = generateGrayScale(grayName, config.primary);

	const primitiveScales: ColorScale[] = [grayScale, brandScale];

	// Optional secondary scale
	let secondaryScale: ColorScale | undefined;
	if (config.secondary) {
		secondaryScale = generateColorScale("secondary", config.secondary);
		primitiveScales.push(secondaryScale);
	}

	// Create primitive tokens
	for (const scale of primitiveScales) {
		for (const step of SHADE_STEPS) {
			tokens.push(
				makeToken(`${scale.name}/${step}`, scale.shades[step], "primitives", {
					description: `${scale.name} ${step}`,
					originalValue: scale.hexValues[step],
				}),
			);
		}
	}

	// White and black
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

	const primitiveCount = tokens.length;

	// =========================================================================
	// LAYER 2: Abstractions — semantic aliases pointing to primitives
	// =========================================================================

	const abstractionMappings: AbstractionMapping[] = [];

	// Primary color scale -> brand
	for (const step of SHADE_STEPS) {
		const ref = `{primitives.brand.${step}}`;
		tokens.push(
			makeToken(`primary/${step}`, ref, "abstractions", {
				description: `Primary color ${step} (references brand)`,
				originalValue: ref,
				type: "color",
			}),
		);
		abstractionMappings.push({
			name: `primary/${step}`,
			step,
			pointsTo: { collection: "primitives", path: `brand/${step}` },
		});
	}

	// Neutral scale -> gray
	for (const step of SHADE_STEPS) {
		const ref = `{primitives.${grayName}.${step}}`;
		tokens.push(
			makeToken(`neutral/${step}`, ref, "abstractions", {
				description: `Neutral color ${step} (references ${grayName})`,
				originalValue: ref,
				type: "color",
			}),
		);
		abstractionMappings.push({
			name: `neutral/${step}`,
			step,
			pointsTo: { collection: "primitives", path: `${grayName}/${step}` },
		});
	}

	// Secondary (if present)
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
			abstractionMappings.push({
				name: `accent/${step}`,
				step,
				pointsTo: { collection: "primitives", path: `secondary/${step}` },
			});
		}
	}

	const abstractionCount = tokens.length - primitiveCount;

	// =========================================================================
	// LAYER 3: Semantics — contextual tokens with Light/Dark modes
	// =========================================================================

	if (darkMode) {
		// Semantic tokens reference abstractions and have Light + Dark values
		const semanticDefs: Array<{
			name: string;
			light: string;
			dark: string;
			description: string;
		}> = [
			// Background
			{
				name: "background/default",
				light: "{abstractions.neutral.50}",
				dark: "{abstractions.neutral.950}",
				description: "Default page background",
			},
			{
				name: "background/subtle",
				light: "{abstractions.neutral.100}",
				dark: "{abstractions.neutral.900}",
				description: "Subtle background for cards and sections",
			},
			{
				name: "background/muted",
				light: "{abstractions.neutral.200}",
				dark: "{abstractions.neutral.800}",
				description: "Muted background for hover states",
			},
			{
				name: "background/emphasis",
				light: "{abstractions.primary.500}",
				dark: "{abstractions.primary.400}",
				description: "Emphasized background (buttons, badges)",
			},
			{
				name: "background/inverse",
				light: "{abstractions.neutral.900}",
				dark: "{abstractions.neutral.50}",
				description: "Inverted background",
			},

			// Foreground / Text
			{
				name: "foreground/default",
				light: "{abstractions.neutral.900}",
				dark: "{abstractions.neutral.50}",
				description: "Default text color",
			},
			{
				name: "foreground/muted",
				light: "{abstractions.neutral.500}",
				dark: "{abstractions.neutral.400}",
				description: "Muted/secondary text",
			},
			{
				name: "foreground/subtle",
				light: "{abstractions.neutral.400}",
				dark: "{abstractions.neutral.500}",
				description: "Subtle text (placeholders, disabled)",
			},
			{
				name: "foreground/on-emphasis",
				light: "{primitives.white}",
				dark: "{primitives.white}",
				description: "Text on emphasized background",
			},
			{
				name: "foreground/primary",
				light: "{abstractions.primary.600}",
				dark: "{abstractions.primary.400}",
				description: "Primary-colored text (links, accents)",
			},

			// Border
			{
				name: "border/default",
				light: "{abstractions.neutral.200}",
				dark: "{abstractions.neutral.800}",
				description: "Default border",
			},
			{
				name: "border/muted",
				light: "{abstractions.neutral.100}",
				dark: "{abstractions.neutral.900}",
				description: "Subtle border (dividers)",
			},
			{
				name: "border/emphasis",
				light: "{abstractions.primary.500}",
				dark: "{abstractions.primary.400}",
				description: "Emphasized border (focus rings)",
			},

			// Surface
			{
				name: "surface/primary",
				light: "{abstractions.primary.50}",
				dark: "{abstractions.primary.950}",
				description: "Primary surface (light tint)",
			},
			{
				name: "surface/primary-hover",
				light: "{abstractions.primary.100}",
				dark: "{abstractions.primary.900}",
				description: "Primary surface hover state",
			},
		];

		// Add accent semantics if secondary color exists
		if (config.secondary) {
			semanticDefs.push(
				{
					name: "background/accent",
					light: "{abstractions.accent.500}",
					dark: "{abstractions.accent.400}",
					description: "Accent background",
				},
				{
					name: "foreground/accent",
					light: "{abstractions.accent.600}",
					dark: "{abstractions.accent.400}",
					description: "Accent text",
				},
				{
					name: "border/accent",
					light: "{abstractions.accent.500}",
					dark: "{abstractions.accent.400}",
					description: "Accent border",
				},
				{
					name: "surface/accent",
					light: "{abstractions.accent.50}",
					dark: "{abstractions.accent.950}",
					description: "Accent surface",
				},
			);
		}

		// Emit two tokens per semantic def: one for Light mode, one for Dark mode
		// This matches the import handler's per-token modeName pattern
		for (const def of semanticDefs) {
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
		// Single-mode semantics (no dark mode)
		const semanticDefs: Array<{
			name: string;
			value: string;
			description: string;
		}> = [
			{
				name: "background/default",
				value: "{abstractions.neutral.50}",
				description: "Default page background",
			},
			{
				name: "background/subtle",
				value: "{abstractions.neutral.100}",
				description: "Subtle background",
			},
			{
				name: "background/muted",
				value: "{abstractions.neutral.200}",
				description: "Muted background",
			},
			{
				name: "background/emphasis",
				value: "{abstractions.primary.500}",
				description: "Emphasized background",
			},
			{
				name: "foreground/default",
				value: "{abstractions.neutral.900}",
				description: "Default text",
			},
			{
				name: "foreground/muted",
				value: "{abstractions.neutral.500}",
				description: "Muted text",
			},
			{
				name: "foreground/on-emphasis",
				value: "{primitives.white}",
				description: "Text on emphasis",
			},
			{
				name: "foreground/primary",
				value: "{abstractions.primary.600}",
				description: "Primary text",
			},
			{
				name: "border/default",
				value: "{abstractions.neutral.200}",
				description: "Default border",
			},
			{
				name: "border/emphasis",
				value: "{abstractions.primary.500}",
				description: "Emphasis border",
			},
			{
				name: "surface/primary",
				value: "{abstractions.primary.50}",
				description: "Primary surface",
			},
		];

		for (const def of semanticDefs) {
			tokens.push(
				makeToken(def.name, def.value, "semantics", {
					description: def.description,
					originalValue: def.value,
				}),
			);
		}
	}

	const semanticCount = tokens.length - primitiveCount - abstractionCount;

	return {
		tokens,
		primitives: primitiveScales,
		abstractions: abstractionMappings,
		stats: {
			primitiveCount,
			abstractionCount,
			semanticCount,
			totalCount: tokens.length,
		},
	};
}
