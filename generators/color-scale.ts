// Color scale generator using OKLCH color space
// Generates perceptually uniform color scales from a single base color

import type { ColorValue } from "../types/tokens";

export interface OklchColor {
	l: number; // Lightness 0-1
	c: number; // Chroma 0-0.4
	h: number; // Hue 0-360
}

// Standard shade steps used by Tailwind/Radix-style scales
export const SHADE_STEPS = [
	50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export type ShadeStep = (typeof SHADE_STEPS)[number];

// Target lightness values for each shade step (in OKLCH L)
// These produce a well-distributed scale from very light to very dark
const SHADE_LIGHTNESS: Record<ShadeStep, number> = {
	50: 0.97,
	100: 0.93,
	200: 0.87,
	300: 0.78,
	400: 0.68,
	500: 0.58,
	600: 0.48,
	700: 0.4,
	800: 0.32,
	900: 0.24,
	950: 0.17,
};

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

// Neutral gray scale lightness (no chroma)
const GRAY_LIGHTNESS: Record<ShadeStep, number> = {
	50: 0.98,
	100: 0.95,
	200: 0.9,
	300: 0.83,
	400: 0.71,
	500: 0.55,
	600: 0.45,
	700: 0.37,
	800: 0.27,
	900: 0.21,
	950: 0.14,
};

/** Convert sRGB (0-1) to OKLCH */
export function rgbToOklch(r: number, g: number, b: number): OklchColor {
	// sRGB to linear
	const toLinear = (v: number) =>
		v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

	const lr = toLinear(r);
	const lg = toLinear(g);
	const lb = toLinear(b);

	// Linear RGB to LMS
	const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
	const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
	const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

	// Cube root
	const lc = Math.cbrt(l);
	const mc = Math.cbrt(m);
	const sc = Math.cbrt(s);

	// LMS to OKLab
	const L = 0.2104542553 * lc + 0.793617785 * mc - 0.0040720468 * sc;
	const a = 1.9779984951 * lc - 2.428592205 * mc + 0.4505937099 * sc;
	const bv = 0.0259040371 * lc + 0.7827717662 * mc - 0.808675766 * sc;

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
	const lc = L + 0.3963377774 * a + 0.2158037573 * b;
	const mc = L - 0.1055613458 * a - 0.0638541728 * b;
	const sc = L - 0.0894841775 * a - 1.291485548 * b;

	const l = lc * lc * lc;
	const m = mc * mc * mc;
	const s = sc * sc * sc;

	// LMS to linear RGB
	let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	let bv = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

	// Linear to sRGB
	const toSrgb = (v: number) =>
		v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

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
	name: string;
	shades: Record<ShadeStep, ColorValue>;
	hexValues: Record<ShadeStep, string>;
}

/**
 * Generate a full color scale from a single base color.
 * Uses OKLCH for perceptually uniform lightness distribution.
 */
export function generateColorScale(name: string, baseHex: string): ColorScale {
	const baseRgb = hexToRgb(baseHex);
	const baseOklch = rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);

	const shades = {} as Record<ShadeStep, ColorValue>;
	const hexValues = {} as Record<ShadeStep, string>;

	for (const step of SHADE_STEPS) {
		const targetL = SHADE_LIGHTNESS[step];
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

/**
 * Generate a neutral gray scale with a slight hue tint.
 * The tint comes from the brand color for visual cohesion.
 */
export function generateGrayScale(name: string, brandHex?: string): ColorScale {
	// Use a very small chroma from the brand color for warmth
	let hue = 250; // default blue-gray
	let tintChroma = 0.005;

	if (brandHex) {
		const brandRgb = hexToRgb(brandHex);
		const brandOklch = rgbToOklch(brandRgb.r, brandRgb.g, brandRgb.b);
		hue = brandOklch.h;
		tintChroma = Math.min(brandOklch.c * 0.04, 0.01);
	}

	const shades = {} as Record<ShadeStep, ColorValue>;
	const hexValues = {} as Record<ShadeStep, string>;

	for (const step of SHADE_STEPS) {
		const shade = oklchToRgb({
			l: GRAY_LIGHTNESS[step],
			c: tintChroma,
			h: hue,
		});
		shades[step] = shade;
		hexValues[step] = rgbToHex(shade);
	}

	return { name, shades, hexValues };
}
