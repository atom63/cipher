// Radix gray palettes (1-12 scale, light + dark)
// Sourced directly from @radix-ui/colors for accuracy

import {
	gray,
	grayDark,
	mauve,
	mauveDark,
	olive,
	oliveDark,
	sage,
	sageDark,
	sand,
	sandDark,
	slate,
	slateDark,
} from "@radix-ui/colors";

export interface RadixGrayScale {
	dark: string[]; // 12 hex values (steps 1-12)
	label: string;
	light: string[]; // 12 hex values (steps 1-12)
	name: string;
}

/** Extract the 12 hex values from a Radix color object into an ordered array */
function toArray(obj: Record<string, string>): string[] {
	return Object.values(obj);
}

export const RADIX_GRAYS: RadixGrayScale[] = [
	{
		name: "gray",
		label: "Gray (neutral)",
		light: toArray(gray),
		dark: toArray(grayDark),
	},
	{
		name: "mauve",
		label: "Mauve (purple tint)",
		light: toArray(mauve),
		dark: toArray(mauveDark),
	},
	{
		name: "slate",
		label: "Slate (blue tint)",
		light: toArray(slate),
		dark: toArray(slateDark),
	},
	{
		name: "sage",
		label: "Sage (green tint)",
		light: toArray(sage),
		dark: toArray(sageDark),
	},
	{
		name: "olive",
		label: "Olive (yellow-green tint)",
		light: toArray(olive),
		dark: toArray(oliveDark),
	},
	{
		name: "sand",
		label: "Sand (warm tint)",
		light: toArray(sand),
		dark: toArray(sandDark),
	},
];

export function getRadixGray(name: string): RadixGrayScale | undefined {
	return RADIX_GRAYS.find((g) => g.name === name);
}

// White/black opacity scales (0-100)
export const OPACITY_STEPS = [
	0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;
export type OpacityStep = (typeof OPACITY_STEPS)[number];

export function whiteOpacity(step: OpacityStep): {
	r: number;
	g: number;
	b: number;
	a: number;
} {
	return { r: 1, g: 1, b: 1, a: step / 100 };
}

export function blackOpacity(step: OpacityStep): {
	r: number;
	g: number;
	b: number;
	a: number;
} {
	return { r: 0, g: 0, b: 0, a: step / 100 };
}
