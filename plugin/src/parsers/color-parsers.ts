// Color parsing utilities
// Handles parsing of HEX, RGB, RGBA, HSL, HSLA, and OKLCH color formats

import type { ColorValue } from "../libraries/shared-types";

// Parse HEX color to ColorValue
export function parseHexColor(hex: string): ColorValue | null {
	hex = hex.replace("#", "");

	// Handle 3-digit hex (e.g., #RGB)
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((char) => char + char)
			.join("");
	}

	// Handle 4-digit hex with alpha (e.g., #RGBA)
	if (hex.length === 4) {
		hex = hex
			.split("")
			.map((char) => char + char)
			.join("");
	}

	// Validate hex characters
	if (!/^[0-9a-fA-F]+$/.test(hex)) return null;

	// Handle 6-digit hex (e.g., #RRGGBB)
	if (hex.length === 6) {
		const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
		const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
		const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
		return { r, g, b };
	}

	// Handle 8-digit hex with alpha (e.g., #RRGGBBAA)
	if (hex.length === 8) {
		const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
		const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
		const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
		const a = Number.parseInt(hex.slice(6, 8), 16) / 255;
		return { r, g, b, a };
	}

	return null;
}

// Parse RGB/RGBA color to ColorValue
export function parseRgbColor(rgb: string): ColorValue | null {
	// Match rgb(r, g, b) or rgba(r, g, b, a)
	const match = rgb.match(
		/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/,
	);
	if (!match) return null;

	const r = Number.parseFloat(match[1]) / 255;
	const g = Number.parseFloat(match[2]) / 255;
	const b = Number.parseFloat(match[3]) / 255;
	const a = match[4] ? Number.parseFloat(match[4]) : 1;

	return { r, g, b, a };
}

// Parse HSL/HSLA color to ColorValue
export function parseHslColor(hsl: string): ColorValue | null {
	// Match hsl(h, s%, l%) or hsla(h, s%, l%, a)
	const match = hsl.match(
		/hsla?\(\s*([0-9.]+)\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%(?:\s*,\s*([0-9.]+))?\s*\)/,
	);
	if (!match) return null;

	let h = Number.parseFloat(match[1]) / 360;
	const s = Number.parseFloat(match[2]) / 100;
	const l = Number.parseFloat(match[3]) / 100;
	const alpha = match[4] ? Number.parseFloat(match[4]) : 1;

	// Normalize h to 0-1
	h -= Math.floor(h);

	// Convert HSL to RGB
	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const r = hue2rgb(p, q, h + 1 / 3);
	const g = hue2rgb(p, q, h);
	const b = hue2rgb(p, q, h - 1 / 3);

	return { r, g, b, a: alpha };
}

// Parse OKLCH color to RGB (proper conversion)
export function parseOKLCHColor(oklch: string): ColorValue | null {
	// Support: oklch(L C H), oklch(L C H / alpha), oklch(L% C H), oklch(L% C H / alpha)
	// Hue can be "none" (achromatic) — treated as 0
	const match = oklch.match(
		/oklch\(([0-9.]+|none)(%?)\s+([0-9.]+|none)\s+([0-9.]+|none)(?:\s*\/\s*([0-9.]+%?))?\)/,
	);
	if (!match) return null;

	// L can be 0-1 (decimal) or 0-100 with % suffix; "none" → 0
	const L = match[1] === "none" ? 0 : match[2] === "%" ? Number.parseFloat(match[1]) / 100 : Number.parseFloat(match[1]);
	const C = match[3] === "none" ? 0 : Number.parseFloat(match[3]);
	const H = match[4] === "none" ? 0 : Number.parseFloat(match[4]);
	const alpha = match[5] !== undefined
		? match[5].endsWith("%") ? Number.parseFloat(match[5]) / 100 : Number.parseFloat(match[5])
		: 1;

	// Convert OKLCH to OKLab
	const hRad = (H * Math.PI) / 180;
	const a = C * Math.cos(hRad);
	const b = C * Math.sin(hRad);

	// Convert OKLab to linear RGB
	const l_ = L + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
	const m_ = L - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
	const s_ = L - 0.089_484_177_5 * a - 1.291_485_548 * b;

	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;

	let r = +4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s;
	let g = -1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s;
	let b_ = -0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s;

	// Apply gamma correction (linear to sRGB)
	const toSRGB = (val: number) => {
		if (val <= 0.003_130_8) return 12.92 * val;
		return 1.055 * val ** (1 / 2.4) - 0.055;
	};

	r = Math.max(0, Math.min(1, toSRGB(r)));
	g = Math.max(0, Math.min(1, toSRGB(g)));
	b_ = Math.max(0, Math.min(1, toSRGB(b_)));

	return { r, g, b: b_, a: alpha };
}

// Generic color parser - tries all formats
export function parseColor(color: string): ColorValue | null {
	color = color.trim();
	if (color.startsWith("#")) {
		return parseHexColor(color);
	}
	if (color.startsWith("rgb")) {
		return parseRgbColor(color);
	}
	if (color.startsWith("hsl")) {
		return parseHslColor(color);
	}
	if (color.startsWith("oklch")) {
		return parseOKLCHColor(color);
	}
	return null;
}

/** RGBA color with required alpha channel (for Figma API) */
export interface RGBA {
	a: number;
	b: number;
	g: number;
	r: number;
}

/**
 * Parse color string to RGBA format (Figma requires alpha channel)
 * Always returns a valid RGBA object, with fallback to gray if parsing fails
 *
 * @param colorStr - Color string in any supported format (hex, rgb, rgba, hsl, oklch)
 * @param fallback - Optional fallback color (default: medium gray)
 * @returns RGBA color object
 */
export function parseColorToRGBA(
	colorStr: string,
	fallback: RGBA = { r: 0.5, g: 0.5, b: 0.5, a: 1 },
): RGBA {
	const result = parseColor(colorStr);
	if (result) {
		return {
			r: result.r,
			g: result.g,
			b: result.b,
			a: result.a ?? 1,
		};
	}
	return fallback;
}
