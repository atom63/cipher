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
	BLUR_SCALE,
	BREAKPOINTS,
	buildFontFamilies,
	CONTAINER_SCALE,
	computeRadiusScale,
	computeTypescale,
	DEFAULT_RADIUS,
	DURATION_RAW,
	DURATION_SEMANTIC,
	EASING_CURVES,
	type FontOverrides,
	generateTypographyCss,
	resolveFontNames,
	SCREEN_SIZES,
	SHADOW_SCALE,
	SIZES_SCALE,
	SPACING_SCALE,
	shadowToCss,
	type TypescaleConfig,
	ZLAYER_SCALE,
} from "./token-presets";

// --- Configuration types ---

export interface BrandConfig {
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
	/** Color scale data for preview UI (brand, secondary, etc.) */
	primitives: ColorScale[];
	/** Computed radius scale (t-shirt sizes -> px) */
	radiusScale: Record<string, number>;
	/** The selected Radix gray palette (null if name didn't match) */
	radixGray: RadixGrayScale | null;
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

	// --- Font families (clean names for Figma variable binding) ---
	const fontNames = resolveFontNames(config.fonts);
	for (const [name, fontName] of Object.entries(fontNames)) {
		tokens.push(
			makeToken(`font/family/${name}`, fontName, "primitives", {
				type: "string",
				originalValue: fontName,
				description: `Font family ${name}`,
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
				type: "number",
				originalValue: `${value}px`,
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
				type: "number",
				originalValue: `${value}px`,
				description: `Breakpoint ${key}`,
			}),
		);
	}

	// --- Screen sizes ---
	for (const [key, value] of Object.entries(SCREEN_SIZES)) {
		tokens.push(
			makeToken(`screen/${key}`, value, "primitives", {
				type: "number",
				originalValue: `${value}px`,
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

	// --- Rounded (radius scale) ---
	const radiusScale = computeRadiusScale(
		config.radius ?? DEFAULT_RADIUS.anchor,
	);
	for (const [size, px] of Object.entries(radiusScale)) {
		tokens.push(
			makeToken(`rounded/${size}`, px, "primitives", {
				type: "borderRadius",
				originalValue: `${px}px`,
				description: `Border radius ${size} (${px}px)`,
			}),
		);
	}

	// --- Z-layer scale ---
	for (const [name, value] of Object.entries(ZLAYER_SCALE)) {
		tokens.push(
			makeToken(`zLayer/${name}`, value, "primitives", {
				type: "number",
				originalValue: `${value}`,
				description: `Z-index layer ${name}`,
			}),
		);
	}

	// --- Blur scale (Tailwind-aligned) ---
	for (const [name, px] of Object.entries(BLUR_SCALE)) {
		tokens.push(
			makeToken(`blur/${name}`, px, "primitives", {
				type: "number",
				originalValue: String(px),
				description: `Blur ${name} (${px}px)`,
			}),
		);
	}


	// --- Compute color scales for preview ---
	const brandScale = generateColorScale("brand-primary", config.primary);
	const scales: ColorScale[] = [brandScale];

	if (config.secondary) {
		scales.push(generateColorScale("brand-secondary", config.secondary));
	}

	// --- Brand primary color full ramp (color/brand-primary/50 – 950) ---
	for (const step of SHADE_STEPS) {
		tokens.push(
			makeToken(
				`color/brand-primary/${step}`,
				brandScale.shades[step],
				"primitives",
				{
					description: step === 500
						? `Brand primary ${step} [base:${config.primary}]`
						: `Brand primary ${step}`,
					originalValue: brandScale.hexValues[step],
				},
			),
		);
	}

	// --- Brand secondary full ramp (if provided) ---
	if (config.secondary) {
		const secondaryScale = generateColorScale("brand-secondary", config.secondary);
		for (const step of SHADE_STEPS) {
			tokens.push(
				makeToken(
					`color/brand-secondary/${step}`,
					secondaryScale.shades[step],
					"primitives",
					{
						description: step === 500
							? `Brand secondary ${step} [base:${config.secondary}]`
							: `Brand secondary ${step}`,
						originalValue: secondaryScale.hexValues[step],
					},
				),
			);
		}
	}

	// --- Status colors with full ramps ---
	const overrides = config.statusColors;
	const statusColors = [
		{ name: "danger", hex: overrides?.danger ?? "#EF4444" },
		{ name: "success", hex: overrides?.success ?? "#10B981" },
		{ name: "warning", hex: overrides?.warning ?? "#F59E0B" },
		{ name: "info", hex: overrides?.info ?? "#3B82F6" },
	];

	for (const status of statusColors) {
		const scale = generateColorScale(status.name, status.hex);
		scales.push(scale);
		for (const step of SHADE_STEPS) {
			tokens.push(
				makeToken(
					`color/${status.name}/${step}`,
					scale.shades[step],
					"primitives",
					{
						description: step === 500
							? `${status.name} ${step} [base:${status.hex}]`
							: `${status.name} ${step}`,
						originalValue: scale.hexValues[step],
					},
				),
			);
		}
	}

	// --- Typescale with responsive variants (min, sm, md) ---
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
					"primitives",
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
					"primitives",
					{
						type: "number",
						originalValue: `${lineHeights[variant]}px`,
						description: `${step.name} line height (${variant})`,
					},
				),
			);
		}
	}

	return { tokens, scales, radixGray };
}

// =========================================================================
// Abstractions — indirection layer, SINGLE MODE
// =========================================================================

function generateAbstractions(_config: BrandConfig): DesignToken[] {
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

	// --- Font family aliases ---
	tokens.push(
		makeToken(
			"font/family/primary",
			"{primitives.font.family.sans}",
			"abstractions",
			{
				type: "string",
				originalValue: "{primitives.font.family.sans}",
				description: "Primary font family",
			},
		),
	);
	tokens.push(
		makeToken(
			"font/family/secondary",
			"{primitives.font.family.serif}",
			"abstractions",
			{
				type: "string",
				originalValue: "{primitives.font.family.serif}",
				description: "Secondary font family",
			},
		),
	);
	tokens.push(
		makeToken(
			"font/family/tertiary",
			"{primitives.font.family.mono}",
			"abstractions",
			{
				type: "string",
				originalValue: "{primitives.font.family.mono}",
				description: "Tertiary font family",
			},
		),
	);

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
	const primary = "{primitives.color.brand-primary.500}";
	const danger = "{primitives.color.danger.500}";
	const success = "{primitives.color.success.500}";
	const warning = "{primitives.color.warning.500}";
	const info = "{primitives.color.info.500}";

	const defs: SemanticDef[] = [
		// --- Core semantic tokens ---
		{
			name: "background",
			light: surfL(2),
			dark: surfD(1),
			description: "Default page background",
		},
		{
			name: "foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Default text color",
		},
		{
			name: "card",
			light: surfL(1),
			dark: surfD(2),
			description: "Card background",
		},
		{
			name: "card-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Card text color",
		},
		{
			name: "popover",
			light: surfL(1),
			dark: surfD(4),
			description: "Popover/dropdown background",
		},
		{
			name: "popover-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Popover text color",
		},
		{
			name: "primary",
			light: primary,
			dark: primary,
			description: "Primary color",
		},
		{
			name: "primary-foreground",
			light: surfL(1),
			dark: surfD(12),
			description: "Text on primary background",
		},
		{
			name: "secondary",
			light: surfL(3),
			dark: surfD(3),
			description: "Secondary/component background",
		},
		{
			name: "secondary-foreground",
			light: surfL(11),
			dark: surfD(11),
			description: "Secondary foreground text",
		},
		{
			name: "muted",
			light: surfL(3),
			dark: surfD(3),
			description: "Muted background",
		},
		{
			name: "muted-foreground",
			light: surfL(11),
			dark: surfD(11),
			description: "Muted/secondary text",
		},
		{
			name: "accent",
			light: surfL(4),
			dark: surfD(6),
			description: "Accent background",
		},
		{
			name: "accent-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Accent foreground text",
		},
		{
			name: "destructive",
			light: danger,
			dark: danger,
			description: "Destructive action color",
		},
		{
			name: "success",
			light: success,
			dark: success,
			description: "Success status color",
		},
		{
			name: "warning",
			light: warning,
			dark: warning,
			description: "Warning status color",
		},
		{
			name: "info",
			light: info,
			dark: info,
			description: "Info status color",
		},
		{
			name: "border",
			light: surfL(4),
			dark: surfD(6),
			description: "Default border color",
		},
		{
			name: "input",
			light: surfL(5),
			dark: surfD(7),
			description: "Input border color",
		},
		{
			name: "ring",
			light: surfL(6),
			dark: surfD(8),
			description: "Focus ring color",
		},

		// --- Chart colors ---
		{
			name: "chart-1",
			light: primary,
			dark: primary,
			description: "Chart color 1",
		},
		{
			name: "chart-2",
			light: primary,
			dark: primary,
			description: "Chart color 2",
		},
		{
			name: "chart-3",
			light: primary,
			dark: primary,
			description: "Chart color 3",
		},
		{
			name: "chart-4",
			light: primary,
			dark: primary,
			description: "Chart color 4",
		},
		{
			name: "chart-5",
			light: primary,
			dark: primary,
			description: "Chart color 5",
		},

		// --- Sidebar tokens ---
		{
			name: "sidebar",
			light: surfL(3),
			dark: surfD(3),
			description: "Sidebar background",
		},
		{
			name: "sidebar-foreground",
			light: "{semantics.foreground}",
			dark: "{semantics.foreground}",
			description: "Sidebar text",
		},
		{
			name: "sidebar-primary",
			light: "{semantics.primary}",
			dark: "{semantics.primary}",
			description: "Sidebar primary color",
		},
		{
			name: "sidebar-primary-foreground",
			light: "{semantics.primary-foreground}",
			dark: "{semantics.primary-foreground}",
			description: "Sidebar primary foreground",
		},
		{
			name: "sidebar-accent",
			light: "{semantics.accent}",
			dark: "{semantics.accent}",
			description: "Sidebar accent background",
		},
		{
			name: "sidebar-accent-foreground",
			light: "{semantics.accent-foreground}",
			dark: "{semantics.accent-foreground}",
			description: "Sidebar accent text",
		},
		{
			name: "sidebar-border",
			light: "{semantics.border}",
			dark: "{semantics.border}",
			description: "Sidebar border",
		},
		{
			name: "sidebar-ring",
			light: "{semantics.ring}",
			dark: "{semantics.ring}",
			description: "Sidebar focus ring",
		},

		// --- Static mode references ---
		{
			name: "light",
			light: surfL(1),
			dark: surfL(1),
			description: "Always-light surface (for forced-light contexts)",
		},
		{
			name: "dark",
			light: surfD(1),
			dark: surfD(1),
			description: "Always-dark surface (for forced-dark contexts)",
		},
	];

	// --- Secondary accent tokens ---
	if (hasSecondary) {
		defs.push(
			{
				name: "secondary-accent",
				light: "{primitives.color.brand-secondary.500}",
				dark: "{primitives.color.brand-secondary.500}",
				description: "Secondary accent color",
			},
		);
	}

	return defs;
}

function generateSemantics(config: BrandConfig): DesignToken[] {
	const defs = buildSemanticDefs(!!config.secondary);
	const tokens: DesignToken[] = [];

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
					`{primitives.font.typescale.${step.name}.size.${variant}}`,
					"responsive",
					{
						type: "number",
						originalValue: `{primitives.font.typescale.${step.name}.size.${variant}}`,
						description: `${step.name} font size (${mode})`,
						modeName: mode,
					},
				),
			);

			// line-height
			tokens.push(
				makeToken(
					`typography/${step.name}/line-height`,
					`{primitives.font.typescale.${step.name}.line-height.${variant}}`,
					"responsive",
					{
						type: "number",
						originalValue: `{primitives.font.typescale.${step.name}.line-height.${variant}}`,
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
	const lines: string[] = [];

	// Primitives as @theme inline
	lines.push("@theme inline {");

	// Brand primary color scale
	const brandScale = system.primitives.find((s) => s.name === "brand-primary");
	if (brandScale) {
		for (const step of SHADE_STEPS) {
			lines.push(`  --color-brand-primary-${step}: ${brandScale.hexValues[step]};`);
		}
	}

	// Brand secondary colors (sorted right after brand primary)
	const secondaryScale = system.primitives.find((s) => s.name === "brand-secondary");
	if (secondaryScale) {
		for (const step of SHADE_STEPS) {
			lines.push(
				`  --color-brand-secondary-${step}: ${secondaryScale.hexValues[step]};`,
			);
		}
	}

	// Status color ramps
	const statusOverrides = config.statusColors;
	const statusEntries = [
		{ name: "danger", hex: statusOverrides?.danger ?? "#EF4444" },
		{ name: "success", hex: statusOverrides?.success ?? "#10B981" },
		{ name: "warning", hex: statusOverrides?.warning ?? "#F59E0B" },
		{ name: "info", hex: statusOverrides?.info ?? "#3B82F6" },
	];
	for (const status of statusEntries) {
		const scale = generateColorScale(status.name, status.hex);
		for (const step of SHADE_STEPS) {
			lines.push(`  --color-${status.name}-${step}: ${scale.hexValues[step]};`);
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

	// Blur
	for (const [name, px] of Object.entries(BLUR_SCALE)) {
		lines.push(`  --blur-${name}: ${px}px;`);
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
		lines.push(`  --color-${def.name}: var(--${def.name});`);
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
		lines.push(`  --${def.name}: ${refToCssVar(def.light)};`);
	}

	lines.push("}");

	lines.push("");
	lines.push(".dark {");

	for (let i = 0; i < 12; i++) {
		lines.push(`  --color-gray-${i + 1}: ${radixGray.dark[i]};`);
	}

	for (const def of defs) {
		lines.push(`  --${def.name}: ${refToCssVar(def.dark)};`);
	}

	lines.push("}");

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

	// Primitive color references
	if (path.startsWith("primitives.color.")) {
		return `var(--color-${path.replace(/^primitives\.color\./, "").replace(/\./g, "-")})`;
	}

	// Self-references within semantics
	if (path.startsWith("semantics.")) {
		return `var(--${path.replace(/^semantics\./, "")})`;
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
	const typeSteps = computeTypescale(config.typescale);

	const styles: Record<string, any> = {
		paint: {},
		text: {},
		effect: {},
	};

	// --- Paint styles: semantic colors bound to variables ---
	const semanticPaint: Record<string, any> = {};
	const semanticDefs = buildSemanticDefs(!!config.secondary);
	for (const def of semanticDefs) {
		const styleName = def.name;
		const opacity = styleName === "accent" ? 0.8 : 1;
		const binding = {
			type: "variable",
			variableName: def.name,
			collectionName: "semantics",
		};

		if (opacity < 1) {
			semanticPaint[styleName] = {
				id: `generated-paint-${styleName}`,
				type: "color",
				fills: [
					{
						type: "linear",
						opacity,
						gradientStops: [
							{
								position: 0,
								color: "rgba(0, 0, 0, 1)",
								boundVariable: binding,
							},
							{
								position: 1,
								color: "rgba(0, 0, 0, 1)",
								boundVariable: binding,
							},
						],
						gradientTransform: [
							[1, 0, 0],
							[0, 1, 0],
						],
					},
				],
			};
		} else {
			semanticPaint[styleName] = {
				id: `generated-paint-${styleName}`,
				type: "color",
				fills: [
					{
						type: "solid",
						color: "rgba(0, 0, 0, 1)",
						opacity: 1,
						boundVariable: binding,
					},
				],
			};
		}
	}
	styles.paint = { semantics: semanticPaint };

	// --- Text styles: primary, secondary, tertiary (each font family) ---
	// Each family gets regular + strong variants for every typescale step
	const fontFamilies = [
		{ key: "primary", fontName: fontNames.sans, familyVar: "font/family/primary", collection: "abstractions" },
		{ key: "secondary", fontName: fontNames.serif, familyVar: "font/family/secondary", collection: "abstractions" },
		{ key: "tertiary", fontName: fontNames.mono, familyVar: "font/family/tertiary", collection: "abstractions" },
	];

	const textStyles: Record<string, Record<string, any>> = {};

	for (const family of fontFamilies) {
		const group: Record<string, any> = {};

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
				variableName: family.familyVar,
				collectionName: family.collection,
			};

			group[step.name] = {
				id: `generated-text-${family.key}-${step.name}`,
				type: "text",
				fontFamily: family.fontName,
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
			};
		}

		textStyles[family.key] = group;
	}
	styles.text = textStyles;

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

	const blurs: Record<string, any> = {};
	const backdropBlurs: Record<string, any> = {};
	for (const [name, px] of Object.entries(BLUR_SCALE)) {
		const radiusBoundVariable = {
			variableName: `blur/${name}`,
			collectionName: "primitives",
		};
		blurs[name] = {
			id: `generated-blur-${name}`,
			type: "effect",
			effects: [{ type: "layer-blur", radius: `${px}px`, visible: true, radiusBoundVariable }],
		};
		backdropBlurs[name] = {
			id: `generated-backdrop-blur-${name}`,
			type: "effect",
			effects: [{ type: "background-blur", radius: `${px}px`, visible: true, radiusBoundVariable }],
		};
	}

	styles.effect = { shadow: shadows, blur: blurs, "backdrop-blur": backdropBlurs };

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

	// Generate all three tiers
	const {
		tokens: primitiveTokens,
		scales,
		radixGray,
	} = generatePrimitives(config);

	const abstractionTokens = generateAbstractions(config);

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
