// Standard token presets for non-color tokens
// Spacing, radius, shadows, typography — ready for Tailwind CSS usage

// =========================================================================
// Spacing — Tailwind-compatible 4px grid
// =========================================================================

export const SPACING_SCALE: Record<string, number> = {
	"0": 0,
	"0.5": 2,
	"1": 4,
	"1.5": 6,
	"2": 8,
	"2.5": 10,
	"3": 12,
	"3.5": 14,
	"4": 16,
	"5": 20,
	"6": 24,
	"7": 28,
	"8": 32,
	"9": 36,
	"10": 40,
	"11": 44,
	"12": 48,
	"14": 56,
	"16": 64,
	"20": 80,
	"24": 96,
	"28": 112,
	"32": 128,
	"36": 144,
	"40": 160,
	"44": 176,
	"48": 192,
	"52": 208,
	"56": 224,
	"60": 240,
	"64": 256,
	"72": 288,
	"80": 320,
	"96": 384,
};

// =========================================================================
// Radius — Anchor-based with t-shirt sizes
// Computed from a single anchor value + optional multiplier
// =========================================================================

export interface RadiusConfig {
	/** The anchor radius in px (default: 10) — maps to "lg" */
	anchor: number;
	/** Global multiplier (0 = square, 1 = default, 1.5 = extra round) */
	multiplier: number;
}

/** Offsets from the anchor value for each t-shirt size */
const RADIUS_OFFSETS: Record<string, number> = {
	none: Number.NEGATIVE_INFINITY, // special: always 0
	"2xs": -8,
	xs: -6,
	sm: -4,
	md: -2,
	lg: 0, // anchor
	xl: 4,
	"2xl": 8,
	"3xl": 12,
	"4xl": 16,
	full: Number.POSITIVE_INFINITY, // special: always 9999
};

/** Accepts either a plain anchor number (multiplier=1) or a full RadiusConfig */
export function computeRadiusScale(
	input: number | RadiusConfig,
): Record<string, number> {
	const config: RadiusConfig =
		typeof input === "number" ? { anchor: input, multiplier: 1 } : input;
	const scale: Record<string, number> = {};
	for (const [name, offset] of Object.entries(RADIUS_OFFSETS)) {
		if (name === "none") {
			scale[name] = 0;
		} else if (name === "full") {
			scale[name] = 9999 * config.multiplier;
		} else {
			scale[name] = Math.max(0, (config.anchor + offset) * config.multiplier);
		}
	}
	return scale;
}

export const DEFAULT_RADIUS: RadiusConfig = { anchor: 10, multiplier: 1 };

// =========================================================================
// Shadows — Multi-layer elevation levels 0-6
// Each level uses layered shadows for realistic depth
// =========================================================================

export interface ShadowLayer {
	blur: number;
	offsetX: number;
	offsetY: number;
	opacity: number;
	spread: number;
}

export const SHADOW_SCALE: Record<string, ShadowLayer[]> = {
	"0": [{ offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 }],
	"1": [
		{ offsetX: 0, offsetY: 1, blur: 2, spread: 0, opacity: 0.05 },
		{ offsetX: 0, offsetY: 1, blur: 3, spread: 0, opacity: 0.1 },
	],
	"2": [
		{ offsetX: 0, offsetY: 1, blur: 3, spread: 0, opacity: 0.04 },
		{ offsetX: 0, offsetY: 4, blur: 6, spread: -1, opacity: 0.1 },
	],
	"3": [
		{ offsetX: 0, offsetY: 4, blur: 6, spread: -2, opacity: 0.05 },
		{ offsetX: 0, offsetY: 10, blur: 15, spread: -3, opacity: 0.1 },
	],
	"4": [
		{ offsetX: 0, offsetY: 8, blur: 10, spread: -3, opacity: 0.04 },
		{ offsetX: 0, offsetY: 20, blur: 25, spread: -5, opacity: 0.1 },
	],
	"5": [
		{ offsetX: 0, offsetY: 10, blur: 15, spread: -3, opacity: 0.04 },
		{ offsetX: 0, offsetY: 25, blur: 50, spread: -12, opacity: 0.1 },
	],
	"6": [
		{ offsetX: 0, offsetY: 12, blur: 20, spread: -4, opacity: 0.04 },
		{ offsetX: 0, offsetY: 30, blur: 60, spread: -18, opacity: 0.12 },
	],
};

function shadowLayerToCss(layer: ShadowLayer): string {
	return `${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px rgba(0, 0, 0, ${layer.opacity})`;
}

export function shadowToCss(defOrLayers: ShadowLayer | ShadowLayer[]): string {
	const layers = Array.isArray(defOrLayers) ? defOrLayers : [defOrLayers];
	return layers.map(shadowLayerToCss).join(", ");
}

// =========================================================================
// Blur — Tailwind-aligned blur scale
// =========================================================================

export const BLUR_SCALE: Record<string, number> = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	"2xl": 40,
	"3xl": 64,
};

// =========================================================================
// Typography — Mathematical modular type scale
// =========================================================================

export interface TypeStep {
	lineHeight: number;
	name: string;
	size: number;
}

// --- Scale ratios ---

export interface TypescaleRatio {
	label: string;
	value: number;
}

export const TYPESCALE_RATIOS: Record<string, TypescaleRatio> = {
	"minor-second": { label: "Minor Second", value: 1.067 },
	"major-second": { label: "Major Second", value: 1.125 },
	"minor-third": { label: "Minor Third", value: 1.2 },
	"major-third": { label: "Major Third", value: 1.25 },
	"perfect-fourth": { label: "Perfect Fourth", value: 1.333 },
	// biome-ignore lint/suspicious/noApproximativeNumericConstant: Intentional design typography ratio, not an approximation of Math.SQRT2
	"augmented-fourth": { label: "Augmented Fourth", value: 1.414 },
	"perfect-fifth": { label: "Perfect Fifth", value: 1.5 },
	"golden-ratio": { label: "Golden Ratio", value: 1.618 },
};

// --- Typescale config ---

export interface TypescaleConfig {
	/** Base font size in px (default: 16) */
	base: number;
	/** Line-height for body text (base + downscales) as percentage (default: 150) */
	lineHeightBody: number;
	/** Line-height for headings (upscales) as percentage (default: 125) */
	lineHeightHeading: number;
	/** Maximum font size cap in px (default: 128). Prevents aggressive ratios (e.g. golden) from producing impractical sizes. */
	maxSize?: number;
	/** Scale ratio key or numeric value (default: "major-third" = 1.25) */
	ratio: string;
	/** Number of sizes below base (default: 2, max: 2 — matches Tailwind xs/sm) */
	stepsDown: number;
	/** Number of sizes above base (default: 6, max: 10 — matches Tailwind lg…9xl) */
	stepsUp: number;
}

export const DEFAULT_TYPESCALE: TypescaleConfig = {
	base: 16,
	maxSize: 128,
	ratio: "major-third",
	lineHeightBody: 150,
	lineHeightHeading: 125,
	stepsUp: 6,
	stepsDown: 2,
};

// Step names indexed from base outward — matches Tailwind CSS text sizes
const STEP_NAMES_UP = ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"];
const STEP_NAMES_DOWN = ["sm", "xs"];

/** Resolve ratio key to numeric value */
export function resolveRatio(ratioKey: string): number {
	return TYPESCALE_RATIOS[ratioKey]?.value ?? (Number(ratioKey) || 1.25);
}

/** Compute a modular type scale from config */
export function computeTypescale(config?: TypescaleConfig): TypeStep[] {
	const c = { ...DEFAULT_TYPESCALE, ...config };
	const ratio = resolveRatio(c.ratio);
	const headingLh = c.lineHeightHeading / 100;
	const bodyLh = c.lineHeightBody / 100;
	const stepsUp = Math.min(c.stepsUp, STEP_NAMES_UP.length);
	const stepsDown = Math.min(c.stepsDown, STEP_NAMES_DOWN.length);

	const round = (v: number) => Math.round(v);

	const steps: TypeStep[] = [];

	// Upscales — lg uses body line-height (large body text), rest use heading
	const maxSize = c.maxSize ?? 128;
	for (let i = stepsUp; i >= 1; i--) {
		const size = Math.min(maxSize, round(c.base * ratio ** i));
		const lh = i === 1 ? bodyLh : headingLh; // lg (i=1) is large body, not a heading
		steps.push({
			name: STEP_NAMES_UP[i - 1],
			size,
			lineHeight: round(size * lh),
		});
	}

	// Base — body line-height
	const baseSize = round(c.base);
	steps.push({
		name: "base",
		size: baseSize,
		lineHeight: round(baseSize * bodyLh),
	});

	// Downscales — body line-height (floor at 11px for web legibility)
	const MIN_FONT_SIZE = 11;
	for (let i = 1; i <= stepsDown; i++) {
		const size = Math.max(MIN_FONT_SIZE, round(c.base / ratio ** i));
		steps.push({
			name: STEP_NAMES_DOWN[i - 1],
			size,
			lineHeight: round(size * bodyLh),
		});
	}

	return steps;
}

// =========================================================================
// Duration — Named semantic scale
// =========================================================================

export const DURATION_RAW: Record<string, number> = {
	none: 0,
	"83": 83,
	"150": 150,
	"167": 167,
	"250": 250,
	"333": 333,
	"500": 500,
	"667": 667,
	"1000": 1000,
	"1500": 1500,
};

export const DURATION_SEMANTIC: Record<string, string> = {
	instant: "none",
	fast: "150",
	normal: "250",
	slow: "500",
	slower: "1000",
};

// =========================================================================
// Font families — Semantic font stack tokens
// =========================================================================

export const FONT_FAMILIES: Record<string, string> = {
	sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
	serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
	mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};

export interface FontOverrides {
	mono?: string;
	sans?: string;
	serif?: string;
}

const SYSTEM_FALLBACKS: Record<string, string> = {
	sans: ", ui-sans-serif, system-ui, -apple-system, sans-serif",
	serif: ", ui-serif, Georgia, Cambria, serif",
	mono: ", ui-monospace, SFMono-Regular, Menlo, monospace",
};

/** Build font stacks with optional custom font names prepended to system fallbacks */
export function buildFontFamilies(
	overrides?: FontOverrides,
): Record<string, string> {
	if (!overrides) return { ...FONT_FAMILIES };
	const result = { ...FONT_FAMILIES };
	for (const key of ["sans", "serif", "mono"] as const) {
		const name = overrides[key]?.trim();
		if (name) {
			result[key] = `'${name}'${SYSTEM_FALLBACKS[key]}`;
		}
	}
	return result;
}

/** Default font names for Figma (single family, no CSS stack) */
export const DEFAULT_FONT_NAMES: Record<string, string> = {
	sans: "Inter",
	serif: "PT Serif",
	mono: "Geist Mono",
};

/** Resolve clean font names for Figma variable binding (no CSS fallback stacks) */
export function resolveFontNames(
	overrides?: FontOverrides,
): Record<string, string> {
	return {
		sans: overrides?.sans?.trim() || DEFAULT_FONT_NAMES.sans,
		serif: overrides?.serif?.trim() || DEFAULT_FONT_NAMES.serif,
		mono: overrides?.mono?.trim() || DEFAULT_FONT_NAMES.mono,
	};
}

// =========================================================================
// Font weights — Named weight scale
// =========================================================================

export const FONT_WEIGHTS: Record<string, number> = {
	thin: 100,
	extralight: 200,
	light: 300,
	normal: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
	extrabold: 800,
	black: 900,
};

/** Numeric key → label (for primitives: font/weight/100 = "thin") */
export const FONT_WEIGHT_LABELS: Record<string, string> = {
	"100": "thin",
	"200": "extra light",
	"300": "light",
	"400": "regular",
	"500": "medium",
	"600": "semi bold",
	"700": "bold",
	"800": "extra bold",
	"900": "black",
	"950": "extra black",
};

/** Named key → numeric value (for primitives: font/weight/variable/thin = 100) */
export const FONT_WEIGHT_VARIABLE: Record<string, number> = {
	thin: 100,
	"extra-light": 200,
	light: 300,
	regular: 400,
	medium: 500,
	"semi-bold": 600,
	bold: 700,
	"extra-bold": 800,
	black: 900,
	"extra-black": 950,
};

// =========================================================================
// Z-index layers — Semantic stacking context scale
// =========================================================================

export const ZLAYER_SCALE: Record<string, number> = {
	default: 0,
	base: 10,
	header: 50,
	dropdown: 100,
	smoke: 500,
	modal: 900,
	toast: 999,
};

// =========================================================================
// Sizes — Same as spacing (used for width/height)
// =========================================================================

export const SIZES_SCALE: Record<string, number> = {
	"0": 0,
	"1": 4,
	"2": 8,
	"3": 12,
	"4": 16,
	"5": 20,
	"6": 24,
	"7": 28,
	"8": 32,
	"9": 36,
	"10": 40,
	"11": 44,
	"12": 48,
	"14": 56,
	"16": 64,
	"20": 80,
	"24": 96,
	"28": 112,
	"32": 128,
	"36": 144,
	"40": 160,
	"44": 176,
	"48": 192,
	"52": 208,
	"56": 224,
	"60": 240,
	"64": 256,
	"72": 288,
	"80": 320,
	"96": 384,
};

// =========================================================================
// Containers — Named max-width scale
// =========================================================================

export const CONTAINER_SCALE: Record<string, number> = {
	"3xs": 256,
	"2xs": 288,
	xs: 320,
	sm: 384,
	md: 448,
	lg: 512,
	xl: 576,
	"2xl": 672,
	"3xl": 768,
	"4xl": 896,
	"5xl": 1024,
	"6xl": 1152,
	"7xl": 1280,
};

// =========================================================================
// Breakpoints — Responsive breakpoints
// =========================================================================

export const BREAKPOINTS: Record<string, number> = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536,
};

// =========================================================================
// Motion easing — Cubic bezier curves
// =========================================================================

export const EASING_CURVES: Record<string, string> = {
	linear: "cubic-bezier(0, 0, 1, 1)",
	fast: "cubic-bezier(0, 0, 0, 1)",
	pointToPoint: "cubic-bezier(0.55, 0.55, 0, 1)",
	spring: "cubic-bezier(0.13, 1.62, 0, 0.92)",
	soft: "cubic-bezier(1, 0, 1, 1)",
	inOut: "cubic-bezier(0.63, 0.05, 0.01, 0.99)",
};

// =========================================================================
// Screen — Device screen widths
// =========================================================================

export const SCREEN_SIZES: Record<string, number> = {
	"iphone-16-pro": 402,
	"ipad-pro-11": 834,
	"macbook-air": 1280,
	"macbook-pro-16": 1728,
};

// =========================================================================
// Additional accent colors — Static palette beyond primary/secondary
// =========================================================================

export const ACCENT_PALETTE: Record<string, string> = {
	red: "rgba(229, 72, 77, 1)",
	crimson: "rgba(233, 61, 130, 1)",
	jade: "rgba(41, 163, 131, 1)",
	amber: "rgba(255, 197, 61, 1)",
	orange: "rgba(247, 107, 21, 1)",
	purple: "rgba(142, 78, 198, 1)",
};

// =========================================================================
// Typography CSS generator
// =========================================================================

/** Generate typography CSS custom properties */
export function generateTypographyCss(steps: TypeStep[]): string {
	const lines: string[] = [];

	lines.push(":root {");
	for (const step of steps) {
		lines.push(`  --typography-${step.name}-font-size: ${step.size}px;`);
		lines.push(
			`  --typography-${step.name}-line-height: ${step.lineHeight}px;`,
		);
	}
	lines.push("}");

	return lines.join("\n");
}
