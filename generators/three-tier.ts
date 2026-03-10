// Design system token generator — always three-tier
// Primitives → Abstractions → Semantics
// Output is DesignToken[] compatible with the existing import handler

import type { ColorValue, DesignToken } from "../types/tokens";
import {
	type ColorScale,
	generateColorScale,
	rgbToHex,
	SHADE_STEPS,
} from "./color-scale";
import { getRadixGray, RADIX_GRAYS, type RadixGrayScale } from "./radix-grays";
import {
	BREAKPOINTS,
	buildFontFamilies,
	computeRadiusScale,
	computeTypescale,
	CONTAINER_SCALE,
	DEFAULT_RADIUS,
	DURATION_RAW,
	DURATION_SEMANTIC,
	EASING_CURVES,
	FONT_WEIGHT_LABELS,
	FONT_WEIGHT_VARIABLE,
	type FontOverrides,
	generateTypographyCss,
	resolveFontNames,
	SCREEN_SIZES,
	SHADOW_SCALE,
	shadowToCss,
	SIZES_SCALE,
	SPACING_SCALE,
	type TypescaleConfig,
	ZLAYER_SCALE,
} from "./token-presets";

// --- Configuration types ---

export interface BrandConfig {
	/** Whether to generate light+dark semantic modes (default: true) */
	darkMode?: boolean;
	/** Custom font name overrides (prepended to system fallback stacks) */
	fonts?: FontOverrides;
	/** Neutral gray palette name — matches a Radix gray preset (default: "slate") */
	grayName?: string;
	/** Primary brand color (hex) */
	primary: string;
	/** Radius anchor in px (default: 10) — the "lg" base from which other sizes are derived */
	radius?: number;
	/** Secondary/accent brand color (hex, optional) */
	secondary?: string;
	/** Status color overrides (hex). Defaults: danger=#EF4444, success=#10B981, warning=#F59E0B, info=#3B82F6 */
	statusColors?: StatusColorOverrides;
	/** Typescale configuration (base, ratio, line-height, steps) */
	typescale?: TypescaleConfig;
}

export interface StatusColorOverrides {
	danger?: string;
	info?: string;
	success?: string;
	warning?: string;
}

export interface GeneratedSystem {
	/** Computed radius scale (t-shirt sizes -> px) */
	radiusScale: Record<string, number>;
	/** The selected Radix gray palette (null if name didn't match) */
	radixGray: RadixGrayScale | null;
	/** Color scale data for preview UI (brand, secondary, etc.) */
	primitives: ColorScale[];
	stats: {
		primitiveCount: number;
		abstractionCount: number;
		semanticCount: number;
		totalCount: number;
	};
	/** Figma styles data (paint, text, effect) for import alongside variables */
	styles: Record<string, any>;
	tokens: DesignToken[];
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

	// If the value is a reference string like {primitives.color.gray.light.1},
	// set type to "reference" so the import handler processes it in the alias pass
	const isReference =
		typeof value === "string" && value.startsWith("{") && value.endsWith("}");
	const resolvedType = isReference
		? "reference"
		: ((opts?.type ?? "color") as DesignToken["type"]);

	const token: DesignToken = {
		id: nextId(),
		name: figmaName,
		figmaName,
		value,
		originalValue: opts?.originalValue ?? strValue,
		type: resolvedType,
		category: category as DesignToken["category"],
		action: "import",
		description: opts?.description,
	};

	if (opts?.modeName) {
		(token as any).modeName = opts.modeName;
	}

	return token;
}

// =========================================================================
// Primitives — raw values, SINGLE MODE (no Light/Dark)
// =========================================================================

function generatePrimitives(config: BrandConfig): {
	tokens: DesignToken[];
	scales: ColorScale[];
	radixGray: RadixGrayScale | null;
} {
	const tokens: DesignToken[] = [];
	const grayName = config.grayName ?? "slate";

	// --- Font families (CSS stacks for dev export) ---
	const fontStacks = buildFontFamilies(config.fonts);
	for (const [name, stack] of Object.entries(fontStacks)) {
		tokens.push(
			makeToken(`font/family/${name}`, stack, "primitives", {
				type: "fontFamily",
				originalValue: stack,
				description: `Font family ${name} (CSS stack)`,
			}),
		);
	}

	// --- Font family names (clean single names for Figma binding) ---
	const fontNames = resolveFontNames(config.fonts);
	for (const [name, fontName] of Object.entries(fontNames)) {
		tokens.push(
			makeToken(`font/family/${name}/name`, fontName, "primitives", {
				type: "string",
				originalValue: fontName,
				description: `Font name ${name} (Figma)`,
			}),
		);
	}

	// --- Font weight labels (string values: font/weight/100 = "thin") ---
	for (const [key, label] of Object.entries(FONT_WEIGHT_LABELS)) {
		tokens.push(
			makeToken(`font/weight/${key}`, label, "primitives", {
				type: "string",
				originalValue: label,
				description: `Font weight ${key}`,
			}),
		);
	}

	// --- Font weight variable (numeric values: font/weight/variable/thin = 100) ---
	for (const [name, value] of Object.entries(FONT_WEIGHT_VARIABLE)) {
		tokens.push(
			makeToken(`font/weight/variable/${name}`, value, "primitives", {
				type: "number",
				originalValue: `${value}px`,
				description: `Font weight variable ${name}`,
			}),
		);
	}

	// --- White alpha scale (color/white/0 - color/white/100) ---
	const alphaSteps = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
	for (const step of alphaSteps) {
		tokens.push(
			makeToken(
				`color/white/${step}`,
				{ r: 1, g: 1, b: 1, a: step / 100 },
				"primitives",
				{
					type: "color",
					originalValue: `rgba(255, 255, 255, ${step / 100})`,
					description: `White at ${step}% opacity`,
				},
			),
		);
	}

	// --- Black alpha scale (color/black/0 - color/black/100) ---
	for (const step of alphaSteps) {
		tokens.push(
			makeToken(
				`color/black/${step}`,
				{ r: 0, g: 0, b: 0, a: step / 100 },
				"primitives",
				{
					type: "color",
					originalValue: `rgba(0, 0, 0, ${step / 100})`,
					description: `Black at ${step}% opacity`,
				},
			),
		);
	}

	// --- Radix gray (color/gray/light/1-12 + color/gray/dark/1-12) ---
	const radixGray = getRadixGray(grayName) ?? RADIX_GRAYS[0];

	for (let i = 0; i < 12; i++) {
		const step = i + 1;
		tokens.push(
			makeToken(
				`color/gray/light/${step}`,
				hexToColorValue(radixGray.light[i]),
				"primitives",
				{
					description: `${radixGray.label} step ${step} (light)`,
					originalValue: radixGray.light[i],
				},
			),
		);
		tokens.push(
			makeToken(
				`color/gray/dark/${step}`,
				hexToColorValue(radixGray.dark[i]),
				"primitives",
				{
					description: `${radixGray.label} step ${step} (dark)`,
					originalValue: radixGray.dark[i],
				},
			),
		);
	}

	// --- Spacing ---
	for (const [key, px] of Object.entries(SPACING_SCALE)) {
		// Figma doesn't allow dots in variable names — replace with underscores (matches reference)
		const figmaKey = key.replace(".", "_");
		tokens.push(
			makeToken(`spacing/${figmaKey}`, px, "primitives", {
				type: "spacing",
				originalValue: `${px}px`,
				description: `Spacing ${key} (${px}px)`,
			}),
		);
	}

	// --- Sizes ---
	for (const [key, px] of Object.entries(SIZES_SCALE)) {
		tokens.push(
			makeToken(`sizes/${key}`, px, "primitives", {
				type: "sizing",
				originalValue: `${px}px`,
				description: `Size ${key} (${px}px)`,
			}),
		);
	}

	// --- Containers ---
	for (const [key, value] of Object.entries(CONTAINER_SCALE)) {
		tokens.push(
			makeToken(`container/${key}`, value, "primitives", {
				type: "string",
				originalValue: value,
				description: `Container max-width ${key}`,
			}),
		);
	}

	// --- Motion / Duration raw values ---
	for (const [key, ms] of Object.entries(DURATION_RAW)) {
		tokens.push(
			makeToken(`motion/duration/${key}`, ms, "primitives", {
				type: "number",
				originalValue: `${ms}ms`,
				description: `Duration ${key === "none" ? "0" : key}ms`,
			}),
		);
	}

	// --- Motion / Easing curves ---
	for (const [key, value] of Object.entries(EASING_CURVES)) {
		tokens.push(
			makeToken(`motion/easing/${key}`, value, "primitives", {
				type: "string",
				originalValue: value,
				description: `Easing ${key}`,
			}),
		);
	}

	// --- Breakpoints ---
	for (const [key, value] of Object.entries(BREAKPOINTS)) {
		tokens.push(
			makeToken(`breakpoints/${key}`, value, "primitives", {
				type: "string",
				originalValue: value,
				description: `Breakpoint ${key}`,
			}),
		);
	}

	// --- Screen sizes ---
	for (const [key, value] of Object.entries(SCREEN_SIZES)) {
		tokens.push(
			makeToken(`screen/${key}`, value, "primitives", {
				type: "string",
				originalValue: value,
				description: `Screen width ${key}`,
			}),
		);
	}

	// --- Shadows (multi-layer) ---
	for (const [level, layers] of Object.entries(SHADOW_SCALE)) {
		const cssValue = shadowToCss(layers);
		tokens.push(
			makeToken(`shadow/${level}`, cssValue, "primitives", {
				type: "boxShadow",
				originalValue: cssValue,
				description: `Shadow elevation ${level}`,
			}),
		);
	}

	// --- Compute color scales for preview (not emitted as primitive tokens) ---
	const brandScale = generateColorScale("brand", config.primary);
	const scales: ColorScale[] = [brandScale];

	if (config.secondary) {
		scales.push(generateColorScale("secondary", config.secondary));
	}

	return { tokens, scales, radixGray };
}

// =========================================================================
// Abstractions — indirection layer, SINGLE MODE
// =========================================================================

function generateAbstractions(
	config: BrandConfig,
	radixGray: RadixGrayScale,
	brandScale: ColorScale,
): DesignToken[] {
	const tokens: DesignToken[] = [];

	// --- Surface (light/dark gray references) ---
	for (let i = 1; i <= 12; i++) {
		tokens.push(
			makeToken(
				`surface/light/${i}`,
				`{primitives.color.gray.light.${i}}`,
				"abstractions",
				{
					description: `Surface light step ${i}`,
					originalValue: `{primitives.color.gray.light.${i}}`,
					type: "color",
				},
			),
		);
		tokens.push(
			makeToken(
				`surface/dark/${i}`,
				`{primitives.color.gray.dark.${i}}`,
				"abstractions",
				{
					description: `Surface dark step ${i}`,
					originalValue: `{primitives.color.gray.dark.${i}}`,
					type: "color",
				},
			),
		);
	}

	// --- Accent: primary brand color (direct value, not reference) ---
	tokens.push(
		makeToken(
			"accent/primary/500",
			brandScale.shades[500],
			"abstractions",
			{
				description: "Primary accent color",
				originalValue: brandScale.hexValues[500],
			},
		),
	);

	// --- Accent: secondary (if provided) ---
	if (config.secondary) {
		const secondaryScale = generateColorScale("secondary", config.secondary);
		tokens.push(
			makeToken(
				"accent/secondary/500",
				secondaryScale.shades[500],
				"abstractions",
				{
					description: "Secondary accent color",
					originalValue: secondaryScale.hexValues[500],
				},
			),
		);
	}

	// --- Accent: status colors (configurable) ---
	const overrides = config.statusColors;
	const statusColors = [
		{ name: "danger", hex: overrides?.danger ?? "#EF4444" },
		{ name: "success", hex: overrides?.success ?? "#10B981" },
		{ name: "warning", hex: overrides?.warning ?? "#F59E0B" },
		{ name: "info", hex: overrides?.info ?? "#3B82F6" },
	];

	for (const status of statusColors) {
		const scale = generateColorScale(status.name, status.hex);
		tokens.push(
			makeToken(
				`accent/status/${status.name}/500`,
				scale.shades[500],
				"abstractions",
				{
					description: `${status.name} status color`,
					originalValue: scale.hexValues[500],
				},
			),
		);
	}

	// --- Rounded (radius scale) ---
	const radiusScale = computeRadiusScale(
		config.radius ?? DEFAULT_RADIUS.anchor,
	);
	for (const [size, px] of Object.entries(radiusScale)) {
		tokens.push(
			makeToken(`rounded/${size}`, px, "abstractions", {
				type: "borderRadius",
				originalValue: `${px}px`,
				description: `Border radius ${size} (${px}px)`,
			}),
		);
	}

	// --- Z-layer scale ---
	for (const [name, value] of Object.entries(ZLAYER_SCALE)) {
		tokens.push(
			makeToken(`zLayer/${name}`, value, "abstractions", {
				type: "number",
				originalValue: `${value}`,
				description: `Z-index layer ${name}`,
			}),
		);
	}

	// --- Duration semantic aliases ---
	for (const [name, rawKey] of Object.entries(DURATION_SEMANTIC)) {
		const ref = `{primitives.motion.duration.${rawKey}}`;
		tokens.push(
			makeToken(`duration/${name}`, ref, "abstractions", {
				type: "duration",
				originalValue: ref,
				description: `Duration ${name} (${DURATION_RAW[rawKey]}ms)`,
			}),
		);
	}

	// --- Font family aliases (primary/secondary/tertiary → clean name primitives for Figma binding) ---
	tokens.push(
		makeToken(
			"font/family/primary",
			"{primitives.font.family.sans.name}",
			"abstractions",
			{
				type: "string",
				originalValue: "{primitives.font.family.sans.name}",
				description: "Main UI font",
			},
		),
	);
	tokens.push(
		makeToken(
			"font/family/secondary",
			"{primitives.font.family.serif.name}",
			"abstractions",
			{
				type: "string",
				originalValue: "{primitives.font.family.serif.name}",
				description: "Display font",
			},
		),
	);
	tokens.push(
		makeToken(
			"font/family/tertiary",
			"{primitives.font.family.mono.name}",
			"abstractions",
			{
				type: "string",
				originalValue: "{primitives.font.family.mono.name}",
				description: "Code font",
			},
		),
	);

	// --- Font weight aliases ---
	tokens.push(
		makeToken(
			"font/weight/default",
			"{primitives.font.weight.variable.regular}",
			"abstractions",
			{
				type: "number",
				originalValue: "{primitives.font.weight.variable.regular}",
				description: "Default font weight",
			},
		),
	);
	tokens.push(
		makeToken(
			"font/weight/strong",
			"{primitives.font.weight.variable.medium}",
			"abstractions",
			{
				type: "number",
				originalValue: "{primitives.font.weight.variable.medium}",
				description: "Strong/emphasized font weight",
			},
		),
	);
	tokens.push(
		makeToken("font/weight/italic", "Italic", "abstractions", {
			type: "string",
			originalValue: "Italic",
			description: "Italic font style",
		}),
	);

	// --- Typescale with responsive variants (min, sm, md) ---
	// Sizes above base scale down for smaller breakpoints.
	// Sizes at/below base stay constant across breakpoints.
	// Dampening: sm keeps 85% of the delta from base, min keeps 70%.
	const typeSteps = computeTypescale(config.typescale);
	const baseSize = config.typescale?.base ?? 16;
	const SM_FACTOR = 0.85;
	const MIN_FACTOR = 0.7;
	const round = (v: number) => Math.round(v);

	for (const step of typeSteps) {
		const isAboveBase = step.size > baseSize;
		const delta = step.size - baseSize;

		const sizeMd = step.size;
		const sizeSm = isAboveBase ? round(baseSize + delta * SM_FACTOR) : step.size;
		const sizeMin = isAboveBase ? round(baseSize + delta * MIN_FACTOR) : step.size;

		const lhRatio = step.lineHeight / step.size;
		const lhMd = step.lineHeight;
		const lhSm = round(sizeSm * lhRatio);
		const lhMin = round(sizeMin * lhRatio);

		const sizes = { md: sizeMd, sm: sizeSm, min: sizeMin };
		const lineHeights = { md: lhMd, sm: lhSm, min: lhMin };

		for (const variant of ["min", "sm", "md"] as const) {
			tokens.push(
				makeToken(
					`font/typescale/${step.name}/size/${variant}`,
					sizes[variant],
					"abstractions",
					{
						type: "number",
						originalValue: `${sizes[variant]}px`,
						description: `${step.name} font size (${variant})`,
					},
				),
			);
			tokens.push(
				makeToken(
					`font/typescale/${step.name}/line-height/${variant}`,
					lineHeights[variant],
					"abstractions",
					{
						type: "number",
						originalValue: `${lineHeights[variant]}px`,
						description: `${step.name} line height (${variant})`,
					},
				),
			);
		}
	}

	return tokens;
}

// =========================================================================
// Semantics — contextual tokens, DUAL MODE (Light/Dark)
// =========================================================================

interface SemanticDef {
	dark: string;
	description: string;
	light: string;
	name: string;
	type?: string;
}

function buildSemanticDefs(hasSecondary: boolean): SemanticDef[] {
	const surfL = (step: number) => `{abstractions.surface.light.${step}}`;
	const surfD = (step: number) => `{abstractions.surface.dark.${step}}`;
	const primary = "{abstractions.accent.primary.500}";
	const danger = "{abstractions.accent.status.danger.500}";
	const success = "{abstractions.accent.status.success.500}";
	const warning = "{abstractions.accent.status.warning.500}";
	const info = "{abstractions.accent.status.info.500}";

	const defs: SemanticDef[] = [
		// --- Backplates (overlay tints) ---
		{
			name: "backplate/1",
			light: "{primitives.color.black.5}",
			dark: "{primitives.color.white.5}",
			description: "Backplate level 1",
		},
		{
			name: "backplate/2",
			light: "{primitives.color.black.20}",
			dark: "{primitives.color.white.20}",
			description: "Backplate level 2",
		},
		{
			name: "backplate/3",
			light: "{primitives.color.black.10}",
			dark: "{primitives.color.white.10}",
			description: "Backplate level 3",
		},
		{
			name: "backplate/4",
			light: "{primitives.color.black.5}",
			dark: "{primitives.color.white.5}",
			description: "Backplate level 4",
		},

		// --- shadcn core tokens ---
		{
			name: "shadcn/background",
			light: surfL(2),
			dark: surfD(1),
			description: "Default page background",
		},
		{
			name: "shadcn/foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Default text color",
		},
		{
			name: "shadcn/card",
			light: surfL(1),
			dark: surfD(2),
			description: "Card background",
		},
		{
			name: "shadcn/card-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Card text color",
		},
		{
			name: "shadcn/popover",
			light: surfL(1),
			dark: surfD(4),
			description: "Popover/dropdown background",
		},
		{
			name: "shadcn/popover-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Popover text color",
		},
		{
			name: "shadcn/primary",
			light: primary,
			dark: primary,
			description: "Primary color",
		},
		{
			name: "shadcn/primary-foreground",
			light: surfL(1),
			dark: surfD(12),
			description: "Text on primary background",
		},
		{
			name: "shadcn/secondary",
			light: surfL(3),
			dark: surfD(3),
			description: "Secondary/component background",
		},
		{
			name: "shadcn/secondary-foreground",
			light: surfL(11),
			dark: surfD(11),
			description: "Secondary foreground text",
		},
		{
			name: "shadcn/muted",
			light: surfL(3),
			dark: surfD(3),
			description: "Muted background",
		},
		{
			name: "shadcn/muted-foreground",
			light: surfL(11),
			dark: surfD(11),
			description: "Muted/secondary text",
		},
		{
			name: "shadcn/accent",
			light: surfL(4),
			dark: surfD(6),
			description: "Accent background",
		},
		{
			name: "shadcn/accent-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Accent foreground text",
		},
		{
			name: "shadcn/destructive",
			light: danger,
			dark: danger,
			description: "Destructive action color",
		},
		{
			name: "shadcn/success",
			light: success,
			dark: success,
			description: "Success status color",
		},
		{
			name: "shadcn/warning",
			light: warning,
			dark: warning,
			description: "Warning status color",
		},
		{
			name: "shadcn/info",
			light: info,
			dark: info,
			description: "Info status color",
		},
		{
			name: "shadcn/border",
			light: surfL(4),
			dark: surfD(6),
			description: "Default border color",
		},
		{
			name: "shadcn/input",
			light: surfL(5),
			dark: surfD(7),
			description: "Input border color",
		},
		{
			name: "shadcn/ring",
			light: surfL(6),
			dark: surfD(8),
			description: "Focus ring color",
		},

		// --- Chart colors ---
		{
			name: "shadcn/chart-1",
			light: primary,
			dark: primary,
			description: "Chart color 1",
		},
		{
			name: "shadcn/chart-2",
			light: primary,
			dark: primary,
			description: "Chart color 2",
		},
		{
			name: "shadcn/chart-3",
			light: primary,
			dark: primary,
			description: "Chart color 3",
		},
		{
			name: "shadcn/chart-4",
			light: primary,
			dark: primary,
			description: "Chart color 4",
		},
		{
			name: "shadcn/chart-5",
			light: primary,
			dark: primary,
			description: "Chart color 5",
		},

		// --- Sidebar tokens (reference shadcn core) ---
		{
			name: "shadcn/sidebar",
			light: "{semantics.shadcn.card}",
			dark: "{semantics.shadcn.background}",
			description: "Sidebar background",
		},
		{
			name: "shadcn/sidebar-foreground",
			light: "{semantics.shadcn.foreground}",
			dark: "{semantics.shadcn.foreground}",
			description: "Sidebar text",
		},
		{
			name: "shadcn/sidebar-primary",
			light: "{semantics.shadcn.primary}",
			dark: "{semantics.shadcn.primary}",
			description: "Sidebar primary color",
		},
		{
			name: "shadcn/sidebar-primary-foreground",
			light: "{semantics.shadcn.primary-foreground}",
			dark: "{semantics.shadcn.primary-foreground}",
			description: "Sidebar primary foreground",
		},
		{
			name: "shadcn/sidebar-accent",
			light: "{semantics.shadcn.accent}",
			dark: "{semantics.shadcn.accent}",
			description: "Sidebar accent background",
		},
		{
			name: "shadcn/sidebar-accent-foreground",
			light: "{semantics.shadcn.accent-foreground}",
			dark: "{semantics.shadcn.accent-foreground}",
			description: "Sidebar accent text",
		},
		{
			name: "shadcn/sidebar-border",
			light: "{semantics.shadcn.border}",
			dark: "{semantics.shadcn.border}",
			description: "Sidebar border",
		},
		{
			name: "shadcn/sidebar-ring",
			light: "{semantics.shadcn.ring}",
			dark: "{semantics.shadcn.ring}",
			description: "Sidebar focus ring",
		},

		// --- Static mode references ---
		{
			name: "shadcn/light",
			light: surfL(1),
			dark: surfL(1),
			description: "Always-light surface (for forced-light contexts)",
		},
		{
			name: "shadcn/dark",
			light: "{primitives.color.gray.dark.1}",
			dark: "{primitives.color.gray.dark.1}",
			description: "Always-dark surface (for forced-dark contexts)",
		},
	];

	// --- Secondary accent tokens ---
	if (hasSecondary) {
		defs.push(
			{
				name: "shadcn/secondary-accent",
				light: "{abstractions.accent.secondary.500}",
				dark: "{abstractions.accent.secondary.500}",
				description: "Secondary accent color",
			},
		);
	}

	return defs;
}

function generateSemantics(config: BrandConfig): DesignToken[] {
	const darkMode = config.darkMode !== false;
	const defs = buildSemanticDefs(!!config.secondary);
	const tokens: DesignToken[] = [];

	if (darkMode) {
		for (const def of defs) {
			for (const [modeName, modeValue] of [
				["Light", def.light],
				["Dark", def.dark],
			] as const) {
				tokens.push(
					makeToken(def.name, modeValue, "semantics", {
						description: def.description,
						originalValue: modeValue,
						type: def.type,
						modeName,
					}),
				);
			}
		}
	} else {
		for (const def of defs) {
			tokens.push(
				makeToken(def.name, def.light, "semantics", {
					description: def.description,
					originalValue: def.light,
					type: def.type,
				}),
			);
		}
	}

	return tokens;
}

// =========================================================================
// Responsive — multi-mode collection for breakpoint switching
// Modes: "desktop (md)", "tablet (sm)", "mobile (min)"
// Each token references the corresponding abstraction variant
// =========================================================================

const RESPONSIVE_MODES = ["desktop (md)", "tablet (sm)", "mobile (min)"] as const;
const MODE_TO_VARIANT: Record<string, string> = {
	"desktop (md)": "md",
	"tablet (sm)": "sm",
	"mobile (min)": "min",
};

function generateResponsive(config: BrandConfig): DesignToken[] {
	const tokens: DesignToken[] = [];
	const typeSteps = computeTypescale(config.typescale);

	// Typography responsive tokens — each step gets font-size + line-height
	for (const step of typeSteps) {
		for (const mode of RESPONSIVE_MODES) {
			const variant = MODE_TO_VARIANT[mode];

			// font-size
			tokens.push(
				makeToken(
					`typography/${step.name}/font-size`,
					`{abstractions.font.typescale.${step.name}.size.${variant}}`,
					"responsive",
					{
						type: "number",
						originalValue: `{abstractions.font.typescale.${step.name}.size.${variant}}`,
						description: `${step.name} font size (${mode})`,
						modeName: mode,
					},
				),
			);

			// line-height
			tokens.push(
				makeToken(
					`typography/${step.name}/line-height`,
					`{abstractions.font.typescale.${step.name}.line-height.${variant}}`,
					"responsive",
					{
						type: "number",
						originalValue: `{abstractions.font.typescale.${step.name}.line-height.${variant}}`,
						description: `${step.name} line height (${mode})`,
						modeName: mode,
					},
				),
			);
		}
	}

	// Viewport screen token — maps modes to screen primitives
	const screenMap: Record<string, string> = {
		"desktop (md)": "{primitives.screen.macbook-air}",
		"tablet (sm)": "{primitives.screen.ipad-pro-11}",
		"mobile (min)": "{primitives.screen.iphone-16-pro}",
	};
	for (const mode of RESPONSIVE_MODES) {
		tokens.push(
			makeToken("viewport/screen", screenMap[mode], "responsive", {
				type: "number",
				originalValue: screenMap[mode],
				description: `Viewport width (${mode})`,
				modeName: mode,
			}),
		);
	}

	return tokens;
}

// =========================================================================
// CSS Export
// =========================================================================

export function generateCss(config: BrandConfig): string {
	const system = generateDesignSystem(config);
	const radixGray = system.radixGray ?? RADIX_GRAYS[0];
	const radiusScale = computeRadiusScale(
		config.radius ?? DEFAULT_RADIUS.anchor,
	);
	const darkMode = config.darkMode !== false;

	const lines: string[] = [];

	// Primitives as @theme inline
	lines.push("@theme inline {");

	// Brand color scale (from preview scales — for CSS utility classes)
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

	// Durations
	for (const [name, rawKey] of Object.entries(DURATION_SEMANTIC)) {
		lines.push(`  --duration-${name}: ${DURATION_RAW[rawKey]}ms;`);
	}

	// Semantic color registrations for Tailwind
	const defs = buildSemanticDefs(!!config.secondary);
	for (const def of defs) {
		if (def.name.startsWith("shadcn/")) {
			const cssName = def.name.replace("shadcn/", "");
			lines.push(`  --color-${cssName}: var(--${cssName});`);
		}
	}

	lines.push("}");
	lines.push("");

	// Radix gray + semantics as :root / .dark
	lines.push(":root {");

	// Light mode gray
	for (let i = 0; i < 12; i++) {
		lines.push(`  --color-gray-${i + 1}: ${radixGray.light[i]};`);
	}

	// Semantic color references (light mode)
	for (const def of defs) {
		if (def.name.startsWith("shadcn/")) {
			const cssName = def.name.replace("shadcn/", "");
			lines.push(`  --${cssName}: ${refToCssVar(def.light)};`);
		}
	}

	lines.push("}");

	if (darkMode) {
		lines.push("");
		lines.push(".dark {");

		for (let i = 0; i < 12; i++) {
			lines.push(`  --color-gray-${i + 1}: ${radixGray.dark[i]};`);
		}

		for (const def of defs) {
			if (def.name.startsWith("shadcn/")) {
				const cssName = def.name.replace("shadcn/", "");
				lines.push(`  --${cssName}: ${refToCssVar(def.dark)};`);
			}
		}

		lines.push("}");
	}

	// Typography
	lines.push("");
	lines.push("/* Typography */");
	lines.push(generateTypographyCss(computeTypescale(config.typescale)));

	return lines.join("\n");
}

/** Convert a token reference like {abstractions.surface.light.1} to a CSS var */
function refToCssVar(ref: string): string {
	const match = ref.match(/^\{([^}]+)\}$/);
	if (!match) return ref;
	const path = match[1];

	// Surface references → gray step
	const surfaceMatch = path.match(
		/^abstractions\.surface\.(light|dark)\.(\d+)$/,
	);
	if (surfaceMatch) {
		return `var(--color-gray-${surfaceMatch[2]})`;
	}

	// Accent references → direct color
	if (path.startsWith("abstractions.accent.")) {
		return `var(--color-${path.replace(/^abstractions\.accent\./, "").replace(/\./g, "-")})`;
	}

	// Primitive color references
	if (path.startsWith("primitives.color.")) {
		return `var(--color-${path.replace(/^primitives\.color\./, "").replace(/\./g, "-")})`;
	}

	// Self-references within semantics
	if (path.startsWith("semantics.shadcn.")) {
		return `var(--${path.replace(/^semantics\.shadcn\./, "")})`;
	}

	return `var(--${path.replace(/\./g, "-")})`;
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
// Styles generation — Paint, Text, Effect styles for Figma
// =========================================================================

function generateStyles(config: BrandConfig): Record<string, any> {
	const fontNames = resolveFontNames(config.fonts);
	const sansFontFamily = fontNames.sans;
	const typeSteps = computeTypescale(config.typescale);

	const styles: Record<string, any> = {
		paint: {},
		text: {},
		effect: {},
	};

	// --- Paint styles: semantic colors bound to variables ---
	const shadcnPaint: Record<string, any> = {};
	const semanticDefs = buildSemanticDefs(!!config.secondary);
	for (const def of semanticDefs) {
		if (def.name.startsWith("shadcn/")) {
			const styleName = def.name.replace("shadcn/", "");
			shadcnPaint[styleName] = {
				id: `generated-paint-${styleName}`,
				type: "color",
				fills: [
					{
						type: "solid",
						color: "rgba(0, 0, 0, 1)",
						opacity: 1,
						boundVariable: {
							type: "variable",
							variableName: def.name,
							collectionName: "semantics",
						},
					},
				],
			};
		}
	}
	styles.paint = { semantics: { shadcn: shadcnPaint } };

	// --- Text styles: typography (regular + strong for each step) ---
	// Bind to abstraction variables so styles update when tokens change
	const typography: Record<string, any> = {};
	for (const step of typeSteps) {
		const sizeBinding = {
			variableName: `typography/${step.name}/font-size`,
			collectionName: "responsive",
		};
		const lineHeightBinding = {
			variableName: `typography/${step.name}/line-height`,
			collectionName: "responsive",
		};
		const fontFamilyBinding = {
			variableName: "font/family/primary",
			collectionName: "abstractions",
		};

		// Regular variant
		typography[step.name] = {
			id: `generated-text-${step.name}`,
			type: "text",
			fontFamily: sansFontFamily,
			fontStyle: "Regular",
			fontSize: `${step.size}px`,
			lineHeight: `${step.lineHeight}px`,
			letterSpacing: "0%",
			paragraphSpacing: "0px",
			textCase: "ORIGINAL",
			textDecoration: "NONE",
			fontFamilyBoundVariable: fontFamilyBinding,
			fontSizeBoundVariable: sizeBinding,
			lineHeightBoundVariable: lineHeightBinding,
			fontWeightBoundVariable: {
				variableName: "font/weight/default",
				collectionName: "abstractions",
			},
		};

		// Strong variant
		typography[`${step.name}-strong`] = {
			id: `generated-text-${step.name}-strong`,
			type: "text",
			fontFamily: sansFontFamily,
			fontStyle: "Medium",
			fontSize: `${step.size}px`,
			lineHeight: `${step.lineHeight}px`,
			letterSpacing: "0%",
			paragraphSpacing: "0px",
			textCase: "ORIGINAL",
			textDecoration: "NONE",
			fontFamilyBoundVariable: fontFamilyBinding,
			fontSizeBoundVariable: sizeBinding,
			lineHeightBoundVariable: lineHeightBinding,
			fontWeightBoundVariable: {
				variableName: "font/weight/strong",
				collectionName: "abstractions",
			},
		};
	}
	styles.text = { typography };

	// --- Effect styles: shadows + blurs ---
	const shadows: Record<string, any> = {};
	for (const [level, layers] of Object.entries(SHADOW_SCALE)) {
		const effects: any[] = [];
		for (const layer of layers) {
			effects.push({
				type: "drop-shadow",
				offsetX: `${layer.offsetX}px`,
				offsetY: `${layer.offsetY}px`,
				radius: `${layer.blur}px`,
				spread: `${layer.spread}px`,
				color: `rgba(0, 0, 0, ${layer.opacity})`,
				visible: true,
			});
		}
		shadows[level] = { id: `generated-shadow-${level}`, type: "effect", effects };
	}

	const blurs: Record<string, any> = {
		"1": { id: "generated-blur-1", type: "effect", effects: [{ type: "layer-blur", radius: "6px", visible: true }] },
		"2": { id: "generated-blur-2", type: "effect", effects: [{ type: "layer-blur", radius: "12px", visible: true }] },
		"3": { id: "generated-blur-3", type: "effect", effects: [{ type: "layer-blur", radius: "20px", visible: true }] },
		"4": { id: "generated-blur-4", type: "effect", effects: [{ type: "layer-blur", radius: "40px", visible: true }] },
	};

	const backdropBlur: Record<string, any> = {
		"1": { id: "generated-backdrop-blur-1", type: "effect", effects: [{ type: "background-blur", radius: "20px", visible: true }] },
	};

	styles.effect = { shadow: shadows, blur: blurs, "backdrop-blur": backdropBlur };

	return styles;
}

// =========================================================================
// Public API
// =========================================================================

/**
 * Generate a complete three-tier design system from brand configuration.
 *
 * Always generates: Primitives → Abstractions → Semantics + Styles
 */
export function generateDesignSystem(config: BrandConfig): GeneratedSystem {
	tokenIdCounter = 0;

	const darkMode = config.darkMode !== false;

	// Generate all three tiers
	const {
		tokens: primitiveTokens,
		scales,
		radixGray,
	} = generatePrimitives(config);

	const abstractionTokens = radixGray
		? generateAbstractions(config, radixGray, scales[0])
		: [];

	const semanticTokens = generateSemantics(config);
	const responsiveTokens = generateResponsive(config);

	const tokens = [...primitiveTokens, ...abstractionTokens, ...semanticTokens, ...responsiveTokens];

	return {
		tokens,
		primitives: scales,
		radixGray: radixGray ?? null,
		radiusScale: computeRadiusScale(config.radius ?? DEFAULT_RADIUS.anchor),
		styles: generateStyles(config),
		stats: {
			primitiveCount: primitiveTokens.length,
			abstractionCount: abstractionTokens.length,
			semanticCount: semanticTokens.length,
			totalCount: tokens.length,
		},
	};
}
