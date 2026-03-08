// Design system token generator
// Flexible layer generation: primitives-only, two-tier, or full three-tier
// Output is DesignToken[] compatible with the existing import handler

import type { ColorValue, DesignToken } from "../types/tokens";
import {
	type ColorScale,
	generateColorScale,
	rgbToHex,
	SHADE_STEPS,
	type ShadeStep,
} from "./color-scale";
import { getRadixGray, RADIX_GRAYS, type RadixGrayScale } from "./radix-grays";
import {
	buildFontFamilies,
	computeRadiusScale,
	computeTypescale,
	DEFAULT_RADIUS,
	DURATION_RAW,
	DURATION_SEMANTIC,
	type FontOverrides,
	FONT_WEIGHTS,
	generateTypographyCss,
	type RadiusConfig,
	SHADOW_SCALE,
	SPACING_SCALE,
	shadowToCss,
	type TypescaleConfig,
} from "./token-presets";

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
	/** Neutral gray palette name — matches a Radix gray preset (default: "slate") */
	grayName?: string;
	/** Which layers to generate (default: "semantic") */
	layers?: LayerMode;
	/** Whether to generate light+dark semantic modes (default: true, ignored for "primitives" mode) */
	darkMode?: boolean;
	/** Radius anchor in px (default: 10) — the "lg" base from which other sizes are derived */
	radius?: number;
	/** Typescale configuration (base, ratio, line-height, steps) */
	typescale?: TypescaleConfig;
	/** Custom font name overrides (prepended to system fallback stacks) */
	fonts?: FontOverrides;
}

export interface GeneratedSystem {
	tokens: DesignToken[];
	primitives: ColorScale[];
	abstractions: AbstractionMapping[];
	/** The selected Radix gray palette (null if name didn't match) */
	radixGray: RadixGrayScale | null;
	/** Computed radius scale (t-shirt sizes -> px) */
	radiusScale: Record<string, number>;
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
	value: string | number | ColorValue,
	category: string,
	opts?: {
		description?: string;
		type?: string;
		originalValue?: string;
		modeName?: string;
	},
): DesignToken {
	const strValue =
		typeof value === "object"
			? rgbToHex(value)
			: typeof value === "number"
				? `${value}`
				: value;

	const token: DesignToken = {
		id: nextId(),
		name: figmaName,
		figmaName,
		value,
		originalValue: opts?.originalValue ?? strValue,
		type: (opts?.type ?? "color") as DesignToken["type"],
		category: category as DesignToken["category"],
		action: "import",
		description: opts?.description,
	};

	if (opts?.modeName) {
		(token as any).modeName = opts.modeName;
	}

	return token;
}

/** Emit a token for both Light and Dark modes (same value) */
function makeDualModeTokens(
	figmaName: string,
	value: string | number | ColorValue,
	category: string,
	darkMode: boolean,
	opts?: {
		description?: string;
		type?: string;
		originalValue?: string;
	},
): DesignToken[] {
	if (!darkMode) {
		return [makeToken(figmaName, value, category, opts)];
	}
	return [
		makeToken(figmaName, value, category, { ...opts, modeName: "Light" }),
		makeToken(figmaName, value, category, { ...opts, modeName: "Dark" }),
	];
}

// =========================================================================
// Primitives — raw color values + non-color tokens
// =========================================================================

function generatePrimitives(
	config: BrandConfig,
	grayName: string,
	darkMode: boolean,
): {
	tokens: DesignToken[];
	scales: ColorScale[];
	radixGray: RadixGrayScale | null;
} {
	const tokens: DesignToken[] = [];

	// --- Brand color scale (50-950, OKLCH) ---
	const brandScale = generateColorScale("brand", config.primary);
	const scales: ColorScale[] = [brandScale];

	for (const step of SHADE_STEPS) {
		tokens.push(
			...makeDualModeTokens(
				`brand/${step}`,
				brandScale.shades[step],
				"primitives",
				darkMode,
				{
					description: `Brand ${step}`,
					originalValue: brandScale.hexValues[step],
				},
			),
		);
	}

	// --- Secondary color scale (50-950, OKLCH) ---
	if (config.secondary) {
		const secondaryScale = generateColorScale("secondary", config.secondary);
		scales.push(secondaryScale);

		for (const step of SHADE_STEPS) {
			tokens.push(
				...makeDualModeTokens(
					`secondary/${step}`,
					secondaryScale.shades[step],
					"primitives",
					darkMode,
					{
						description: `Secondary ${step}`,
						originalValue: secondaryScale.hexValues[step],
					},
				),
			);
		}
	}

	// --- Radix gray (1-12, light + dark) ---
	const radixGray = getRadixGray(grayName) ?? RADIX_GRAYS[0];

	for (let i = 0; i < 12; i++) {
		const step = i + 1;
		const lightHex = radixGray.light[i];
		const darkHex = radixGray.dark[i];

		if (darkMode) {
			tokens.push(
				makeToken(
					`${radixGray.name}/${step}`,
					hexToColorValue(lightHex),
					"primitives",
					{
						description: `${radixGray.label} step ${step} (light)`,
						originalValue: lightHex,
						modeName: "Light",
					},
				),
				makeToken(
					`${radixGray.name}/${step}`,
					hexToColorValue(darkHex),
					"primitives",
					{
						description: `${radixGray.label} step ${step} (dark)`,
						originalValue: darkHex,
						modeName: "Dark",
					},
				),
			);
		} else {
			tokens.push(
				makeToken(
					`${radixGray.name}/${step}`,
					hexToColorValue(lightHex),
					"primitives",
					{
						description: `${radixGray.label} step ${step}`,
						originalValue: lightHex,
					},
				),
			);
		}
	}

	// --- Destructive (red) scale for error/danger states ---
	const destructiveScale = generateColorScale("destructive", "#EF4444");
	scales.push(destructiveScale);

	for (const step of SHADE_STEPS) {
		tokens.push(
			...makeDualModeTokens(
				`destructive/${step}`,
				destructiveScale.shades[step],
				"primitives",
				darkMode,
				{
					description: `Destructive ${step}`,
					originalValue: destructiveScale.hexValues[step],
				},
			),
		);
	}

	// --- Status color scales (success, warning, info) ---
	const statusColors = [
		{ name: "success", hex: "#10B981" },
		{ name: "warning", hex: "#F59E0B" },
		{ name: "info", hex: "#3B82F6" },
	] as const;

	for (const status of statusColors) {
		const statusScale = generateColorScale(status.name, status.hex);
		scales.push(statusScale);

		for (const step of SHADE_STEPS) {
			tokens.push(
				...makeDualModeTokens(
					`${status.name}/${step}`,
					statusScale.shades[step],
					"primitives",
					darkMode,
					{
						description: `${status.name} ${step}`,
						originalValue: statusScale.hexValues[step],
					},
				),
			);
		}
	}

	// --- White & Black ---
	tokens.push(
		...makeDualModeTokens(
			"white",
			{ r: 1, g: 1, b: 1 },
			"primitives",
			darkMode,
			{ originalValue: "#ffffff" },
		),
	);
	tokens.push(
		...makeDualModeTokens(
			"black",
			{ r: 0, g: 0, b: 0 },
			"primitives",
			darkMode,
			{ originalValue: "#000000" },
		),
	);

	// --- White/Black alpha scales ---
	const alphaSteps = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
	for (const step of alphaSteps) {
		tokens.push(
			...makeDualModeTokens(
				`white-alpha/${step}`,
				{ r: 1, g: 1, b: 1, a: step / 100 },
				"primitives",
				darkMode,
				{
					type: "color",
					originalValue: `rgba(255, 255, 255, ${step / 100})`,
					description: `White at ${step}% opacity`,
				},
			),
		);
		tokens.push(
			...makeDualModeTokens(
				`black-alpha/${step}`,
				{ r: 0, g: 0, b: 0, a: step / 100 },
				"primitives",
				darkMode,
				{
					type: "color",
					originalValue: `rgba(0, 0, 0, ${step / 100})`,
					description: `Black at ${step}% opacity`,
				},
			),
		);
	}

	// --- Spacing ---
	for (const [key, px] of Object.entries(SPACING_SCALE)) {
		tokens.push(
			...makeDualModeTokens(`spacing/${key}`, px, "primitives", darkMode, {
				type: "spacing",
				originalValue: `${px}px`,
				description: `Spacing ${key} (${px}px)`,
			}),
		);
	}

	// --- Shadows (multi-layer) ---
	for (const [level, layers] of Object.entries(SHADOW_SCALE)) {
		const cssValue = shadowToCss(layers);
		tokens.push(
			...makeDualModeTokens(
				`shadow/${level}`,
				cssValue,
				"primitives",
				darkMode,
				{
					type: "boxShadow",
					originalValue: cssValue,
					description: `Shadow elevation ${level}`,
				},
			),
		);
	}

	// --- Duration raw values ---
	for (const [key, ms] of Object.entries(DURATION_RAW)) {
		tokens.push(
			...makeDualModeTokens(`duration/${key}`, ms, "primitives", darkMode, {
				type: "duration",
				originalValue: `${ms}ms`,
				description: `Duration ${key}ms`,
			}),
		);
	}

	// --- Font families ---
	const fontStacks = buildFontFamilies(config.fonts);
	for (const [name, stack] of Object.entries(fontStacks)) {
		tokens.push(
			...makeDualModeTokens(`font/${name}`, stack, "primitives", darkMode, {
				type: "fontFamily",
				originalValue: stack,
				description: `Font family ${name}`,
			}),
		);
	}

	// --- Font weights ---
	for (const [name, weight] of Object.entries(FONT_WEIGHTS)) {
		tokens.push(
			...makeDualModeTokens(
				`font-weight/${name}`,
				String(weight),
				"primitives",
				darkMode,
				{
					type: "fontWeight",
					originalValue: String(weight),
					description: `Font weight ${name} (${weight})`,
				},
			),
		);
	}

	return { tokens, scales, radixGray };
}

// =========================================================================
// Abstractions — indirection layer
// =========================================================================

function generateAbstractions(
	config: BrandConfig,
	radixGray: RadixGrayScale,
	darkMode: boolean,
): { tokens: DesignToken[]; mappings: AbstractionMapping[] } {
	const tokens: DesignToken[] = [];
	const mappings: AbstractionMapping[] = [];

	// Primary -> brand (50-950)
	for (const step of SHADE_STEPS) {
		const ref = `{primitives.brand.${step}}`;
		tokens.push(
			...makeDualModeTokens(`primary/${step}`, ref, "abstractions", darkMode, {
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

	// Neutral -> radix gray (1-12)
	for (let i = 1; i <= 12; i++) {
		const ref = `{primitives.${radixGray.name}.${i}}`;
		tokens.push(
			...makeDualModeTokens(`neutral/${i}`, ref, "abstractions", darkMode, {
				description: `Neutral surface ${i} (references ${radixGray.name})`,
				originalValue: ref,
				type: "color",
			}),
		);
	}

	// Accent -> secondary (50-950)
	if (config.secondary) {
		for (const step of SHADE_STEPS) {
			const ref = `{primitives.secondary.${step}}`;
			tokens.push(
				...makeDualModeTokens(`accent/${step}`, ref, "abstractions", darkMode, {
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

	// Radius (computed from anchor)
	const radiusScale = computeRadiusScale(config.radius ?? DEFAULT_RADIUS.anchor);
	for (const [size, px] of Object.entries(radiusScale)) {
		tokens.push(
			...makeDualModeTokens(`radius/${size}`, px, "abstractions", darkMode, {
				type: "borderRadius",
				originalValue: `${px}px`,
				description: `Border radius ${size} (${px}px)`,
			}),
		);
	}

	// Duration semantic aliases
	for (const [name, rawKey] of Object.entries(DURATION_SEMANTIC)) {
		const ref = `{primitives.duration.${rawKey}}`;
		tokens.push(
			...makeDualModeTokens(
				`duration/${name}`,
				ref,
				"abstractions",
				darkMode,
				{
					type: "duration",
					originalValue: ref,
					description: `Duration ${name} (${DURATION_RAW[rawKey]}ms)`,
				},
			),
		);
	}

	return { tokens, mappings };
}

// =========================================================================
// Semantics — contextual tokens
// =========================================================================

interface SemanticDef {
	name: string;
	light: string;
	dark: string;
	description: string;
	/** Optional flat CSS name for shadcn compatibility (e.g., "background" instead of "background-default") */
	cssName?: string;
	/** Optional color-mix config for CSS output */
	lightColorMix?: { base: string; amount: string };
	darkColorMix?: { base: string; amount: string };
}

/**
 * Build semantic definitions.
 * `refBase` controls whether semantics reference abstractions or primitives directly.
 */
function buildSemanticDefs(
	refBase: "abstractions" | "primitives",
	grayName: string,
	hasSecondary: boolean,
): SemanticDef[] {
	// For brand colors (50-950 scale)
	const primary = (step: number) =>
		refBase === "abstractions"
			? `{abstractions.primary.${step}}`
			: `{primitives.brand.${step}}`;

	// For neutral/surface (Radix 1-12 scale)
	const neutral = (step: number) =>
		refBase === "abstractions"
			? `{abstractions.neutral.${step}}`
			: `{primitives.${grayName}.${step}}`;

	const white = "{primitives.white}";

	const defs: SemanticDef[] = [
		// Background — uses Radix 1-12 steps
		{
			name: "background/default",
			cssName: "background",
			light: neutral(1),
			dark: neutral(1),
			description: "Default page background",
		},
		{
			name: "background/subtle",
			light: neutral(2),
			dark: neutral(2),
			description: "Subtle background for cards and sections",
		},
		{
			name: "background/muted",
			light: neutral(3),
			dark: neutral(3),
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
			light: neutral(12),
			dark: neutral(1),
			description: "Inverted background",
		},

		// Foreground / Text — uses Radix high-contrast steps
		{
			name: "foreground/default",
			cssName: "foreground",
			light: neutral(12),
			dark: neutral(12),
			description: "Default text color",
			darkColorMix: { base: neutral(12), amount: "10%" },
		},
		{
			name: "foreground/muted",
			cssName: "muted-foreground",
			light: neutral(11),
			dark: neutral(11),
			description: "Muted/secondary text",
			lightColorMix: { base: neutral(11), amount: "10%" },
			darkColorMix: { base: neutral(11), amount: "10%" },
		},
		{
			name: "foreground/subtle",
			light: neutral(9),
			dark: neutral(9),
			description: "Subtle text (placeholders, disabled)",
		},
		{
			name: "foreground/on-emphasis",
			cssName: "primary-foreground",
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

		// Border — uses Radix mid-range steps
		{
			name: "border/default",
			cssName: "border",
			light: neutral(6),
			dark: neutral(6),
			description: "Default border",
		},
		{
			name: "border/muted",
			light: neutral(4),
			dark: neutral(4),
			description: "Subtle border (dividers)",
		},
		{
			name: "border/emphasis",
			light: primary(500),
			dark: primary(400),
			description: "Emphasized border (focus rings)",
		},

		// Surface — uses Radix component background steps
		{
			name: "surface/primary",
			cssName: "primary",
			light: primary(500),
			dark: primary(500),
			description: "Primary color",
		},
		{
			name: "surface/primary-hover",
			light: primary(100),
			dark: primary(900),
			description: "Primary surface hover state",
		},
		{
			name: "surface/component",
			cssName: "secondary",
			light: neutral(3),
			dark: neutral(3),
			description: "Secondary/component background",
		},
		{
			name: "surface/component-hover",
			light: neutral(4),
			dark: neutral(4),
			description: "Component hover background",
		},
		{
			name: "surface/component-active",
			light: neutral(5),
			dark: neutral(5),
			description: "Component active/pressed background",
		},

		// Muted
		{
			name: "muted/default",
			cssName: "muted",
			light: neutral(3),
			dark: neutral(3),
			description: "Muted background",
		},

		// Accent — with color-mix for transparency
		{
			name: "accent/default",
			cssName: "accent",
			light: neutral(4),
			dark: neutral(6),
			description: "Accent background",
			lightColorMix: { base: neutral(4), amount: "20%" },
			darkColorMix: { base: neutral(6), amount: "20%" },
		},
		{
			name: "accent/foreground",
			cssName: "accent-foreground",
			light: neutral(12),
			dark: neutral(12),
			description: "Accent foreground text",
		},

		// Secondary foreground
		{
			name: "secondary/foreground",
			cssName: "secondary-foreground",
			light: neutral(11),
			dark: neutral(10),
			description: "Secondary foreground text",
			darkColorMix: { base: neutral(10), amount: "10%" },
		},
	];

	// Card
	defs.push(
		{
			name: "card/default",
			cssName: "card",
			light: neutral(1),
			dark: neutral(2),
			description: "Card background",
		},
		{
			name: "card/foreground",
			cssName: "card-foreground",
			light: neutral(12),
			dark: neutral(12),
			description: "Card text color",
		},
	);

	// Popover
	defs.push(
		{
			name: "popover/default",
			cssName: "popover",
			light: neutral(1),
			dark: neutral(4),
			description: "Popover/dropdown background",
		},
		{
			name: "popover/foreground",
			cssName: "popover-foreground",
			light: neutral(12),
			dark: neutral(12),
			description: "Popover text color",
		},
	);

	// Destructive — references destructive primitive scale
	const destructive = (step: number) => `{primitives.destructive.${step}}`;
	defs.push(
		{
			name: "destructive/default",
			cssName: "destructive",
			light: destructive(500),
			dark: destructive(500),
			description: "Destructive action background",
		},
		{
			name: "destructive/foreground",
			light: white,
			dark: white,
			description: "Text on destructive background",
		},
		{
			name: "destructive/border",
			light: destructive(500),
			dark: destructive(400),
			description: "Destructive border",
		},
		{
			name: "destructive/muted",
			light: destructive(50),
			dark: destructive(950),
			description: "Muted destructive surface",
		},
		{
			name: "destructive/muted-foreground",
			light: destructive(600),
			dark: destructive(400),
			description: "Text on muted destructive surface",
		},
	);

	// Input & Ring
	defs.push(
		{
			name: "input/default",
			cssName: "input",
			light: neutral(5),
			dark: neutral(7),
			description: "Input border color",
		},
		{
			name: "ring/default",
			cssName: "ring",
			light: neutral(6),
			dark: neutral(8),
			description: "Focus ring color",
		},
		{
			name: "ring/primary",
			light: primary(500),
			dark: primary(400),
			description: "Primary focus ring color",
		},
	);

	// Status colors — success, warning, info
	const success = (step: number) => `{primitives.success.${step}}`;
	const warning = (step: number) => `{primitives.warning.${step}}`;
	const info = (step: number) => `{primitives.info.${step}}`;
	defs.push(
		{
			name: "success/default",
			cssName: "success",
			light: success(500),
			dark: success(500),
			description: "Success status color",
		},
		{
			name: "warning/default",
			cssName: "warning",
			light: warning(500),
			dark: warning(500),
			description: "Warning status color",
		},
		{
			name: "info/default",
			cssName: "info",
			light: info(500),
			dark: info(500),
			description: "Info status color",
		},
	);

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
		for (const def of defs) {
			for (const [modeName, modeValue] of [
				["Light", def.light],
				["Dark", def.dark],
			] as const) {
				const token = makeToken(def.name, modeValue, "semantics", {
					description: def.description,
					originalValue: modeValue,
					modeName,
				});
				tokens.push(token);
			}
		}
	} else {
		for (const def of defs) {
			tokens.push(
				makeToken(def.name, def.light, "semantics", {
					description: def.description,
					originalValue: def.light,
				}),
			);
		}
	}

	// Typography tokens (semantics — not mode-dependent but need dual-mode for consistency)
	const typeSteps = computeTypescale(config.typescale);
	for (const step of typeSteps) {
		tokens.push(
			...makeDualModeTokens(
				`type/${step.name}/size`,
				step.size,
				"semantics",
				darkMode,
				{
					type: "fontSize",
					originalValue: `${step.size}px`,
					description: `${step.name} font size`,
				},
			),
		);
		tokens.push(
			...makeDualModeTokens(
				`type/${step.name}/line-height`,
				step.lineHeight,
				"semantics",
				darkMode,
				{
					type: "number",
					originalValue: `${step.lineHeight}px`,
					description: `${step.name} line height`,
				},
			),
		);
	}

	// Radius tokens (when not three-tier, put them in semantics directly)
	if ((config.layers ?? "semantic") !== "three-tier") {
		const radiusScale = computeRadiusScale(config.radius ?? DEFAULT_RADIUS.anchor);
		for (const [size, px] of Object.entries(radiusScale)) {
			tokens.push(
				...makeDualModeTokens(`radius/${size}`, px, "semantics", darkMode, {
					type: "borderRadius",
					originalValue: `${px}px`,
					description: `Border radius ${size} (${px}px)`,
				}),
			);
		}
	}

	// Duration semantic aliases (when not three-tier)
	if ((config.layers ?? "semantic") !== "three-tier") {
		for (const [name, rawKey] of Object.entries(DURATION_SEMANTIC)) {
			const ref = `{primitives.duration.${rawKey}}`;
			tokens.push(
				...makeDualModeTokens(`duration/${name}`, ref, "semantics", darkMode, {
					type: "duration",
					originalValue: ref,
					description: `Duration ${name} (${DURATION_RAW[rawKey]}ms)`,
				}),
			);
		}
	}

	return tokens;
}

// =========================================================================
// CSS Export
// =========================================================================

export function generateCss(config: BrandConfig): string {
	const system = generateDesignSystem(config);
	const grayName = config.grayName ?? "slate";
	const radixGray = getRadixGray(grayName) ?? RADIX_GRAYS[0];
	const radiusScale = computeRadiusScale(config.radius ?? DEFAULT_RADIUS.anchor);
	const darkMode = config.darkMode !== false;

	const lines: string[] = [];

	// Primitives as @theme inline
	lines.push("@theme inline {");

	// Brand colors (50-950)
	const brandScale = system.primitives.find((s) => s.name === "brand");
	if (brandScale) {
		for (const step of SHADE_STEPS) {
			lines.push(`  --color-brand-${step}: ${brandScale.hexValues[step]};`);
		}
	}

	// Secondary colors
	const secondaryScale = system.primitives.find((s) => s.name === "secondary");
	if (secondaryScale) {
		for (const step of SHADE_STEPS) {
			lines.push(
				`  --color-secondary-${step}: ${secondaryScale.hexValues[step]};`,
			);
		}
	}

	// Destructive colors
	const destructiveScale = system.primitives.find(
		(s) => s.name === "destructive",
	);
	if (destructiveScale) {
		for (const step of SHADE_STEPS) {
			lines.push(
				`  --color-destructive-${step}: ${destructiveScale.hexValues[step]};`,
			);
		}
	}

	// Status colors (success, warning, info)
	for (const statusName of ["success", "warning", "info"]) {
		const statusScale = system.primitives.find((s) => s.name === statusName);
		if (statusScale) {
			for (const step of SHADE_STEPS) {
				lines.push(
					`  --color-${statusName}-${step}: ${statusScale.hexValues[step]};`,
				);
			}
		}
	}

	// Spacing
	for (const [key, px] of Object.entries(SPACING_SCALE)) {
		lines.push(`  --spacing-${key}: ${px}px;`);
	}

	// Radius
	for (const [size, px] of Object.entries(radiusScale)) {
		lines.push(`  --radius-${size}: ${px}px;`);
	}

	// Shadows
	for (const [level, layers] of Object.entries(SHADOW_SCALE)) {
		lines.push(`  --shadow-${level}: ${shadowToCss(layers)};`);
	}

	// Font families
	const fontStacks = buildFontFamilies(config.fonts);
	for (const [name, stack] of Object.entries(fontStacks)) {
		lines.push(`  --font-${name}: ${stack};`);
	}
	for (const [name, weight] of Object.entries(FONT_WEIGHTS)) {
		lines.push(`  --font-weight-${name}: ${weight};`);
	}

	// Durations
	for (const [name, rawKey] of Object.entries(DURATION_SEMANTIC)) {
		lines.push(`  --duration-${name}: ${DURATION_RAW[rawKey]}ms;`);
	}

	// Semantic color registrations for Tailwind (--color-X: var(--X))
	const defs = buildSemanticDefs(
		"primitives",
		radixGray.name,
		!!config.secondary,
	);
	for (const def of defs) {
		if (def.cssName) {
			lines.push(`  --color-${def.cssName}: var(--${def.cssName});`);
		}
	}

	lines.push("}");
	lines.push("");

	// Radix gray + semantics as :root / .dark
	lines.push(":root {");

	// Light mode gray
	for (let i = 0; i < 12; i++) {
		lines.push(`  --color-${radixGray.name}-${i + 1}: ${radixGray.light[i]};`);
	}

	// Semantic color references (light mode) — use flat cssName when available
	for (const def of defs) {
		const cssVarName = `--${def.cssName ?? def.name.replace(/\//g, "-")}`;
		const cssValue = def.lightColorMix
			? `color-mix(in srgb, ${refToCssVar(def.lightColorMix.base)}, transparent ${def.lightColorMix.amount})`
			: refToCssVar(def.light);
		lines.push(`  ${cssVarName}: ${cssValue};`);
	}

	lines.push("}");

	if (darkMode) {
		lines.push("");
		lines.push(".dark {");

		for (let i = 0; i < 12; i++) {
			lines.push(`  --color-${radixGray.name}-${i + 1}: ${radixGray.dark[i]};`);
		}

		for (const def of defs) {
			const cssVarName = `--${def.cssName ?? def.name.replace(/\//g, "-")}`;
			const cssValue = def.darkColorMix
				? `color-mix(in srgb, ${refToCssVar(def.darkColorMix.base)}, transparent ${def.darkColorMix.amount})`
				: refToCssVar(def.dark);
			lines.push(`  ${cssVarName}: ${cssValue};`);
		}

		lines.push("}");
	}

	// Typography
	lines.push("");
	lines.push("/* Typography */");
	lines.push(generateTypographyCss(computeTypescale(config.typescale)));

	return lines.join("\n");
}

/** Convert a token reference like {primitives.brand.500} to a CSS var */
function refToCssVar(ref: string): string {
	const match = ref.match(/^\{([^}]+)\}$/);
	if (!match) return ref;
	const path = match[1].replace(/\./g, "-");
	return `var(--color-${path.replace(/^primitives-/, "").replace(/^abstractions-/, "")})`;
}

// =========================================================================
// Helpers
// =========================================================================

function hexToColorValue(hex: string): ColorValue {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
	return { r, g, b };
}

// =========================================================================
// Public API
// =========================================================================

/**
 * Generate a design system from brand configuration.
 *
 * Supports three layer modes:
 * - "primitives" — Raw color scales + spacing + shadows + durations
 * - "semantic"   — Primitives + semantic tokens + radius + typography + duration aliases
 * - "three-tier" — Primitives + abstractions + semantics (full indirection for rebranding)
 */
export function generateDesignSystem(config: BrandConfig): GeneratedSystem {
	tokenIdCounter = 0;

	const grayName = config.grayName ?? "slate";
	const layers = config.layers ?? "semantic";
	const darkMode = config.darkMode !== false;

	const {
		tokens: primitiveTokens,
		scales,
		radixGray,
	} = generatePrimitives(config, grayName, darkMode);
	const tokens: DesignToken[] = [...primitiveTokens];
	const primitiveCount = primitiveTokens.length;

	let abstractionCount = 0;
	let abstractionMappings: AbstractionMapping[] = [];

	// Add abstractions only in three-tier mode
	if (layers === "three-tier" && radixGray) {
		const abs = generateAbstractions(config, radixGray, darkMode);
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
		radixGray: radixGray ?? null,
		radiusScale: computeRadiusScale(config.radius ?? DEFAULT_RADIUS.anchor),
		stats: {
			primitiveCount,
			abstractionCount,
			semanticCount,
			totalCount: tokens.length,
		},
	};
}
