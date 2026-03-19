// Design system token generator — always three-tier
// Primitives → Aliases → Semantics
// Output is DesignToken[] compatible with the existing import handler

import type { ColorValue, DesignToken } from "../types/tokens";
import {
	adjustSaturation,
	type ColorScale,
	generateColorScale,
	generateNeutralScale,
	hexToRgb,
	type NeutralScale,
	rgbToHex,
	rgbToOklch,
	SHADE_STEPS,
} from "./color-scale";
import { getRadixGray, RADIX_GRAYS, type RadixGrayScale } from "./radix-grays";
import {
	BLUR_SCALE,
	BREAKPOINTS,
	buildFontFamilies,
	CONTAINER_SCALE,
	computeRadiusScale,
	computeTypescale,
	DEFAULT_RADIUS,
	DURATION_RAW,
	DURATION_SEMANTIC,
	EASING_CURVES,
	type FontOverrides,
	generateTypographyCss,
	resolveFontNames,
	SCREEN_SIZES,
	SHADOW_SCALE,
	SIZES_SCALE,
	SPACING_SCALE,
	shadowToCss,
	type TypescaleConfig,
	ZLAYER_SCALE,
} from "./token-presets";

// --- Configuration types ---

/** A named brand color for the palette */
export interface NamedBrandColor {
	/** Base hex color */
	hex: string;
	/** Display name (used in Figma path: color/{name}/50-950) */
	name: string;
}

/** A named surface/gray ramp */
export interface NamedSurface {
	/** Custom hex for dark mode (overrides darkPreset when set) */
	darkHex?: string;
	/** Radix preset for dark mode (defaults to preset) */
	darkPreset?: string;
	/** Custom hex for light mode (overrides preset when set) */
	hex?: string;
	/** Display name (used in Figma path: color/{name}/light|dark/1-12) */
	name: string;
	/** Radix preset name for light mode (e.g. "slate", "sand") */
	preset?: string;
}

/** Bundled palette: brand color + surface light/dark as one theme option */
export interface PaletteEntry {
	/** Brand/accent hex color */
	brandHex: string;
	/** Display name for this palette */
	name: string;
	/** Radix preset for dark surface (defaults to surfaceLightPreset) */
	surfaceDarkPreset?: string;
	/** Radix preset for light surface */
	surfaceLightPreset?: string;
}

/** Mapping from palette → semantic roles */
export interface PaletteMapping {
	/** Which palette/surface to use for --background/--card/--muted/etc. */
	activeSurface: string;
	/** Surface for dark mode aliases (defaults to activeSurface) */
	darkActiveSurface?: string;
	/** Brand color for --primary in dark mode (defaults to primaryBrand) */
	darkPrimaryBrand?: string;
	/** Which brand color to use as --primary */
	primaryBrand: string;
}

export interface BrandConfig {
	/** Named brand colors — when present, generates color/{name}/50-950 for each */
	brandColors?: NamedBrandColor[];
	/** Custom font name overrides (prepended to system fallback stacks) */
	fonts?: FontOverrides;
	/** Bundled palettes — when present, derives brandColors + surfaces from these */
	palettes?: PaletteEntry[];
	/** Surface color tone for dark mode — Radix preset name or hex color (default: same as grayLight) */
	grayDark?: string;
	/** Custom hex for dark surface generation (overrides grayDark preset) */
	grayDarkHex?: string;
	/** Surface color tone for light mode — Radix preset name or hex color (default: "slate") */
	grayLight?: string;
	/** Custom hex for light surface generation (overrides grayLight preset) */
	grayLightHex?: string;
	/** @deprecated Use grayLight instead. Kept for backwards compatibility */
	grayName?: string;
	/** Palette → semantic role mapping */
	mapping?: PaletteMapping;
	/** Primary brand color (hex) — used when brandColors is not set */
	primary: string;
	/** Radius anchor in px (default: 10) — the "lg" base from which other sizes are derived */
	radius?: number;
	/** Secondary/accent brand color (hex, optional) — used when brandColors is not set */
	secondary?: string;
	/** Use brand secondary as semantic --primary in dark mode (default: false) */
	secondaryAsDarkPrimary?: boolean;
	/** Status color overrides (hex). Defaults: danger=#EF4444, success=#10B981, warning=#F59E0B, info=#3B82F6 */
	statusColors?: StatusColorOverrides;
	/** Surface brightness offset (-50 to +50, default 0). Shifts lightness of surface palette. */
	surfaceBrightness?: number;
	/** Blend brand primary hue into surfaces (0–100, default 0). Higher = more brand-tinted neutrals. */
	surfaceHueBlend?: number;
	/** Hue rotation across lightness range in degrees (-60 to +60, default 0). Positive = warm darks/cool highlights. */
	surfaceHueShift?: number;
	/** Surface color saturation multiplier (0–500, where 100 = default). Controls chroma of surface/gray palette. */
	surfaceSaturation?: number;
	/** Named surface ramps — when present, generates light/dark ramps for each */
	surfaces?: NamedSurface[];
	/** Typescale configuration (base, ratio, line-height, steps) */
	typescale?: TypescaleConfig;
}

export interface StatusColorOverrides {
	danger?: string;
	info?: string;
	success?: string;
	warning?: string;
}

// --- Resolved config helpers ---

/** Resolve brandColors from config — palettes → brandColors → legacy fallback */
function resolveBrandColors(config: BrandConfig): NamedBrandColor[] {
	// From palettes
	if (config.palettes && config.palettes.length > 0) {
		return config.palettes.map((p) => ({ name: p.name, hex: p.brandHex }));
	}
	// From explicit brandColors
	if (config.brandColors && config.brandColors.length > 0) {
		return config.brandColors;
	}
	// Legacy fallback
	const colors: NamedBrandColor[] = [
		{ name: "brand-primary", hex: config.primary },
	];
	if (config.secondary) {
		colors.push({ name: "brand-secondary", hex: config.secondary });
	}
	return colors;
}

/** Resolve surfaces from config — palettes → surfaces → legacy fallback */
function resolveSurfaces(config: BrandConfig): NamedSurface[] {
	// From palettes
	if (config.palettes && config.palettes.length > 0) {
		return config.palettes.map((p) => ({
			name: p.name,
			preset: p.surfaceLightPreset ?? "slate",
			darkPreset: p.surfaceDarkPreset !== (p.surfaceLightPreset ?? "slate")
				? p.surfaceDarkPreset
				: undefined,
		}));
	}
	// From explicit surfaces
	if (config.surfaces && config.surfaces.length > 0) {
		return config.surfaces;
	}
	// Legacy fallback
	const lightPreset = config.grayLight ?? config.grayName ?? "slate";
	const darkPreset = config.grayDark ?? lightPreset;
	return [{
		name: "gray",
		preset: config.grayLightHex ? undefined : lightPreset,
		hex: config.grayLightHex,
		darkPreset: config.grayDarkHex ? undefined : (darkPreset !== lightPreset ? darkPreset : undefined),
		darkHex: config.grayDarkHex,
	}];
}

/** Resolve mapping from config, falling back to first brand/surface */
function resolveMapping(config: BrandConfig): PaletteMapping {
	if (config.mapping) return config.mapping;
	const brands = resolveBrandColors(config);
	const surfaces = resolveSurfaces(config);
	return {
		primaryBrand: brands[0].name,
		darkPrimaryBrand: config.secondaryAsDarkPrimary && brands.length > 1
			? brands[1].name
			: undefined,
		activeSurface: surfaces[0].name,
	};
}

export interface GeneratedSystem {
	/** Generated neutral scales (custom hex or null if using Radix preset) */
	neutralScaleDark: NeutralScale | null;
	neutralScaleLight: NeutralScale | null;
	/** Color scale data for preview UI (brand, secondary, etc.) */
	primitives: ColorScale[];
	/** Computed radius scale (t-shirt sizes -> px) */
	radiusScale: Record<string, number>;
	/** The selected Radix gray palettes for light and dark modes (null if custom hex) */
	radixGrayDark: RadixGrayScale | null;
	radixGrayLight: RadixGrayScale | null;
	stats: {
		primitiveCount: number;
		aliasCount: number;
		semanticCount: number;
		totalCount: number;
	};
	/** Figma styles data (paint, text, effect) for import alongside variables */
	styles: Record<string, any>;
	tokens: DesignToken[];
}

// --- Generator ---

let tokenIdCounter = 0;
function nextId(): string {
	return `gen-${++tokenIdCounter}`;
}

function makeToken(
	figmaName: string,
	value: string | number | ColorValue,
	category: string,
	opts?: {
		description?: string;
		type?: string;
		originalValue?: string;
		modeName?: string;
	},
): DesignToken {
	const strValue =
		typeof value === "object"
			? rgbToHex(value)
			: typeof value === "number"
				? `${value}`
				: value;

	// If the value is a reference string like {primitives.color.gray.light.1},
	// set type to "reference" so the import handler processes it in the alias pass
	const isReference =
		typeof value === "string" && value.startsWith("{") && value.endsWith("}");
	const resolvedType = isReference
		? "reference"
		: ((opts?.type ?? "color") as DesignToken["type"]);

	const token: DesignToken = {
		id: nextId(),
		name: figmaName,
		figmaName,
		value,
		originalValue: opts?.originalValue ?? strValue,
		type: resolvedType,
		category: category as DesignToken["category"],
		action: "import",
		description: opts?.description,
	};

	if (opts?.modeName) {
		(token as any).modeName = opts.modeName;
	}

	return token;
}

// =========================================================================
// Primitives — raw values, SINGLE MODE (no Light/Dark)
// =========================================================================

function generatePrimitives(config: BrandConfig): {
	tokens: DesignToken[];
	scales: ColorScale[];
	radixGrayLight: RadixGrayScale | null;
	radixGrayDark: RadixGrayScale | null;
	neutralScaleLight: NeutralScale | null;
	neutralScaleDark: NeutralScale | null;
} {
	const tokens: DesignToken[] = [];

	// ── Colors ────────────────────────────────────────────────────────────

	// --- White alpha scale (color/white/0 - color/white/100) ---
	const alphaSteps = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
	for (const step of alphaSteps) {
		tokens.push(
			makeToken(
				`color/white/${step}`,
				{ r: 1, g: 1, b: 1, a: step / 100 },
				"primitives",
				{
					type: "color",
					originalValue: `rgba(255, 255, 255, ${step / 100})`,
					description: `White at ${step}% opacity`,
				},
			),
		);
	}

	// --- Black alpha scale (color/black/0 - color/black/100) ---
	for (const step of alphaSteps) {
		tokens.push(
			makeToken(
				`color/black/${step}`,
				{ r: 0, g: 0, b: 0, a: step / 100 },
				"primitives",
				{
					type: "color",
					originalValue: `rgba(0, 0, 0, ${step / 100})`,
					description: `Black at ${step}% opacity`,
				},
			),
		);
	}

	// --- Surface colors (per-surface light/dark ramps) ---
	const satMul = (config.surfaceSaturation ?? 100) / 100;
	const hueShift = config.surfaceHueShift ?? 0;
	const primaryBlend = (config.surfaceHueBlend ?? 0) / 100;
	const brightness = (config.surfaceBrightness ?? 0) / 100;

	// Resolve the primary brand hue for surface tinting
	const mapping = resolveMapping(config);
	const brandColors = resolveBrandColors(config);
	const surfaces = resolveSurfaces(config);

	const primaryBrand = brandColors.find((b) => b.name === mapping.primaryBrand) ?? brandColors[0];
	const darkBrand = mapping.darkPrimaryBrand
		? (brandColors.find((b) => b.name === mapping.darkPrimaryBrand) ?? primaryBrand)
		: primaryBrand;
	const primaryRgb = hexToRgb(primaryBrand.hex);
	const primaryHue = rgbToOklch(primaryRgb.r, primaryRgb.g, primaryRgb.b).h;
	const darkBrandRgb = hexToRgb(darkBrand.hex);
	const darkBrandHue = rgbToOklch(darkBrandRgb.r, darkBrandRgb.g, darkBrandRgb.b).h;

	const lightAdjustOpts = { hueShift, primaryBlend, primaryHue, brightness };
	const darkAdjustOpts = { hueShift, primaryBlend, primaryHue: darkBrandHue, brightness };
	const lightSurfaceOpts = { saturation: satMul, hueShift, primaryBlend, primaryHue, brightness };
	const darkSurfaceOpts = { saturation: satMul, hueShift, primaryBlend, primaryHue: darkBrandHue, brightness };

	// Track the active surface for preview (first surface or mapped)
	let radixGrayLight: RadixGrayScale | null = null;
	let radixGrayDark: RadixGrayScale | null = null;
	let neutralScaleLight: NeutralScale | null = null;
	let neutralScaleDark: NeutralScale | null = null;

	// Generate surface ramps for each named surface
	for (const surface of surfaces) {
		const surfLightPreset = surface.preset ?? "slate";
		const surfDarkPreset = surface.darkPreset ?? surfLightPreset;
		const surfLightHex = surface.hex;
		const surfDarkHex = surface.darkHex ?? surfLightHex;

		const surfRadixLight = surfLightHex ? null : (getRadixGray(surfLightPreset) ?? RADIX_GRAYS[0]);
		const surfRadixDark = surfDarkHex ? null : (getRadixGray(surfDarkPreset) ?? (surfRadixLight ?? RADIX_GRAYS[0]));
		const surfNeutralLight = surfLightHex ? generateNeutralScale(surfLightHex, lightSurfaceOpts) : null;
		const surfNeutralDark = surfDarkHex ? generateNeutralScale(surfDarkHex, darkSurfaceOpts) : null;

		const lightColors = surfNeutralLight?.light
			?? adjustSaturation(surfRadixLight?.light ?? RADIX_GRAYS[0].light, satMul, lightAdjustOpts);
		const darkColors = surfNeutralDark?.dark
			?? adjustSaturation(surfRadixDark?.dark ?? RADIX_GRAYS[0].dark, satMul, darkAdjustOpts);
		const lightLabel = surfLightHex ? `Custom (${surfLightHex})` : (surfRadixLight?.label ?? surface.name);
		const darkLabel = surfDarkHex ? `Custom (${surfDarkHex})` : (surfRadixDark?.label ?? surface.name);

		for (let i = 0; i < 12; i++) {
			const step = i + 1;
			tokens.push(
				makeToken(
					`color/${surface.name}/light/${step}`,
					hexToColorValue(lightColors[i]),
					"primitives",
					{
						description: `${lightLabel} step ${step} (light)`,
						originalValue: lightColors[i],
					},
				),
			);
			tokens.push(
				makeToken(
					`color/${surface.name}/dark/${step}`,
					hexToColorValue(darkColors[i]),
					"primitives",
					{
						description: `${darkLabel} step ${step} (dark)`,
						originalValue: darkColors[i],
					},
				),
			);
		}

		// Track active surface for preview
		const darkSurfaceName = mapping.darkActiveSurface ?? mapping.activeSurface;
		if (surface.name === mapping.activeSurface) {
			radixGrayLight = surfRadixLight;
			neutralScaleLight = surfNeutralLight;
			// If no separate dark surface, also use this for dark
			if (darkSurfaceName === mapping.activeSurface) {
				radixGrayDark = surfRadixDark;
				neutralScaleDark = surfNeutralDark;
			}
		}
		if (surface.name === darkSurfaceName && darkSurfaceName !== mapping.activeSurface) {
			radixGrayDark = surfRadixDark;
			neutralScaleDark = surfNeutralDark;
		}
	}

	// Fallback if active surface not found in surfaces array
	if (!radixGrayLight && !neutralScaleLight && surfaces.length > 0) {
		const fallback = surfaces[0];
		radixGrayLight = fallback.hex ? null : (getRadixGray(fallback.preset ?? "slate") ?? RADIX_GRAYS[0]);
	}

	// --- Brand color ramps (per-brand) ---
	const scales: ColorScale[] = [];
	for (const brand of brandColors) {
		const scale = generateColorScale(brand.name, brand.hex);
		scales.push(scale);
		for (const step of SHADE_STEPS) {
			tokens.push(
				makeToken(
					`color/${brand.name}/${step}`,
					scale.shades[step],
					"primitives",
					{
						description: step === 500
							? `${brand.name} ${step} [base:${brand.hex}]`
							: `${brand.name} ${step}`,
						originalValue: scale.hexValues[step],
					},
				),
			);
		}
	}

	// --- Status colors with full ramps ---
	const overrides = config.statusColors;
	const statusColors = [
		{ name: "danger", hex: overrides?.danger ?? "#EF4444" },
		{ name: "success", hex: overrides?.success ?? "#10B981" },
		{ name: "warning", hex: overrides?.warning ?? "#F59E0B" },
		{ name: "info", hex: overrides?.info ?? "#3B82F6" },
	];

	for (const status of statusColors) {
		const scale = generateColorScale(status.name, status.hex);
		scales.push(scale);
		for (const step of SHADE_STEPS) {
			tokens.push(
				makeToken(
					`color/${status.name}/${step}`,
					scale.shades[step],
					"primitives",
					{
						description: step === 500
							? `${status.name} ${step} [base:${status.hex}]`
							: `${status.name} ${step}`,
						originalValue: scale.hexValues[step],
					},
				),
			);
		}
	}

	// ── Typography ────────────────────────────────────────────────────────

	// --- Font families (clean names for Figma variable binding) ---
	const fontNames = resolveFontNames(config.fonts);
	for (const [name, fontName] of Object.entries(fontNames)) {
		tokens.push(
			makeToken(`font/family/${name}`, fontName, "primitives", {
				type: "string",
				originalValue: fontName,
				description: `Font family ${name}`,
			}),
		);
	}

	// --- Typescale with responsive variants (min, sm, md) ---
	const typeSteps = computeTypescale(config.typescale);
	const baseSize = config.typescale?.base ?? 16;
	const headingLhPct = (config.typescale?.lineHeightHeading ?? 125) / 100;
	const bodyLhPct = (config.typescale?.lineHeightBody ?? 150) / 100;
	const SM_FACTOR = 0.85;
	const MIN_FACTOR = 0.7;
	const round = (v: number) => Math.round(v);

	for (const step of typeSteps) {
		const isAboveBase = step.size > baseSize;
		const delta = step.size - baseSize;

		const sizeMd = step.size;
		const sizeSm = isAboveBase ? round(baseSize + delta * SM_FACTOR) : step.size;
		const sizeMin = isAboveBase ? round(baseSize + delta * MIN_FACTOR) : step.size;

		// Use the original line-height percentage from config, not the ratio
		// derived from rounded values, to avoid 1px rounding drift.
		// lg is large body text, not a heading — use body line-height
		const lhPct = isAboveBase && step.name !== "lg" ? headingLhPct : bodyLhPct;
		const lhMd = round(sizeMd * lhPct);
		const lhSm = round(sizeSm * lhPct);
		const lhMin = round(sizeMin * lhPct);

		const sizes = { md: sizeMd, sm: sizeSm, min: sizeMin };
		const lineHeights = { md: lhMd, sm: lhSm, min: lhMin };

		for (const variant of ["min", "sm", "md"] as const) {
			tokens.push(
				makeToken(
					`font/typescale/${step.name}/size/${variant}`,
					sizes[variant],
					"primitives",
					{
						type: "number",
						originalValue: `${sizes[variant]}px`,
						description: `${step.name} font size (${variant})`,
					},
				),
			);
			tokens.push(
				makeToken(
					`font/typescale/${step.name}/line/height/${variant}`,
					lineHeights[variant],
					"primitives",
					{
						type: "number",
						originalValue: `${lineHeights[variant]}px`,
						description: `${step.name} line height (${variant})`,
					},
				),
			);
		}
	}

	// ── Spacing & Sizing ──────────────────────────────────────────────────

	// --- Spacing ---
	for (const [key, px] of Object.entries(SPACING_SCALE)) {
		// Figma doesn't allow dots in variable names — replace with underscores (matches reference)
		const figmaKey = key.replace(".", "_");
		tokens.push(
			makeToken(`spacing/${figmaKey}`, px, "primitives", {
				type: "spacing",
				originalValue: `${px}px`,
				description: `Spacing ${key} (${px}px)`,
			}),
		);
	}

	// --- Sizes ---
	for (const [key, px] of Object.entries(SIZES_SCALE)) {
		tokens.push(
			makeToken(`size/${key}`, px, "primitives", {
				type: "sizing",
				originalValue: `${px}px`,
				description: `Size ${key} (${px}px)`,
			}),
		);
	}

	// --- Containers ---
	for (const [key, value] of Object.entries(CONTAINER_SCALE)) {
		tokens.push(
			makeToken(`container/${key}`, value, "primitives", {
				type: "number",
				originalValue: `${value}px`,
				description: `Container max-width ${key}`,
			}),
		);
	}

	// ── Radius ────────────────────────────────────────────────────────────

	// --- Rounded (radius scale) ---
	const radiusScale = computeRadiusScale(
		config.radius ?? DEFAULT_RADIUS.anchor,
	);
	for (const [size, px] of Object.entries(radiusScale)) {
		tokens.push(
			makeToken(`rounded/${size}`, px, "primitives", {
				type: "borderRadius",
				originalValue: `${px}px`,
				description: `Border radius ${size} (${px}px)`,
			}),
		);
	}
	// Bare `rounded` class in Tailwind uses --radius, mapped to md value
	const radiusDefault = radiusScale.md ?? 8;
	tokens.push(
		makeToken("rounded/DEFAULT", radiusDefault, "primitives", {
			type: "borderRadius",
			originalValue: `${radiusDefault}px`,
			description: "Border radius default (bare `rounded` class, matches md)",
		}),
	);

	// ── Effects ───────────────────────────────────────────────────────────

	// --- Shadows (multi-layer) ---
	for (const [level, layers] of Object.entries(SHADOW_SCALE)) {
		const cssValue = shadowToCss(layers);
		tokens.push(
			makeToken(`shadow/${level}`, cssValue, "primitives", {
				type: "boxShadow",
				originalValue: cssValue,
				description: `Shadow elevation ${level}`,
			}),
		);
	}

	// --- Blur scale (Tailwind-aligned) ---
	for (const [name, px] of Object.entries(BLUR_SCALE)) {
		tokens.push(
			makeToken(`blur/${name}`, px, "primitives", {
				type: "number",
				originalValue: String(px),
				description: `Blur ${name} (${px}px)`,
			}),
		);
	}

	// ── Z-layers ──────────────────────────────────────────────────────────

	// --- Z-layer scale ---
	for (const [name, value] of Object.entries(ZLAYER_SCALE)) {
		tokens.push(
			makeToken(`z-layer/${name}`, value, "primitives", {
				type: "number",
				originalValue: `${value}`,
				description: `Z-index layer ${name}`,
			}),
		);
	}

	// ── Motion ────────────────────────────────────────────────────────────

	// --- Duration raw values ---
	for (const [key, ms] of Object.entries(DURATION_RAW)) {
		tokens.push(
			makeToken(`duration/${key}`, ms, "primitives", {
				type: "number",
				originalValue: `${ms}ms`,
				description: `Duration ${key === "none" ? "0" : key}ms`,
			}),
		);
	}

	// --- Easing curves ---
	for (const [key, value] of Object.entries(EASING_CURVES)) {
		tokens.push(
			makeToken(`ease/${key}`, value, "primitives", {
				type: "string",
				originalValue: value,
				description: `Easing ${key}`,
			}),
		);
	}

	// ── Layout ────────────────────────────────────────────────────────────

	// --- Breakpoints ---
	for (const [key, value] of Object.entries(BREAKPOINTS)) {
		tokens.push(
			makeToken(`breakpoint/${key}`, value, "primitives", {
				type: "number",
				originalValue: `${value}px`,
				description: `Breakpoint ${key}`,
			}),
		);
	}

	// --- Screen sizes ---
	for (const [key, value] of Object.entries(SCREEN_SIZES)) {
		tokens.push(
			makeToken(`screen/${key}`, value, "primitives", {
				type: "number",
				originalValue: `${value}px`,
				description: `Screen width ${key}`,
			}),
		);
	}

	// For preview: compute active surface adjusted colors
	const activeSurface = surfaces.find((s) => s.name === mapping.activeSurface) ?? surfaces[0];
	const activeRadixLight = activeSurface?.hex ? null : (getRadixGray(activeSurface?.preset ?? "slate") ?? RADIX_GRAYS[0]);
	const activeRadixDark = surfaces.length === 1 && config.grayDark
		? (getRadixGray(config.grayDark) ?? activeRadixLight ?? RADIX_GRAYS[0])
		: (activeRadixLight ?? RADIX_GRAYS[0]);
	const activeAdjustedLight = adjustSaturation(activeRadixLight?.light ?? RADIX_GRAYS[0].light, satMul, lightAdjustOpts);
	const activeAdjustedDark = adjustSaturation(activeRadixDark?.dark ?? RADIX_GRAYS[0].dark, satMul, darkAdjustOpts);
	const effectiveNeutralLight = neutralScaleLight
		?? (satMul !== 1 ? { light: activeAdjustedLight, dark: activeAdjustedDark } : null);
	const effectiveNeutralDark = neutralScaleDark
		?? (satMul !== 1 ? { light: activeAdjustedLight, dark: activeAdjustedDark } : null);

	return { tokens, scales, radixGrayLight, radixGrayDark,
		neutralScaleLight: effectiveNeutralLight, neutralScaleDark: effectiveNeutralDark };
}

// =========================================================================
// Aliases — indirection layer, SINGLE MODE
// =========================================================================

function generateAliases(config: BrandConfig): DesignToken[] {
	const tokens: DesignToken[] = [];
	const mapping = resolveMapping(config);
	const lightSurface = mapping.activeSurface;
	const darkSurface = mapping.darkActiveSurface ?? lightSurface;

	// --- Surface (light/dark references → active surface ramp) ---
	for (let i = 1; i <= 12; i++) {
		tokens.push(
			makeToken(
				`surface/light/${i}`,
				`{primitives.color.${lightSurface}.light.${i}}`,
				"aliases",
				{
					description: `Surface light step ${i} (→ ${lightSurface})`,
					originalValue: `{primitives.color.${lightSurface}.light.${i}}`,
					type: "color",
				},
			),
		);
		tokens.push(
			makeToken(
				`surface/dark/${i}`,
				`{primitives.color.${darkSurface}.dark.${i}}`,
				"aliases",
				{
					description: `Surface dark step ${i} (→ ${darkSurface})`,
					originalValue: `{primitives.color.${darkSurface}.dark.${i}}`,
					type: "color",
				},
			),
		);
	}

	// --- Duration semantic aliases ---
	for (const [name, rawKey] of Object.entries(DURATION_SEMANTIC)) {
		const ref = `{primitives.duration.${rawKey}}`;
		tokens.push(
			makeToken(`duration/${name}`, ref, "aliases", {
				type: "duration",
				originalValue: ref,
				description: `Duration ${name} (${DURATION_RAW[rawKey]}ms)`,
			}),
		);
	}

	return tokens;
}

// =========================================================================
// Semantics — contextual tokens, DUAL MODE (Light/Dark)
// =========================================================================

interface SemanticDef {
	dark: string;
	description: string;
	light: string;
	name: string;
	type?: string;
}

function buildSemanticDefs(
	primaryBrandName: string,
	darkPrimaryBrandName: string,
	allBrandNames: string[],
): SemanticDef[] {
	const surfL = (step: number) => `{aliases.surface.light.${step}}`;
	const surfD = (step: number) => `{aliases.surface.dark.${step}}`;
	const primary = `{primitives.color.${primaryBrandName}.500}`;
	const darkPrimary = darkPrimaryBrandName !== primaryBrandName
		? `{primitives.color.${darkPrimaryBrandName}.500}`
		: primary;
	const danger = "{primitives.color.danger.500}";
	const success = "{primitives.color.success.500}";
	const warning = "{primitives.color.warning.500}";
	const info = "{primitives.color.info.500}";

	const defs: SemanticDef[] = [
		// --- Core semantic tokens ---
		{
			name: "background",
			light: surfL(2),
			dark: surfD(1),
			description: "Default page background",
		},
		{
			name: "foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Default text color",
		},
		{
			name: "card",
			light: surfL(1),
			dark: surfD(2),
			description: "Card background",
		},
		{
			name: "card-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Card text color",
		},
		{
			name: "popover",
			light: surfL(1),
			dark: surfD(4),
			description: "Popover/dropdown background",
		},
		{
			name: "popover-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Popover text color",
		},
		{
			name: "primary",
			light: primary,
			dark: darkPrimary,
			description: "Primary color",
		},
		{
			name: "primary-foreground",
			light: surfL(1),
			dark: surfD(12),
			description: "Text on primary background",
		},
		{
			name: "secondary",
			light: surfL(3),
			dark: surfD(3),
			description: "Secondary/component background",
		},
		{
			name: "secondary-foreground",
			light: surfL(11),
			dark: surfD(11),
			description: "Secondary foreground text",
		},
		{
			name: "muted",
			light: surfL(3),
			dark: surfD(3),
			description: "Muted background",
		},
		{
			name: "muted-foreground",
			light: surfL(11),
			dark: surfD(11),
			description: "Muted/secondary text",
		},
		{
			name: "accent",
			light: surfL(4),
			dark: surfD(6),
			description: "Accent background",
		},
		{
			name: "accent-foreground",
			light: surfL(12),
			dark: surfD(12),
			description: "Accent foreground text",
		},
		{
			name: "destructive",
			light: danger,
			dark: danger,
			description: "Destructive action color",
		},
		{
			name: "success",
			light: success,
			dark: success,
			description: "Success status color",
		},
		{
			name: "warning",
			light: warning,
			dark: warning,
			description: "Warning status color",
		},
		{
			name: "info",
			light: info,
			dark: info,
			description: "Info status color",
		},
		{
			name: "border",
			light: surfL(4),
			dark: surfD(6),
			description: "Default border color",
		},
		{
			name: "input",
			light: surfL(5),
			dark: surfD(7),
			description: "Input border color",
		},
		{
			name: "ring",
			light: surfL(6),
			dark: surfD(8),
			description: "Focus ring color",
		},

		// --- Chart colors (distribute across brand palette) ---
		...(() => {
			const chartBrands = allBrandNames.length > 0 ? allBrandNames : [primaryBrandName];
			return [1, 2, 3, 4, 5].map((n) => {
				const brand = chartBrands[(n - 1) % chartBrands.length];
				const ref = `{primitives.color.${brand}.500}`;
				return {
					name: `chart-${n}`,
					light: ref,
					dark: ref,
					description: `Chart color ${n} (${brand})`,
				};
			});
		})(),

		// --- Sidebar tokens ---
		{
			name: "sidebar",
			light: surfL(3),
			dark: surfD(3),
			description: "Sidebar background",
		},
		{
			name: "sidebar-foreground",
			light: "{semantics.foreground}",
			dark: "{semantics.foreground}",
			description: "Sidebar text",
		},
		{
			name: "sidebar-primary",
			light: "{semantics.primary}",
			dark: "{semantics.primary}",
			description: "Sidebar primary color",
		},
		{
			name: "sidebar-primary-foreground",
			light: "{semantics.primary-foreground}",
			dark: "{semantics.primary-foreground}",
			description: "Sidebar primary foreground",
		},
		{
			name: "sidebar-accent",
			light: "{semantics.accent}",
			dark: "{semantics.accent}",
			description: "Sidebar accent background",
		},
		{
			name: "sidebar-accent-foreground",
			light: "{semantics.accent-foreground}",
			dark: "{semantics.accent-foreground}",
			description: "Sidebar accent text",
		},
		{
			name: "sidebar-border",
			light: "{semantics.border}",
			dark: "{semantics.border}",
			description: "Sidebar border",
		},
		{
			name: "sidebar-ring",
			light: "{semantics.ring}",
			dark: "{semantics.ring}",
			description: "Sidebar focus ring",
		},

		// --- Static mode references ---
		{
			name: "light",
			light: surfL(1),
			dark: surfL(1),
			description: "Always-light surface (for forced-light contexts)",
		},
		{
			name: "dark",
			light: surfD(1),
			dark: surfD(1),
			description: "Always-dark surface (for forced-dark contexts)",
		},
	];

	return defs;
}

function generateSemantics(config: BrandConfig): DesignToken[] {
	const mapping = resolveMapping(config);
	const brandColors = resolveBrandColors(config);
	const defs = buildSemanticDefs(
		mapping.primaryBrand,
		mapping.darkPrimaryBrand ?? mapping.primaryBrand,
		brandColors.map((b) => b.name),
	);
	const tokens: DesignToken[] = [];

	for (const def of defs) {
		for (const [modeName, modeValue] of [
			["Light", def.light],
			["Dark", def.dark],
		] as const) {
			tokens.push(
				makeToken(def.name, modeValue, "semantics", {
					description: def.description,
					originalValue: modeValue,
					type: def.type,
					modeName,
				}),
			);
		}
	}

	return tokens;
}

// =========================================================================
// Responsive — multi-mode collection for breakpoint switching
// Modes: "desktop (md)", "tablet (sm)", "mobile (min)"
// Each token references the corresponding alias variant
// =========================================================================

const RESPONSIVE_MODES = ["desktop (md)", "tablet (sm)", "mobile (min)"] as const;
const MODE_TO_VARIANT: Record<string, string> = {
	"desktop (md)": "md",
	"tablet (sm)": "sm",
	"mobile (min)": "min",
};

function generateResponsive(config: BrandConfig): DesignToken[] {
	const tokens: DesignToken[] = [];
	const typeSteps = computeTypescale(config.typescale);

	// Typography responsive tokens — each step gets font-size + line-height
	for (const step of typeSteps) {
		for (const mode of RESPONSIVE_MODES) {
			const variant = MODE_TO_VARIANT[mode];

			// font-size
			tokens.push(
				makeToken(
					`typography/${step.name}/font/size`,
					`{primitives.font.typescale.${step.name}.size.${variant}}`,
					"responsive",
					{
						type: "number",
						originalValue: `{primitives.font.typescale.${step.name}.size.${variant}}`,
						description: `${step.name} font size (${mode})`,
						modeName: mode,
					},
				),
			);

			// line-height
			tokens.push(
				makeToken(
					`typography/${step.name}/line/height`,
					`{primitives.font.typescale.${step.name}.line.height.${variant}}`,
					"responsive",
					{
						type: "number",
						originalValue: `{primitives.font.typescale.${step.name}.line.height.${variant}}`,
						description: `${step.name} line height (${mode})`,
						modeName: mode,
					},
				),
			);
		}
	}

	// Viewport screen token — maps modes to screen primitives
	const screenMap: Record<string, string> = {
		"desktop (md)": "{primitives.screen.macbook-air}",
		"tablet (sm)": "{primitives.screen.ipad-pro-11}",
		"mobile (min)": "{primitives.screen.iphone-16-pro}",
	};
	for (const mode of RESPONSIVE_MODES) {
		tokens.push(
			makeToken("viewport/screen", screenMap[mode], "responsive", {
				type: "number",
				originalValue: screenMap[mode],
				description: `Viewport width (${mode})`,
				modeName: mode,
			}),
		);
	}

	return tokens;
}

// =========================================================================
// CSS Export
// =========================================================================

export function generateCss(config: BrandConfig): string {
	const system = generateDesignSystem(config);
	// Light surface: light and dark ramps
	const lightSurfaceLight = system.neutralScaleLight?.light ?? system.radixGrayLight?.light ?? RADIX_GRAYS[0].light;
	const lightSurfaceDark = system.neutralScaleLight?.dark ?? system.radixGrayLight?.dark ?? RADIX_GRAYS[0].dark;
	// Dark surface (may be different): light and dark ramps
	const darkSurfaceLight = system.neutralScaleDark?.light ?? system.radixGrayDark?.light ?? lightSurfaceLight;
	const darkSurfaceDark = system.neutralScaleDark?.dark ?? system.radixGrayDark?.dark ?? lightSurfaceDark;

	const radiusScale = computeRadiusScale(
		config.radius ?? DEFAULT_RADIUS.anchor,
	);
	const lines: string[] = [];

	const mapping = resolveMapping(config);
	const brandColors = resolveBrandColors(config);
	const lightSurfaceName = mapping.activeSurface;
	const darkSurfaceName = mapping.darkActiveSurface ?? lightSurfaceName;

	const defs = buildSemanticDefs(
		mapping.primaryBrand,
		mapping.darkPrimaryBrand ?? mapping.primaryBrand,
		brandColors.map((b) => b.name),
	);

	// ── @theme inline ──────────────────────────────────────────────────────

	lines.push("@theme inline {");

	// — Brand colors —
	lines.push("");
	lines.push("  /* Brand */");
	for (const brand of brandColors) {
		const scale = system.primitives.find((s) => s.name === brand.name);
		if (scale) {
			for (const step of SHADE_STEPS) {
				lines.push(`  --color-${brand.name}-${step}: ${scale.hexValues[step]};`);
			}
		}
	}

	// — Status colors —
	lines.push("");
	lines.push("  /* Status */");
	const statusOverrides = config.statusColors;
	const statusEntries = [
		{ name: "danger", hex: statusOverrides?.danger ?? "#EF4444" },
		{ name: "success", hex: statusOverrides?.success ?? "#10B981" },
		{ name: "warning", hex: statusOverrides?.warning ?? "#F59E0B" },
		{ name: "info", hex: statusOverrides?.info ?? "#3B82F6" },
	];
	for (const status of statusEntries) {
		const scale = generateColorScale(status.name, status.hex);
		for (const step of SHADE_STEPS) {
			lines.push(`  --color-${status.name}-${step}: ${scale.hexValues[step]};`);
		}
	}

	// — Surface / neutral (registered for Tailwind, values set in :root / .dark) —
	lines.push("");
	lines.push("  /* Surface */");
	for (let i = 1; i <= 12; i++) {
		lines.push(`  --color-${lightSurfaceName}-light-${i}: var(--color-${lightSurfaceName}-light-${i});`);
	}
	for (let i = 1; i <= 12; i++) {
		lines.push(`  --color-${lightSurfaceName}-dark-${i}: var(--color-${lightSurfaceName}-dark-${i});`);
	}
	if (darkSurfaceName !== lightSurfaceName) {
		for (let i = 1; i <= 12; i++) {
			lines.push(`  --color-${darkSurfaceName}-light-${i}: var(--color-${darkSurfaceName}-light-${i});`);
		}
		for (let i = 1; i <= 12; i++) {
			lines.push(`  --color-${darkSurfaceName}-dark-${i}: var(--color-${darkSurfaceName}-dark-${i});`);
		}
	}

	// — Semantic color registrations —
	lines.push("");
	lines.push("  /* Semantics */");
	for (const def of defs) {
		lines.push(`  --color-${def.name}: var(--${def.name});`);
	}

	// — Spacing —
	lines.push("");
	lines.push("  /* Spacing */");
	for (const [key, px] of Object.entries(SPACING_SCALE)) {
		lines.push(`  --spacing-${key}: ${px}px;`);
	}

	// — Radius —
	lines.push("");
	lines.push("  /* Radius */");
	for (const [size, px] of Object.entries(radiusScale)) {
		lines.push(`  --radius-${size}: ${px}px;`);
	}

	// — Shadows —
	lines.push("");
	lines.push("  /* Shadows */");
	for (const [level, layers] of Object.entries(SHADOW_SCALE)) {
		lines.push(`  --shadow-${level}: ${shadowToCss(layers)};`);
	}

	// — Blur —
	lines.push("");
	lines.push("  /* Blur */");
	for (const [name, px] of Object.entries(BLUR_SCALE)) {
		lines.push(`  --blur-${name}: ${px}px;`);
	}

	// — Font families —
	lines.push("");
	lines.push("  /* Fonts */");
	const fontStacks = buildFontFamilies(config.fonts);
	for (const [name, stack] of Object.entries(fontStacks)) {
		lines.push(`  --font-${name}: ${stack};`);
	}

	// — Durations —
	lines.push("");
	lines.push("  /* Duration */");
	for (const [name, rawKey] of Object.entries(DURATION_SEMANTIC)) {
		lines.push(`  --duration-${name}: ${DURATION_RAW[rawKey]}ms;`);
	}

	lines.push("}");

	// ── :root (light mode) ─────────────────────────────────────────────────

	lines.push("");
	lines.push(":root {");
	for (let i = 0; i < 12; i++) {
		lines.push(`  --color-${lightSurfaceName}-light-${i + 1}: ${lightSurfaceLight[i]};`);
	}
	for (let i = 0; i < 12; i++) {
		lines.push(`  --color-${lightSurfaceName}-dark-${i + 1}: ${lightSurfaceDark[i]};`);
	}
	if (darkSurfaceName !== lightSurfaceName) {
		for (let i = 0; i < 12; i++) {
			lines.push(`  --color-${darkSurfaceName}-light-${i + 1}: ${darkSurfaceLight[i]};`);
		}
		for (let i = 0; i < 12; i++) {
			lines.push(`  --color-${darkSurfaceName}-dark-${i + 1}: ${darkSurfaceDark[i]};`);
		}
	}
	lines.push("");
	for (const def of defs) {
		lines.push(`  --${def.name}: ${refToCssVar(def.light, lightSurfaceName)};`);
	}
	lines.push("}");

	// ── .dark ──────────────────────────────────────────────────────────────

	lines.push("");
	lines.push(".dark {");
	for (const def of defs) {
		lines.push(`  --${def.name}: ${refToCssVar(def.dark, darkSurfaceName)};`);
	}
	lines.push("}");

	// Typography
	lines.push("");
	lines.push("/* Typography */");
	lines.push(generateTypographyCss(computeTypescale(config.typescale)));

	return lines.join("\n");
}

/** Convert a token reference like {aliases.surface.light.1} to a CSS var */
function refToCssVar(ref: string, surfaceName = "gray"): string {
	const match = ref.match(/^\{([^}]+)\}$/);
	if (!match) return ref;
	const path = match[1];

	// Surface references → active surface step
	const surfaceMatch = path.match(
		/^aliases\.surface\.(light|dark)\.(\d+)$/,
	);
	if (surfaceMatch) {
		return `var(--color-${surfaceName}-${surfaceMatch[1]}-${surfaceMatch[2]})`;
	}

	// Primitive color references
	if (path.startsWith("primitives.color.")) {
		return `var(--color-${path.replace(/^primitives\.color\./, "").replace(/\./g, "-")})`;
	}

	// Self-references within semantics
	if (path.startsWith("semantics.")) {
		return `var(--${path.replace(/^semantics\./, "")})`;
	}

	return `var(--${path.replace(/\./g, "-")})`;
}

// =========================================================================
// Helpers
// =========================================================================

function hexToColorValue(hex: string): ColorValue {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
	return { r, g, b };
}

// =========================================================================
// Styles generation — Paint, Text, Effect styles for Figma
// =========================================================================

function generateStyles(config: BrandConfig): Record<string, any> {
	const fontNames = resolveFontNames(config.fonts);
	const typeSteps = computeTypescale(config.typescale);

	const styles: Record<string, any> = {
		paint: {},
		text: {},
		effect: {},
	};

	// --- Paint styles: semantic colors bound to variables ---
	const semanticPaint: Record<string, any> = {};
	const mapping = resolveMapping(config);
	const brandColorsList = resolveBrandColors(config);
	const semanticDefs = buildSemanticDefs(
		mapping.primaryBrand,
		mapping.darkPrimaryBrand ?? mapping.primaryBrand,
		brandColorsList.map((b) => b.name),
	);
	for (const def of semanticDefs) {
		const styleName = def.name;
		const opacity = styleName === "accent" ? 0.8 : 1;
		const binding = {
			type: "variable",
			variableName: def.name,
			collectionName: "semantics",
		};

		if (opacity < 1) {
			semanticPaint[styleName] = {
				id: `generated-paint-${styleName}`,
				type: "color",
				fills: [
					{
						type: "linear",
						opacity,
						gradientStops: [
							{
								position: 0,
								color: "rgba(0, 0, 0, 1)",
								boundVariable: binding,
							},
							{
								position: 1,
								color: "rgba(0, 0, 0, 1)",
								boundVariable: binding,
							},
						],
						gradientTransform: [
							[1, 0, 0],
							[0, 1, 0],
						],
					},
				],
			};
		} else {
			semanticPaint[styleName] = {
				id: `generated-paint-${styleName}`,
				type: "color",
				fills: [
					{
						type: "solid",
						color: "rgba(0, 0, 0, 1)",
						opacity: 1,
						boundVariable: binding,
					},
				],
			};
		}
	}
	styles.paint = { semantics: semanticPaint };

	// --- Text styles: sans, serif, mono (each font family) ---
	// Each family gets regular + strong variants for every typescale step
	const fontFamilies = [
		{ key: "sans", fontName: fontNames.sans, familyVar: "font/family/sans", collection: "primitives" },
		{ key: "serif", fontName: fontNames.serif, familyVar: "font/family/serif", collection: "primitives" },
		{ key: "mono", fontName: fontNames.mono, familyVar: "font/family/mono", collection: "primitives" },
	];

	const textStyles: Record<string, Record<string, any>> = {};

	for (const family of fontFamilies) {
		const group: Record<string, any> = {};

		for (const step of typeSteps) {
			const sizeBinding = {
				variableName: `typography/${step.name}/font/size`,
				collectionName: "responsive",
			};
			const lineHeightBinding = {
				variableName: `typography/${step.name}/line/height`,
				collectionName: "responsive",
			};
			const fontFamilyBinding = {
				variableName: family.familyVar,
				collectionName: family.collection,
			};

			group[step.name] = {
				id: `generated-text-${family.key}-${step.name}`,
				type: "text",
				fontFamily: family.fontName,
				fontStyle: "Regular",
				fontSize: `${step.size}px`,
				lineHeight: `${step.lineHeight}px`,
				letterSpacing: "0%",
				paragraphSpacing: "0px",
				textCase: "ORIGINAL",
				textDecoration: "NONE",
				fontFamilyBoundVariable: fontFamilyBinding,
				fontSizeBoundVariable: sizeBinding,
				lineHeightBoundVariable: lineHeightBinding,
			};
		}

		textStyles[family.key] = group;
	}
	styles.text = textStyles;

	// --- Effect styles: shadows + blurs ---
	const shadows: Record<string, any> = {};
	for (const [level, layers] of Object.entries(SHADOW_SCALE)) {
		const effects: any[] = [];
		for (const layer of layers) {
			effects.push({
				type: "drop-shadow",
				offsetX: `${layer.offsetX}px`,
				offsetY: `${layer.offsetY}px`,
				radius: `${layer.blur}px`,
				spread: `${layer.spread}px`,
				color: `rgba(0, 0, 0, ${layer.opacity})`,
				visible: true,
			});
		}
		shadows[level] = { id: `generated-shadow-${level}`, type: "effect", effects };
	}

	const blurs: Record<string, any> = {};
	const backdropBlurs: Record<string, any> = {};
	for (const [name, px] of Object.entries(BLUR_SCALE)) {
		const radiusBoundVariable = {
			variableName: `blur/${name}`,
			collectionName: "primitives",
		};
		blurs[name] = {
			id: `generated-blur-${name}`,
			type: "effect",
			effects: [{ type: "layer-blur", radius: `${px}px`, visible: true, radiusBoundVariable }],
		};
		backdropBlurs[name] = {
			id: `generated-backdrop-blur-${name}`,
			type: "effect",
			effects: [{ type: "background-blur", radius: `${px}px`, visible: true, radiusBoundVariable }],
		};
	}

	styles.effect = { shadow: shadows, blur: blurs, "backdrop-blur": backdropBlurs };

	return styles;
}

// =========================================================================
// Public API
// =========================================================================

/**
 * Generate a complete three-tier design system from brand configuration.
 *
 * Always generates: Primitives → Aliases → Semantics + Styles
 */
export function generateDesignSystem(config: BrandConfig): GeneratedSystem {
	tokenIdCounter = 0;

	// Generate all three tiers
	const {
		tokens: primitiveTokens,
		scales,
		radixGrayLight,
		radixGrayDark,
		neutralScaleLight,
		neutralScaleDark,
	} = generatePrimitives(config);

	const aliasTokens = generateAliases(config);

	const semanticTokens = generateSemantics(config);
	const responsiveTokens = generateResponsive(config);

	const tokens = [...primitiveTokens, ...aliasTokens, ...semanticTokens, ...responsiveTokens];

	return {
		tokens,
		primitives: scales,
		radixGrayLight: radixGrayLight ?? null,
		radixGrayDark: radixGrayDark ?? null,
		neutralScaleLight: neutralScaleLight ?? null,
		neutralScaleDark: neutralScaleDark ?? null,
		radiusScale: computeRadiusScale(config.radius ?? DEFAULT_RADIUS.anchor),
		styles: generateStyles(config),
		stats: {
			primitiveCount: primitiveTokens.length,
			aliasCount: aliasTokens.length,
			semanticCount: semanticTokens.length,
			totalCount: tokens.length,
		},
	};
}
