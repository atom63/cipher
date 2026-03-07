/**
 * Radix Colors Library Data
 * Generates token data from @radix-ui/colors
 */

// @ts-expect-error - @radix-ui/colors is an optional peer dependency
import * as RadixColors from "@radix-ui/colors";
import type { DesignToken } from "../types/tokens";

export interface RadixPalette {
	name: string;
	displayName: string;
	category: "gray" | "color";
	description: string;
}

// All available Radix color palettes
export const RADIX_PALETTES: RadixPalette[] = [
	// Gray scales
	{
		name: "gray",
		displayName: "Gray",
		category: "gray",
		description: "Neutral gray scale",
	},
	{
		name: "mauve",
		displayName: "Mauve",
		category: "gray",
		description: "Mauve gray scale",
	},
	{
		name: "slate",
		displayName: "Slate",
		category: "gray",
		description: "Slate gray scale",
	},
	{
		name: "sage",
		displayName: "Sage",
		category: "gray",
		description: "Sage gray scale",
	},
	{
		name: "olive",
		displayName: "Olive",
		category: "gray",
		description: "Olive gray scale",
	},
	{
		name: "sand",
		displayName: "Sand",
		category: "gray",
		description: "Sand gray scale",
	},

	// Colors
	{
		name: "tomato",
		displayName: "Tomato",
		category: "color",
		description: "Red tomato",
	},
	{
		name: "red",
		displayName: "Red",
		category: "color",
		description: "Pure red",
	},
	{
		name: "ruby",
		displayName: "Ruby",
		category: "color",
		description: "Ruby red",
	},
	{
		name: "crimson",
		displayName: "Crimson",
		category: "color",
		description: "Crimson red",
	},
	{
		name: "pink",
		displayName: "Pink",
		category: "color",
		description: "Soft pink",
	},
	{
		name: "plum",
		displayName: "Plum",
		category: "color",
		description: "Plum purple",
	},
	{
		name: "purple",
		displayName: "Purple",
		category: "color",
		description: "Pure purple",
	},
	{
		name: "violet",
		displayName: "Violet",
		category: "color",
		description: "Violet purple",
	},
	{
		name: "iris",
		displayName: "Iris",
		category: "color",
		description: "Iris blue-purple",
	},
	{
		name: "indigo",
		displayName: "Indigo",
		category: "color",
		description: "Deep indigo",
	},
	{
		name: "blue",
		displayName: "Blue",
		category: "color",
		description: "Pure blue",
	},
	{
		name: "cyan",
		displayName: "Cyan",
		category: "color",
		description: "Bright cyan",
	},
	{
		name: "teal",
		displayName: "Teal",
		category: "color",
		description: "Teal blue-green",
	},
	{
		name: "jade",
		displayName: "Jade",
		category: "color",
		description: "Jade green",
	},
	{
		name: "green",
		displayName: "Green",
		category: "color",
		description: "Pure green",
	},
	{
		name: "grass",
		displayName: "Grass",
		category: "color",
		description: "Grass green",
	},
	{
		name: "bronze",
		displayName: "Bronze",
		category: "color",
		description: "Bronze brown",
	},
	{
		name: "gold",
		displayName: "Gold",
		category: "color",
		description: "Gold yellow",
	},
	{
		name: "brown",
		displayName: "Brown",
		category: "color",
		description: "Warm brown",
	},
	{
		name: "orange",
		displayName: "Orange",
		category: "color",
		description: "Bright orange",
	},
	{
		name: "amber",
		displayName: "Amber",
		category: "color",
		description: "Amber yellow",
	},
	{
		name: "yellow",
		displayName: "Yellow",
		category: "color",
		description: "Bright yellow",
	},
	{
		name: "lime",
		displayName: "Lime",
		category: "color",
		description: "Lime green",
	},
	{
		name: "mint",
		displayName: "Mint",
		category: "color",
		description: "Fresh mint",
	},
	{
		name: "sky",
		displayName: "Sky",
		category: "color",
		description: "Sky blue",
	},
];

// Helper to convert hex to RGB object for Figma
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const cleanHex = hex.replace("#", "");
	const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
	const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
	const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
	return { r, g, b };
}

// Helper to get color value from Radix Colors package
function getRadixColor(
	palette: string,
	mode: "light" | "dark",
	shade: number,
): string {
	const colorKey = mode === "dark" ? `${palette}Dark` : palette;
	const colors = (RadixColors as any)[colorKey];

	if (!colors) {
		console.warn(`Radix color ${colorKey} not found`);
		return "#000000";
	}

	const shadeKey = `${palette}${shade}`;
	return colors[shadeKey] || "#000000";
}

/**
 * Get preview colors for a palette (all 12 shades for full visual representation)
 */
export function getRadixPalettePreview(
	paletteName: string,
	mode: "light" | "dark" = "light",
): string[] {
	return Array.from({ length: 12 }, (_, i) =>
		getRadixColor(paletteName, mode, i + 1),
	);
}

/**
 * Generate design tokens from selected Radix palettes
 */
export function generateRadixTokens(
	selectedPalettes: string[],
	options: {
		includeDarkMode?: boolean;
		namePrefix?: string;
	} = {},
): DesignToken[] {
	const { includeDarkMode = true, namePrefix = "radix" } = options;
	const tokens: DesignToken[] = [];

	for (const paletteName of selectedPalettes) {
		const palette = RADIX_PALETTES.find((p) => p.name === paletteName);
		if (!palette) continue;

		// Generate shades 1-12 for light mode
		for (let shade = 1; shade <= 12; shade++) {
			const colorHex = getRadixColor(paletteName, "light", shade);
			const colorRgb = hexToRgb(colorHex);

			// Debug: log first and last shades
			if (shade === 1 || shade === 12) {
				console.log(
					`${paletteName}-${shade}: ${colorHex} -> RGB(${colorRgb.r.toFixed(3)}, ${colorRgb.g.toFixed(3)}, ${colorRgb.b.toFixed(3)})`,
				);
			}

			tokens.push({
				id: `${namePrefix}-${paletteName}-${shade}`,
				name: `${paletteName}-${shade}`,
				figmaName: `${namePrefix}/${paletteName}/${shade}`,
				value: colorRgb,
				originalValue: colorHex,
				type: "color",
				category: "colors",
				action: "import",
				description: `${palette.displayName} shade ${shade}`,
				metadata: {
					source: "radix",
					palette: paletteName,
					shade,
					mode: "light",
				},
			});
		}

		// Generate dark mode if enabled
		if (includeDarkMode) {
			for (let shade = 1; shade <= 12; shade++) {
				const colorHex = getRadixColor(paletteName, "dark", shade);
				const colorRgb = hexToRgb(colorHex);

				tokens.push({
					id: `${namePrefix}-${paletteName}-dark-${shade}`,
					name: `${paletteName}-dark-${shade}`,
					figmaName: `${namePrefix}/${paletteName}/dark/${shade}`,
					value: colorRgb,
					originalValue: colorHex,
					type: "color",
					category: "colors",
					action: "import",
					description: `${palette.displayName} dark shade ${shade}`,
					metadata: {
						source: "radix",
						palette: paletteName,
						shade,
						mode: "dark",
					},
				});
			}
		}
	}

	return tokens;
}

/**
 * Get token count for preview
 */
export function getRadixTokenCount(
	selectedPalettes: string[],
	includeDarkMode = true,
): number {
	const shadesPerPalette = 12;
	const modesCount = includeDarkMode ? 2 : 1;
	return selectedPalettes.length * shadesPerPalette * modesCount;
}

/**
 * Group palettes by category for UI
 */
export function getRadixPalettesByCategory() {
	return {
		gray: RADIX_PALETTES.filter((p) => p.category === "gray"),
		color: RADIX_PALETTES.filter((p) => p.category === "color"),
	};
}
