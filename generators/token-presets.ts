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
	none: -Infinity, // special: always 0
	"2xs": -8,
	xs: -6,
	sm: -4,
	md: -2,
	lg: 0, // anchor
	xl: 4,
	"2xl": 8,
	"3xl": 12,
	"4xl": 16,
	full: Infinity, // special: always 9999
};

export function computeRadiusScale(config: RadiusConfig): Record<string, number> {
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
// Shadows — Elevation levels 0-6
// =========================================================================

export interface ShadowDef {
	offsetX: number;
	offsetY: number;
	blur: number;
	spread: number;
	opacity: number;
}

export const SHADOW_SCALE: Record<string, ShadowDef> = {
	"0": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
	"1": { offsetX: 0, offsetY: 4, blur: 4, spread: -2, opacity: 0.06 },
	"2": { offsetX: 0, offsetY: 6, blur: 6, spread: -2, opacity: 0.06 },
	"3": { offsetX: 0, offsetY: 8, blur: 12, spread: -4, opacity: 0.08 },
	"4": { offsetX: 0, offsetY: 12, blur: 16, spread: -4, opacity: 0.06 },
	"5": { offsetX: 0, offsetY: 25, blur: 50, spread: -12, opacity: 0.08 },
	"6": { offsetX: 0, offsetY: 30, blur: 60, spread: -18, opacity: 0.12 },
};

export function shadowToCss(def: ShadowDef): string {
	return `${def.offsetX}px ${def.offsetY}px ${def.blur}px ${def.spread}px rgba(0, 0, 0, ${def.opacity})`;
}

// =========================================================================
// Typography — HIG-inspired responsive type scale
// =========================================================================

export interface TypeStep {
	name: string;
	sizes: { min: number; sm: number; md: number };
	lineHeights: { min: number; sm: number; md: number };
}

export const TYPE_SCALE: TypeStep[] = [
	{
		name: "large-title",
		sizes: { min: 28, sm: 32, md: 36 },
		lineHeights: { min: 34, sm: 40, md: 44 },
	},
	{
		name: "title-1",
		sizes: { min: 24, sm: 28, md: 30 },
		lineHeights: { min: 30, sm: 34, md: 38 },
	},
	{
		name: "title-2",
		sizes: { min: 20, sm: 22, md: 24 },
		lineHeights: { min: 26, sm: 28, md: 32 },
	},
	{
		name: "title-3",
		sizes: { min: 18, sm: 20, md: 20 },
		lineHeights: { min: 24, sm: 26, md: 26 },
	},
	{
		name: "headline",
		sizes: { min: 16, sm: 16, md: 16 },
		lineHeights: { min: 22, sm: 22, md: 22 },
	},
	{
		name: "body",
		sizes: { min: 14, sm: 14, md: 14 },
		lineHeights: { min: 20, sm: 20, md: 20 },
	},
	{
		name: "callout",
		sizes: { min: 14, sm: 14, md: 14 },
		lineHeights: { min: 20, sm: 20, md: 20 },
	},
	{
		name: "subhead",
		sizes: { min: 13, sm: 13, md: 13 },
		lineHeights: { min: 18, sm: 18, md: 18 },
	},
	{
		name: "footnote",
		sizes: { min: 12, sm: 12, md: 12 },
		lineHeights: { min: 16, sm: 16, md: 16 },
	},
	{
		name: "caption-1",
		sizes: { min: 11, sm: 11, md: 11 },
		lineHeights: { min: 14, sm: 14, md: 14 },
	},
	{
		name: "caption-2",
		sizes: { min: 10, sm: 10, md: 10 },
		lineHeights: { min: 12, sm: 12, md: 12 },
	},
];

// =========================================================================
// Duration — Named semantic scale
// =========================================================================

export const DURATION_RAW: Record<string, number> = {
	"none": 0,
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
