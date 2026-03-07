// Bundled Radix gray palettes (1-12 scale, light + dark)
// Source: https://www.radix-ui.com/colors
// Each palette has 12 steps optimized for UI: backgrounds, borders, text

export interface RadixGrayScale {
	name: string;
	label: string;
	light: string[]; // 12 hex values (steps 1-12)
	dark: string[]; // 12 hex values (steps 1-12)
}

export const RADIX_GRAYS: RadixGrayScale[] = [
	{
		name: "gray",
		label: "Gray (neutral)",
		light: [
			"#fcfcfc", "#f9f9f9", "#f0f0f0", "#e8e8e8",
			"#e0e0e0", "#d9d9d9", "#cecece", "#bbbbbb",
			"#8d8d8d", "#838383", "#646464", "#202020",
		],
		dark: [
			"#111111", "#191919", "#222222", "#2a2a2a",
			"#313131", "#3a3a3a", "#484848", "#606060",
			"#6e6e6e", "#7b7b7b", "#b4b4b4", "#eeeeee",
		],
	},
	{
		name: "mauve",
		label: "Mauve (purple tint)",
		light: [
			"#fdfcfd", "#faf9fb", "#f2eff3", "#e9e5ed",
			"#e0dbe7", "#d8d2e1", "#cec6d9", "#b9aecb",
			"#8e8c99", "#84828e", "#65636d", "#211f26",
		],
		dark: [
			"#121113", "#1a191b", "#232225", "#2b292d",
			"#323035", "#3c393f", "#49474e", "#625f69",
			"#6f6d78", "#7c7a85", "#b5b2bc", "#eeeef0",
		],
	},
	{
		name: "slate",
		label: "Slate (blue tint)",
		light: [
			"#fcfcfd", "#f9f9fb", "#f0f0f3", "#e8e8ec",
			"#e0e1e6", "#d9d9e0", "#cdced6", "#b9bbc6",
			"#8b8d98", "#80838d", "#60646c", "#1c2024",
		],
		dark: [
			"#111113", "#18191b", "#212225", "#272a2d",
			"#2e3135", "#363a3f", "#43484e", "#5a6169",
			"#696e77", "#777b84", "#b0b4ba", "#edeef0",
		],
	},
	{
		name: "sage",
		label: "Sage (green tint)",
		light: [
			"#fbfdfc", "#f7f9f8", "#eef1f0", "#e6e9e8",
			"#dde0df", "#d5d9d8", "#c9cfcd", "#b4bcb9",
			"#868e8b", "#7c8481", "#5f6563", "#1a211e",
		],
		dark: [
			"#101211", "#171918", "#202221", "#272a29",
			"#2e3130", "#373b39", "#444947", "#5b625f",
			"#63706b", "#717d79", "#adb5b2", "#eceeed",
		],
	},
	{
		name: "olive",
		label: "Olive (yellow-green tint)",
		light: [
			"#fcfdfc", "#f8faf8", "#eff1ef", "#e7e9e7",
			"#dfe1df", "#d7d9d7", "#cbcfcb", "#b5bab5",
			"#898e87", "#7f847d", "#60655f", "#1d211c",
		],
		dark: [
			"#111210", "#181917", "#212220", "#282a27",
			"#2f312e", "#383a36", "#454843", "#5c625b",
			"#687066", "#767d74", "#afb5ad", "#eceeec",
		],
	},
	{
		name: "sand",
		label: "Sand (warm tint)",
		light: [
			"#fdfdfc", "#f9f9f8", "#f1f0ef", "#e9e8e6",
			"#e1dfdd", "#d9d6d3", "#cfcbc7", "#bcb5ae",
			"#8d8780", "#827c75", "#63605b", "#21201c",
		],
		dark: [
			"#111110", "#191918", "#222221", "#2a2a28",
			"#31312e", "#3b3a37", "#494844", "#62605b",
			"#6f6d66", "#7c7b74", "#b5b3ad", "#eeeeec",
		],
	},
];

export function getRadixGray(name: string): RadixGrayScale | undefined {
	return RADIX_GRAYS.find((g) => g.name === name);
}

// White/black opacity scales (0-100)
export const OPACITY_STEPS = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
export type OpacityStep = (typeof OPACITY_STEPS)[number];

export function whiteOpacity(step: OpacityStep): { r: number; g: number; b: number; a: number } {
	return { r: 1, g: 1, b: 1, a: step / 100 };
}

export function blackOpacity(step: OpacityStep): { r: number; g: number; b: number; a: number } {
	return { r: 0, g: 0, b: 0, a: step / 100 };
}
