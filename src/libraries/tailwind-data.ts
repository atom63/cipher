/**
 * Tailwind CSS Library Data
 * Generates token data from Tailwind's default theme
 */

import type { DesignToken } from "../types/tokens";

// Tailwind's default color palette
const TAILWIND_COLORS = {
	slate: {
		50: "#f8fafc",
		100: "#f1f5f9",
		200: "#e2e8f0",
		300: "#cbd5e1",
		400: "#94a3b8",
		500: "#64748b",
		600: "#475569",
		700: "#334155",
		800: "#1e293b",
		900: "#0f172a",
		950: "#020617",
	},
	gray: {
		50: "#f9fafb",
		100: "#f3f4f6",
		200: "#e5e7eb",
		300: "#d1d5db",
		400: "#9ca3af",
		500: "#6b7280",
		600: "#4b5563",
		700: "#374151",
		800: "#1f2937",
		900: "#111827",
		950: "#030712",
	},
	zinc: {
		50: "#fafafa",
		100: "#f4f4f5",
		200: "#e4e4e7",
		300: "#d4d4d8",
		400: "#a1a1aa",
		500: "#71717a",
		600: "#52525b",
		700: "#3f3f46",
		800: "#27272a",
		900: "#18181b",
		950: "#09090b",
	},
	neutral: {
		50: "#fafafa",
		100: "#f5f5f5",
		200: "#e5e5e5",
		300: "#d4d4d4",
		400: "#a3a3a3",
		500: "#737373",
		600: "#525252",
		700: "#404040",
		800: "#262626",
		900: "#171717",
		950: "#0a0a0a",
	},
	stone: {
		50: "#fafaf9",
		100: "#f5f5f4",
		200: "#e7e5e4",
		300: "#d6d3d1",
		400: "#a8a29e",
		500: "#78716c",
		600: "#57534e",
		700: "#44403c",
		800: "#292524",
		900: "#1c1917",
		950: "#0c0a09",
	},
	red: {
		50: "#fef2f2",
		100: "#fee2e2",
		200: "#fecaca",
		300: "#fca5a5",
		400: "#f87171",
		500: "#ef4444",
		600: "#dc2626",
		700: "#b91c1c",
		800: "#991b1b",
		900: "#7f1d1d",
		950: "#450a0a",
	},
	orange: {
		50: "#fff7ed",
		100: "#ffedd5",
		200: "#fed7aa",
		300: "#fdba74",
		400: "#fb923c",
		500: "#f97316",
		600: "#ea580c",
		700: "#c2410c",
		800: "#9a3412",
		900: "#7c2d12",
		950: "#431407",
	},
	amber: {
		50: "#fffbeb",
		100: "#fef3c7",
		200: "#fde68a",
		300: "#fcd34d",
		400: "#fbbf24",
		500: "#f59e0b",
		600: "#d97706",
		700: "#b45309",
		800: "#92400e",
		900: "#78350f",
		950: "#451a03",
	},
	yellow: {
		50: "#fefce8",
		100: "#fef9c3",
		200: "#fef08a",
		300: "#fde047",
		400: "#facc15",
		500: "#eab308",
		600: "#ca8a04",
		700: "#a16207",
		800: "#854d0e",
		900: "#713f12",
		950: "#422006",
	},
	lime: {
		50: "#f7fee7",
		100: "#ecfccb",
		200: "#d9f99d",
		300: "#bef264",
		400: "#a3e635",
		500: "#84cc16",
		600: "#65a30d",
		700: "#4d7c0f",
		800: "#3f6212",
		900: "#365314",
		950: "#1a2e05",
	},
	green: {
		50: "#f0fdf4",
		100: "#dcfce7",
		200: "#bbf7d0",
		300: "#86efac",
		400: "#4ade80",
		500: "#22c55e",
		600: "#16a34a",
		700: "#15803d",
		800: "#166534",
		900: "#14532d",
		950: "#052e16",
	},
	emerald: {
		50: "#ecfdf5",
		100: "#d1fae5",
		200: "#a7f3d0",
		300: "#6ee7b7",
		400: "#34d399",
		500: "#10b981",
		600: "#059669",
		700: "#047857",
		800: "#065f46",
		900: "#064e3b",
		950: "#022c22",
	},
	teal: {
		50: "#f0fdfa",
		100: "#ccfbf1",
		200: "#99f6e4",
		300: "#5eead4",
		400: "#2dd4bf",
		500: "#14b8a6",
		600: "#0d9488",
		700: "#0f766e",
		800: "#115e59",
		900: "#134e4a",
		950: "#042f2e",
	},
	cyan: {
		50: "#ecfeff",
		100: "#cffafe",
		200: "#a5f3fc",
		300: "#67e8f9",
		400: "#22d3ee",
		500: "#06b6d4",
		600: "#0891b2",
		700: "#0e7490",
		800: "#155e75",
		900: "#164e63",
		950: "#083344",
	},
	sky: {
		50: "#f0f9ff",
		100: "#e0f2fe",
		200: "#bae6fd",
		300: "#7dd3fc",
		400: "#38bdf8",
		500: "#0ea5e9",
		600: "#0284c7",
		700: "#0369a1",
		800: "#075985",
		900: "#0c4a6e",
		950: "#082f49",
	},
	blue: {
		50: "#eff6ff",
		100: "#dbeafe",
		200: "#bfdbfe",
		300: "#93c5fd",
		400: "#60a5fa",
		500: "#3b82f6",
		600: "#2563eb",
		700: "#1d4ed8",
		800: "#1e40af",
		900: "#1e3a8a",
		950: "#172554",
	},
	indigo: {
		50: "#eef2ff",
		100: "#e0e7ff",
		200: "#c7d2fe",
		300: "#a5b4fc",
		400: "#818cf8",
		500: "#6366f1",
		600: "#4f46e5",
		700: "#4338ca",
		800: "#3730a3",
		900: "#312e81",
		950: "#1e1b4b",
	},
	violet: {
		50: "#f5f3ff",
		100: "#ede9fe",
		200: "#ddd6fe",
		300: "#c4b5fd",
		400: "#a78bfa",
		500: "#8b5cf6",
		600: "#7c3aed",
		700: "#6d28d9",
		800: "#5b21b6",
		900: "#4c1d95",
		950: "#2e1065",
	},
	purple: {
		50: "#faf5ff",
		100: "#f3e8ff",
		200: "#e9d5ff",
		300: "#d8b4fe",
		400: "#c084fc",
		500: "#a855f7",
		600: "#9333ea",
		700: "#7e22ce",
		800: "#6b21a8",
		900: "#581c87",
		950: "#3b0764",
	},
	fuchsia: {
		50: "#fdf4ff",
		100: "#fae8ff",
		200: "#f5d0fe",
		300: "#f0abfc",
		400: "#e879f9",
		500: "#d946ef",
		600: "#c026d3",
		700: "#a21caf",
		800: "#86198f",
		900: "#701a75",
		950: "#4a044e",
	},
	pink: {
		50: "#fdf2f8",
		100: "#fce7f3",
		200: "#fbcfe8",
		300: "#f9a8d4",
		400: "#f472b6",
		500: "#ec4899",
		600: "#db2777",
		700: "#be185d",
		800: "#9d174d",
		900: "#831843",
		950: "#500724",
	},
	rose: {
		50: "#fff1f2",
		100: "#ffe4e6",
		200: "#fecdd3",
		300: "#fda4af",
		400: "#fb7185",
		500: "#f43f5e",
		600: "#e11d48",
		700: "#be123c",
		800: "#9f1239",
		900: "#881337",
		950: "#4c0519",
	},
};

// Tailwind's default spacing scale (in pixels, assuming 1rem = 16px)
const TAILWIND_SPACING = {
	"0": 0,
	px: 1,
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

// Tailwind's default font sizes
const TAILWIND_FONT_SIZES = {
	xs: 12,
	sm: 14,
	base: 16,
	lg: 18,
	xl: 20,
	"2xl": 24,
	"3xl": 30,
	"4xl": 36,
	"5xl": 48,
	"6xl": 60,
	"7xl": 72,
	"8xl": 96,
	"9xl": 128,
};

// Tailwind's default border radius
const TAILWIND_BORDER_RADIUS = {
	none: 0,
	sm: 2,
	DEFAULT: 4,
	md: 6,
	lg: 8,
	xl: 12,
	"2xl": 16,
	"3xl": 24,
	full: 9999,
};

// Helper to convert hex to RGB object for Figma
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const cleanHex = hex.replace("#", "");
	const r = Number.parseInt(cleanHex.slice(0, 2), 16) / 255;
	const g = Number.parseInt(cleanHex.slice(2, 4), 16) / 255;
	const b = Number.parseInt(cleanHex.slice(4, 6), 16) / 255;
	return { r, g, b };
}

export interface TailwindColorPalette {
	category: "gray" | "color";
	displayName: string;
	name: string;
	shades: Record<string, string>;
}

export interface TailwindCategory {
	description: string;
	id: string;
	label: string;
	tokenCount: number;
}

// Tailwind color palette metadata
export const TAILWIND_COLOR_PALETTES: TailwindColorPalette[] = [
	// Grays
	{
		name: "slate",
		displayName: "Slate",
		category: "gray",
		shades: TAILWIND_COLORS.slate,
	},
	{
		name: "gray",
		displayName: "Gray",
		category: "gray",
		shades: TAILWIND_COLORS.gray,
	},
	{
		name: "zinc",
		displayName: "Zinc",
		category: "gray",
		shades: TAILWIND_COLORS.zinc,
	},
	{
		name: "neutral",
		displayName: "Neutral",
		category: "gray",
		shades: TAILWIND_COLORS.neutral,
	},
	{
		name: "stone",
		displayName: "Stone",
		category: "gray",
		shades: TAILWIND_COLORS.stone,
	},

	// Colors
	{
		name: "red",
		displayName: "Red",
		category: "color",
		shades: TAILWIND_COLORS.red,
	},
	{
		name: "orange",
		displayName: "Orange",
		category: "color",
		shades: TAILWIND_COLORS.orange,
	},
	{
		name: "amber",
		displayName: "Amber",
		category: "color",
		shades: TAILWIND_COLORS.amber,
	},
	{
		name: "yellow",
		displayName: "Yellow",
		category: "color",
		shades: TAILWIND_COLORS.yellow,
	},
	{
		name: "lime",
		displayName: "Lime",
		category: "color",
		shades: TAILWIND_COLORS.lime,
	},
	{
		name: "green",
		displayName: "Green",
		category: "color",
		shades: TAILWIND_COLORS.green,
	},
	{
		name: "emerald",
		displayName: "Emerald",
		category: "color",
		shades: TAILWIND_COLORS.emerald,
	},
	{
		name: "teal",
		displayName: "Teal",
		category: "color",
		shades: TAILWIND_COLORS.teal,
	},
	{
		name: "cyan",
		displayName: "Cyan",
		category: "color",
		shades: TAILWIND_COLORS.cyan,
	},
	{
		name: "sky",
		displayName: "Sky",
		category: "color",
		shades: TAILWIND_COLORS.sky,
	},
	{
		name: "blue",
		displayName: "Blue",
		category: "color",
		shades: TAILWIND_COLORS.blue,
	},
	{
		name: "indigo",
		displayName: "Indigo",
		category: "color",
		shades: TAILWIND_COLORS.indigo,
	},
	{
		name: "violet",
		displayName: "Violet",
		category: "color",
		shades: TAILWIND_COLORS.violet,
	},
	{
		name: "purple",
		displayName: "Purple",
		category: "color",
		shades: TAILWIND_COLORS.purple,
	},
	{
		name: "fuchsia",
		displayName: "Fuchsia",
		category: "color",
		shades: TAILWIND_COLORS.fuchsia,
	},
	{
		name: "pink",
		displayName: "Pink",
		category: "color",
		shades: TAILWIND_COLORS.pink,
	},
	{
		name: "rose",
		displayName: "Rose",
		category: "color",
		shades: TAILWIND_COLORS.rose,
	},
];

/**
 * Get color palettes organized by category
 */
export function getTailwindPalettesByCategory() {
	return {
		gray: TAILWIND_COLOR_PALETTES.filter((p) => p.category === "gray"),
		color: TAILWIND_COLOR_PALETTES.filter((p) => p.category === "color"),
	};
}

/**
 * Get preview colors for a specific Tailwind palette (all 11 shades)
 */
export function getTailwindPalettePreview(paletteName: string): string[] {
	const palette = TAILWIND_COLOR_PALETTES.find((p) => p.name === paletteName);
	if (!palette) return [];

	// Return shades in order: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
	const shadeKeys = [
		"50",
		"100",
		"200",
		"300",
		"400",
		"500",
		"600",
		"700",
		"800",
		"900",
		"950",
	];
	return shadeKeys.map((shade) => palette.shades[shade]);
}

/**
 * Get preview colors for Tailwind category overview (representative samples)
 */
export function getTailwindColorPreview(): string[] {
	// Show representative colors across different hues
	return [
		TAILWIND_COLORS.red[500],
		TAILWIND_COLORS.orange[500],
		TAILWIND_COLORS.amber[500],
		TAILWIND_COLORS.yellow[500],
		TAILWIND_COLORS.lime[500],
		TAILWIND_COLORS.green[500],
		TAILWIND_COLORS.emerald[500],
		TAILWIND_COLORS.teal[500],
		TAILWIND_COLORS.cyan[500],
		TAILWIND_COLORS.sky[500],
		TAILWIND_COLORS.blue[500],
		TAILWIND_COLORS.indigo[500],
		TAILWIND_COLORS.violet[500],
		TAILWIND_COLORS.purple[500],
		TAILWIND_COLORS.fuchsia[500],
		TAILWIND_COLORS.pink[500],
		TAILWIND_COLORS.rose[500],
	];
}

/**
 * Get token count for selected Tailwind color palettes
 */
export function getTailwindColorTokenCount(selectedPalettes: string[]): number {
	// Each palette has 11 shades (50-950)
	return selectedPalettes.length * 11;
}

export const TAILWIND_CATEGORIES: TailwindCategory[] = [
	{
		id: "colors",
		label: "Colors",
		description: "All Tailwind color palettes (22 colors × 11 shades)",
		tokenCount: 242,
	},
	{
		id: "spacing",
		label: "Spacing",
		description: "Spacing scale from 0 to 96",
		tokenCount: Object.keys(TAILWIND_SPACING).length,
	},
	{
		id: "fontSize",
		label: "Font Sizes",
		description: "Typography scale from xs to 9xl",
		tokenCount: Object.keys(TAILWIND_FONT_SIZES).length,
	},
	{
		id: "borderRadius",
		label: "Border Radius",
		description: "Border radius values",
		tokenCount: Object.keys(TAILWIND_BORDER_RADIUS).length,
	},
];

/**
 * Generate color tokens from selected Tailwind palettes
 */
export function generateTailwindColorTokens(
	selectedPalettes: string[],
	options: {
		namePrefix?: string;
	} = {},
): DesignToken[] {
	const { namePrefix = "tw" } = options;
	const tokens: DesignToken[] = [];

	for (const paletteName of selectedPalettes) {
		const palette = TAILWIND_COLOR_PALETTES.find((p) => p.name === paletteName);
		if (!palette) continue;

		for (const [shade, hexValue] of Object.entries(palette.shades)) {
			const rgbValue = hexToRgb(hexValue);
			tokens.push({
				id: `${namePrefix}-${paletteName}-${shade}`,
				name: `${paletteName}-${shade}`,
				figmaName: `${namePrefix}/${paletteName}/${shade}`,
				value: rgbValue,
				originalValue: hexValue,
				type: "color",
				category: "colors",
				action: "import",
				description: `Tailwind ${paletteName} ${shade}`,
				metadata: {
					source: "tailwind",
					colorName: paletteName,
					shade,
				},
			});
		}
	}

	return tokens;
}

/**
 * Generate design tokens from selected Tailwind categories
 */
export function generateTailwindTokens(
	selectedCategories: string[],
	options: {
		namePrefix?: string;
		selectedColorPalettes?: string[]; // For colors category
	} = {},
): DesignToken[] {
	const { namePrefix = "tw", selectedColorPalettes = [] } = options;
	const tokens: DesignToken[] = [];

	// Generate color tokens (only if palettes are specified)
	if (
		selectedCategories.includes("colors") &&
		selectedColorPalettes.length > 0
	) {
		tokens.push(
			...generateTailwindColorTokens(selectedColorPalettes, { namePrefix }),
		);
	}

	// Generate spacing tokens
	if (selectedCategories.includes("spacing")) {
		for (const [name, value] of Object.entries(TAILWIND_SPACING)) {
			tokens.push({
				id: `${namePrefix}-spacing-${name}`,
				name: `spacing-${name}`,
				figmaName: `${namePrefix}/spacing/${name}`,
				value,
				originalValue: String(value),
				type: "spacing",
				category: "spacing",
				action: "import",
				description: `Tailwind spacing ${name} (${value}px)`,
				metadata: {
					source: "tailwind",
					spacingName: name,
				},
			});
		}
	}

	// Generate font size tokens
	if (selectedCategories.includes("fontSize")) {
		for (const [name, value] of Object.entries(TAILWIND_FONT_SIZES)) {
			tokens.push({
				id: `${namePrefix}-text-${name}`,
				name: `text-${name}`,
				figmaName: `${namePrefix}/text/${name}`,
				value,
				originalValue: String(value),
				type: "fontSize",
				category: "typography",
				action: "import",
				description: `Tailwind text ${name} (${value}px)`,
				metadata: {
					source: "tailwind",
					fontSize: name,
				},
			});
		}
	}

	// Generate border radius tokens
	if (selectedCategories.includes("borderRadius")) {
		for (const [name, value] of Object.entries(TAILWIND_BORDER_RADIUS)) {
			const tokenName = name === "DEFAULT" ? "rounded" : `rounded-${name}`;
			tokens.push({
				id: `${namePrefix}-${tokenName}`,
				name: tokenName,
				figmaName: `${namePrefix}/radius/${name === "DEFAULT" ? "default" : name}`,
				value,
				originalValue: String(value),
				type: "borderRadius",
				category: "borders",
				action: "import",
				description: `Tailwind ${tokenName} (${value === 9999 ? "full" : `${value}px`})`,
				metadata: {
					source: "tailwind",
					radiusName: name,
				},
			});
		}
	}

	return tokens;
}

/**
 * Get token count for selected categories
 */
export function getTailwindTokenCount(selectedCategories: string[]): number {
	return selectedCategories.reduce((total, categoryId) => {
		const category = TAILWIND_CATEGORIES.find((c) => c.id === categoryId);
		return total + (category?.tokenCount || 0);
	}, 0);
}
