// Color conversion utilities
// Handles conversion between RGB, HEX, RGBA, and OKLCH color formats

/// <reference types="@figma/plugin-typings" />

// Convert RGB to HEX
export function rgbToHex(color: RGB & { a?: number }): string {
	const toHex = (val: number) => {
		const hex = Math.round(val * 255)
			.toString(16)
			.padStart(2, "0");
		return hex;
	};

	const hexColor = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;

	// Add alpha if present and not fully opaque
	if ("a" in color && color.a !== undefined && color.a < 1) {
		return `${hexColor}${toHex(color.a)}`;
	}

	return hexColor;
}

// Convert RGB to RGBA string
export function rgbToRgba(color: RGB & { a?: number }): string {
	const r = Math.round(color.r * 255);
	const g = Math.round(color.g * 255);
	const b = Math.round(color.b * 255);
	const rawA = "a" in color && color.a !== undefined ? color.a : 1;
	const a = Math.round(rawA * 10_000) / 10_000;
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Convert Figma color to OKLCH string
export function rgbToOklch(color: RGB & { a?: number }): string {
	// Convert sRGB to linear RGB (remove gamma correction)
	const toLinear = (val: number) => {
		if (val <= 0.040_45) return val / 12.92;
		return ((val + 0.055) / 1.055) ** 2.4;
	};

	const r = toLinear(color.r);
	const g = toLinear(color.g);
	const b = toLinear(color.b);

	// Convert linear RGB to OKLab
	const l = 0.412_221_470_8 * r + 0.536_332_536_3 * g + 0.051_445_992_9 * b;
	const m = 0.211_903_498_2 * r + 0.680_699_545_1 * g + 0.107_396_956_6 * b;
	const s = 0.088_302_461_9 * r + 0.281_718_837_6 * g + 0.629_978_700_5 * b;

	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	const L = 0.210_454_255_3 * l_ + 0.793_617_785 * m_ - 0.004_072_046_8 * s_;
	const a = 1.977_998_495_1 * l_ - 2.428_592_205 * m_ + 0.450_593_709_9 * s_;
	const bVal = 0.025_904_037_1 * l_ + 0.782_771_766_2 * m_ - 0.808_675_766 * s_;

	// Convert OKLab to OKLCH
	const C = Math.sqrt(a * a + bVal * bVal);
	let H = (Math.atan2(bVal, a) * 180) / Math.PI;

	// Normalize hue to 0-360
	if (H < 0) H += 360;

	// Handle alpha channel (OKLCH supports / alpha syntax)
	const alpha = "a" in color && color.a !== undefined ? color.a : 1;

	// Format with appropriate precision
	if (alpha < 1) {
		return `oklch(${L.toFixed(6)} ${C.toFixed(6)} ${H.toFixed(6)} / ${alpha.toFixed(6)})`;
	}
	return `oklch(${L.toFixed(6)} ${C.toFixed(6)} ${H.toFixed(6)})`;
}

// Convert RGB/RGBA to specified format
export function convertColor(color: RGB | RGBA, format: string): string {
	switch (format) {
		case "hex":
			return rgbToHex(color);
		case "rgba":
			return rgbToRgba(color);
		default:
			return rgbToOklch(color);
	}
}

// Convert RGB/RGBA to specified format, stripping alpha (always fully opaque)
// Used for color-mix() output where opacity is handled externally
export function convertColorOpaque(color: RGB | RGBA, format: string): string {
	const opaque = { r: color.r, g: color.g, b: color.b, a: 1 };
	return convertColor(opaque, format);
}
