// Color scale generator using OKLCH color space
// Generates perceptually uniform color scales from a single base color

import type { ColorValue } from "../types/tokens";

export interface OklchColor {
	c: number; // Chroma 0-0.4
	h: number; // Hue 0-360
	l: number; // Lightness 0-1
}

// Standard shade steps used by Tailwind/Radix-style scales
export const SHADE_STEPS = [
	50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export type ShadeStep = (typeof SHADE_STEPS)[number];

// Relative lightness positions for each shade step (0 = darkest, 1 = lightest)
// 500 is the anchor (the input color). Steps above interpolate toward white,
// steps below interpolate toward black — scaled to the input color's lightness.
const SHADE_POSITION: Record<ShadeStep, number> = {
	50: 0.97,
	100: 0.92,
	200: 0.82,
	300: 0.68,
	400: 0.50,
	500: 0.0, // anchor — uses input color's actual lightness
	600: -0.18,
	700: -0.38,
	800: -0.55,
	900: -0.72,
	950: -0.85,
};

/** Compute lightness for each shade, anchored to the input color's L */
function computeShadeLightness(baseL: number): Record<ShadeStep, number> {
	const result = {} as Record<ShadeStep, number>;
	for (const step of SHADE_STEPS) {
		const pos = SHADE_POSITION[step];
		if (pos > 0) {
			// Lighter shades: interpolate from baseL toward 1.0
			result[step] = baseL + pos * (1.0 - baseL);
		} else {
			// Darker shades (and 500): interpolate from baseL toward 0.0
			result[step] = baseL + pos * baseL;
		}
	}
	return result;
}

// Chroma multipliers — lighter and darker shades have reduced saturation
const SHADE_CHROMA_MULT: Record<ShadeStep, number> = {
	50: 0.15,
	100: 0.3,
	200: 0.5,
	300: 0.7,
	400: 0.88,
	500: 1.0,
	600: 0.95,
	700: 0.85,
	800: 0.72,
	900: 0.55,
	950: 0.4,
};

/** Convert sRGB (0-1) to OKLCH */
export function rgbToOklch(r: number, g: number, b: number): OklchColor {
	// sRGB to linear
	const toLinear = (v: number) =>
		v <= 0.040_45 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

	const lr = toLinear(r);
	const lg = toLinear(g);
	const lb = toLinear(b);

	// Linear RGB to LMS
	const l = 0.412_221_470_8 * lr + 0.536_332_536_3 * lg + 0.051_445_992_9 * lb;
	const m = 0.211_903_498_2 * lr + 0.680_699_545_1 * lg + 0.107_396_956_6 * lb;
	const s = 0.088_302_461_9 * lr + 0.281_718_837_6 * lg + 0.629_978_700_5 * lb;

	// Cube root
	const lc = Math.cbrt(l);
	const mc = Math.cbrt(m);
	const sc = Math.cbrt(s);

	// LMS to OKLab
	const L = 0.210_454_255_3 * lc + 0.793_617_785 * mc - 0.004_072_046_8 * sc;
	const a = 1.977_998_495_1 * lc - 2.428_592_205 * mc + 0.450_593_709_9 * sc;
	const bv = 0.025_904_037_1 * lc + 0.782_771_766_2 * mc - 0.808_675_766 * sc;

	// OKLab to OKLCH
	const C = Math.sqrt(a * a + bv * bv);
	let H = (Math.atan2(bv, a) * 180) / Math.PI;
	if (H < 0) H += 360;

	return { l: L, c: C, h: H };
}

/** Convert OKLCH to sRGB (0-1), clamped */
export function oklchToRgb(lch: OklchColor): ColorValue {
	const { l: L, c: C, h: H } = lch;

	// OKLCH to OKLab
	const hRad = (H * Math.PI) / 180;
	const a = C * Math.cos(hRad);
	const b = C * Math.sin(hRad);

	// OKLab to LMS (cube)
	const lc = L + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
	const mc = L - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
	const sc = L - 0.089_484_177_5 * a - 1.291_485_548 * b;

	const l = lc * lc * lc;
	const m = mc * mc * mc;
	const s = sc * sc * sc;

	// LMS to linear RGB
	let r = +4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s;
	let g = -1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s;
	let bv = -0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s;

	// Linear to sRGB
	const toSrgb = (v: number) =>
		v <= 0.003_130_8 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

	r = Math.max(0, Math.min(1, toSrgb(r)));
	g = Math.max(0, Math.min(1, toSrgb(g)));
	bv = Math.max(0, Math.min(1, toSrgb(bv)));

	return { r, g, b: bv };
}

/** Convert hex string to ColorValue */
export function hexToRgb(hex: string): ColorValue {
	hex = hex.replace("#", "");
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((c) => c + c)
			.join("");
	}
	return {
		r: Number.parseInt(hex.slice(0, 2), 16) / 255,
		g: Number.parseInt(hex.slice(2, 4), 16) / 255,
		b: Number.parseInt(hex.slice(4, 6), 16) / 255,
	};
}

/** Convert ColorValue to hex string */
export function rgbToHex(color: ColorValue): string {
	const toHex = (v: number) =>
		Math.round(v * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

export interface ColorScale {
	hexValues: Record<ShadeStep, string>;
	name: string;
	shades: Record<ShadeStep, ColorValue>;
}

/**
 * Generate a full color scale from a single base color.
 * Uses OKLCH for perceptually uniform lightness distribution.
 */
export function generateColorScale(name: string, baseHex: string): ColorScale {
	const baseRgb = hexToRgb(baseHex);
	const baseOklch = rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);
	const shadeLightness = computeShadeLightness(baseOklch.l);

	const shades = {} as Record<ShadeStep, ColorValue>;
	const hexValues = {} as Record<ShadeStep, string>;

	for (const step of SHADE_STEPS) {
		if (step === 500) {
			// 500 = exact input color, no remapping
			shades[step] = baseRgb;
			hexValues[step] = rgbToHex(baseRgb);
			continue;
		}

		const targetL = shadeLightness[step];
		const chromaMult = SHADE_CHROMA_MULT[step];

		const shade = oklchToRgb({
			l: targetL,
			c: baseOklch.c * chromaMult,
			h: baseOklch.h,
		});

		shades[step] = shade;
		hexValues[step] = rgbToHex(shade);
	}

	return { name, shades, hexValues };
}

// ---------------------------------------------------------------------------
// Neutral / surface scale generator (Radix-style 12-step)
// ---------------------------------------------------------------------------

export interface NeutralScale {
	dark: string[]; // 12 hex values
	light: string[]; // 12 hex values
}

// Target lightness for each of the 12 Radix steps (derived from Radix slate)
const NEUTRAL_L_LIGHT = [0.991, 0.983, 0.956, 0.932, 0.910, 0.887, 0.853, 0.794, 0.645, 0.611, 0.503, 0.241];
const NEUTRAL_L_DARK = [0.179, 0.213, 0.252, 0.283, 0.312, 0.347, 0.399, 0.489, 0.537, 0.583, 0.769, 0.949];

// Chroma per step — very low for neutrals, peaks at mid-range
const NEUTRAL_C_LIGHT = [0.002, 0.003, 0.004, 0.006, 0.007, 0.010, 0.011, 0.016, 0.017, 0.016, 0.014, 0.010];
const NEUTRAL_C_DARK = [0.004, 0.004, 0.006, 0.007, 0.008, 0.010, 0.012, 0.016, 0.015, 0.015, 0.010, 0.003];

/**
 * Generate a Radix-style 12-step neutral scale from a tint color.
 * Extracts the hue from the input and applies it at very low chroma.
 * @param saturation — multiplier for chroma (0 = pure gray, 1 = default, 2 = double saturation)
 */
export function generateNeutralScale(tintHex: string, saturation = 1): NeutralScale {
	const rgb = hexToRgb(tintHex);
	const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
	const hue = oklch.h;

	const light: string[] = [];
	const dark: string[] = [];

	for (let i = 0; i < 12; i++) {
		light.push(rgbToHex(oklchToRgb({ l: NEUTRAL_L_LIGHT[i], c: NEUTRAL_C_LIGHT[i] * saturation, h: hue })));
		dark.push(rgbToHex(oklchToRgb({ l: NEUTRAL_L_DARK[i], c: NEUTRAL_C_DARK[i] * saturation, h: hue })));
	}

	return { light, dark };
}

/**
 * Adjust the chroma (saturation) of an array of hex colors by a multiplier.
 * Converts each hex to OKLCH, scales chroma, converts back.
 * @param multiplier — 0 = pure gray, 1 = unchanged, 2 = double saturation
 */
export function adjustSaturation(hexColors: string[], multiplier: number): string[] {
	if (multiplier === 1) return hexColors;
	return hexColors.map((hex) => {
		const rgb = hexToRgb(hex);
		const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
		return rgbToHex(oklchToRgb({ l: oklch.l, c: oklch.c * multiplier, h: oklch.h }));
	});
}
