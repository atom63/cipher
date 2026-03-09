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
	/** Scale ratio key or numeric value (default: "major-third" = 1.25) */
	ratio: string;
	/** Number of sizes below base (default: 2, max: 4) */
	stepsDown: number;
	/** Number of sizes above base (default: 4, max: 7) */
	stepsUp: number;
}

export const DEFAULT_TYPESCALE: TypescaleConfig = {
	base: 16,
	ratio: "major-third",
	lineHeightBody: 150,
	lineHeightHeading: 125,
	stepsUp: 4,
	stepsDown: 2,
};

// Step names indexed from base outward
const STEP_NAMES_UP = ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"];
const STEP_NAMES_DOWN = ["sm", "xs", "2xs", "3xs"];

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

	// Upscales — heading line-height (largest first)
	for (let i = stepsUp; i >= 1; i--) {
		const size = round(c.base * ratio ** i);
		steps.push({
			name: STEP_NAMES_UP[i - 1],
			size,
			lineHeight: round(size * headingLh),
		});
	}

	// Base — body line-height
	const baseSize = round(c.base);
	steps.push({
		name: "base",
		size: baseSize,
		lineHeight: round(baseSize * bodyLh),
	});

	// Downscales — body line-height
	for (let i = 1; i <= stepsDown; i++) {
		const size = round(c.base / ratio ** i);
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
	micro: "83",
	xmicro: "167",
	short: "250",
	xshort: "333",
	medium: "500",
	xmedium: "667",
	long: "1000",
	xlong: "1500",
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
