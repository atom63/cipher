// CSS Generator — converts Figma variables to CSS custom properties
// Runs in the main thread (Figma sandbox), generates CSS strings to send to UI
//
// Key feature: Opacity preservation via color-mix()
// Figma stores opacity on paint styles, not on variable values. A variable might
// hold {primitives.black} but the style using it applies 20% opacity. This generator
// traverses all local paint styles to build an opacity lookup map, then wraps
// referenced variables in color-mix(in srgb, var(--token), transparent N%) when
// the style-level opacity < 1. This is the core differentiator from other token tools.

/// <reference types="@figma/plugin-typings" />

import { convertColor } from "../libraries/color-converters";
import {
	isVariableAlias,
	resolveVariableReference,
} from "../libraries/variable-binding";

type ColorFormat = "oklch" | "hex" | "rgba" | "hsl";

interface CSSGeneratorOptions {
	collectionIds: string[];
	colorFormat: ColorFormat;
	includeColorMix: boolean;
	includeThemeInline: boolean;
}

interface CSSFile {
	content: string;
	name: string;
	variableCount: number;
}

interface CSSExportResult {
	files: CSSFile[];
	totalCollections: number;
	totalVariables: number;
}

// ============================================================================
// OPACITY DETECTION FROM PAINT STYLES
// ============================================================================

/**
 * Build a lookup map of variable IDs → opacity from local paint styles.
 *
 * Figma stores opacity on the paint fill, not on the variable itself.
 * A semantic token like "muted-foreground" might reference {primitives.gray.11}
 * via a variable alias, but the paint style applying it has opacity 0.9.
 *
 * We traverse all local paint styles, and for each fill that:
 *   1. Has a bound variable (via boundVariables.color)
 *   2. Has opacity < 1
 * We record: variableId → opacity
 *
 * Important: Multiple styles may use the same variable at different opacities
 * (e.g., utility styles at 10%, 20%, etc.). We match by checking if the style
 * name path corresponds to the variable name to avoid picking up utility styles.
 */
async function buildStyleOpacityMap(): Promise<Map<string, number>> {
	const opacityMap = new Map<string, number>();

	try {
		const paintStyles = await figma.getLocalPaintStylesAsync();

		for (const style of paintStyles) {
			for (const paint of style.paints) {
				if (
					paint.type !== "SOLID" &&
					paint.type !== "GRADIENT_LINEAR" &&
					paint.type !== "GRADIENT_RADIAL" &&
					paint.type !== "GRADIENT_ANGULAR" &&
					paint.type !== "GRADIENT_DIAMOND"
				) {
					continue;
				}

				// Check solid fills
				if (paint.type === "SOLID") {
					const opacity = paint.opacity ?? 1;
					if (opacity >= 1) continue;

					// Check if color is bound to a variable
					const boundVars = paint.boundVariables;
					if (boundVars?.color) {
						const varId = boundVars.color.id;
						const variable = await figma.variables.getVariableByIdAsync(varId);
						if (!variable) continue;

						// Match: style name should correspond to the variable name
						// Style: "semantics/muted-foreground" → Variable: "muted-foreground"
						// Normalize both for comparison
						const normalizedStyleName = normalizeName(style.name);
						const normalizedVarName = normalizeName(variable.name);

						if (normalizedStyleName === normalizedVarName) {
							opacityMap.set(varId, opacity);
						}
					}
				}

				// Check gradient stops
				if ("gradientStops" in paint && Array.isArray(paint.gradientStops)) {
					const opacity = paint.opacity ?? 1;
					if (opacity >= 1) continue;

					for (const stop of paint.gradientStops) {
						const boundVars = stop.boundVariables;
						if (boundVars?.color) {
							const varId = boundVars.color.id;
							const variable = await figma.variables.getVariableByIdAsync(varId);
							if (!variable) continue;

							const normalizedStyleName = normalizeName(style.name);
							const normalizedVarName = normalizeName(variable.name);

							if (normalizedStyleName === normalizedVarName) {
								opacityMap.set(varId, opacity);
							}
						}
					}
				}
			}
		}
	} catch (_e) {
		// Styles API may not be available in all contexts
	}

	return opacityMap;
}

/**
 * Normalize a style or variable name for comparison.
 * Strips collection prefixes (semantics/, aliases/, primitives/)
 * and common intermediary segments (status/) to match across naming conventions.
 */
function normalizeName(name: string): string {
	return name
		.replace(/^(semantics|aliases|primitives)\//i, "")
		.replace(/\/status\//g, "/")
		.toLowerCase();
}

// ============================================================================
// CSS VARIABLE NAME GENERATION
// ============================================================================

// Infer CSS variable prefix from variable name path
/**
 * Convert a Figma variable name to a CSS custom property name.
 *
 * Figma variable paths use `/` as segment separators. CSS custom properties
 * use `-`. The conversion is a simple 1:1 replacement — no prefix inference
 * or category stripping needed because Figma variable names are structured
 * to produce the correct CSS name directly.
 *
 * Examples:
 *   color/brand/primary/500  → --color-brand-primary-500
 *   spacing/4                → --spacing-4
 *   z-layer/base             → --z-layer-base
 *   background (semantics)   → --background
 */
function toVarName(
	name: string,
	_resolvedType: string,
	_collectionName?: string,
): string {
	return `--${name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase()}`;
}

// ============================================================================
// FONT STACK ENRICHMENT
// ============================================================================

/** Generic fallback stacks by category */
const FONT_FALLBACKS: Record<string, string> = {
	sans: "ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
	serif: "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif",
	mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
};

/**
 * Detect the font category from a font name.
 * Uses the variable path (e.g., font/family/sans) if available,
 * otherwise infers from common font name patterns.
 */
function detectFontCategory(variableName: string, fontName: string): keyof typeof FONT_FALLBACKS | null {
	const lower = variableName.toLowerCase();
	// Check variable path first (most reliable)
	if (lower.includes("/sans") || lower.includes("/primary")) return "sans";
	if (lower.includes("/serif") || lower.includes("/secondary")) return "serif";
	if (lower.includes("/mono") || lower.includes("/tertiary")) return "mono";

	// Infer from font name
	const nameLower = fontName.toLowerCase();
	const monoPatterns = ["mono", "code", "consolas", "menlo", "courier", "fira code", "jetbrains", "source code", "ibm plex mono"];
	const serifPatterns = ["serif", "georgia", "garamond", "palatino", "times", "playfair", "merriweather", "lora", "pt serif", "noto serif", "source serif"];

	if (monoPatterns.some(p => nameLower.includes(p))) return "mono";
	if (serifPatterns.some(p => nameLower.includes(p))) return "serif";

	// Default to sans for everything else
	return "sans";
}

/**
 * Enrich a bare font name with proper CSS font stack fallbacks.
 * "Inter" → '"Inter", ui-sans-serif, system-ui, sans-serif, ...'
 */
function toFontStack(fontName: string, variableName: string): string {
	const category = detectFontCategory(variableName, fontName);
	if (!category) return `"${fontName}"`;

	const fallbacks = FONT_FALLBACKS[category];
	// Quote the font name if it contains spaces, otherwise still quote for consistency
	const quoted = `"${fontName}"`;
	return `${quoted}, ${fallbacks}`;
}

/**
 * Check if a variable represents a font family token.
 */
function isFontFamilyVariable(variableName: string): boolean {
	const lower = variableName.toLowerCase();
	return lower.startsWith("font/family/") || lower.startsWith("font-family/");
}

// ============================================================================
// VALUE CONVERSION
// ============================================================================

/**
 * Convert a Figma variable value to a CSS value string.
 * When the value is a variable alias and that variable has style-level opacity,
 * wraps the reference in color-mix().
 */
async function valueToCSS(
	value: VariableValue,
	variable: Variable,
	colorFormat: ColorFormat,
	includeColorMix: boolean,
	opacityMap: Map<string, number>,
	_collectionName?: string,
): Promise<string> {
	if (isVariableAlias(value)) {
		const aliasId = (value as VariableAlias).id;
		const ref = await resolveVariableReference(aliasId);
		if (ref) {
			const refVar = await figma.variables.getVariableByIdAsync(aliasId);
			if (refVar) {
				// Resolve the referenced variable's collection name for correct naming
				const refCollection = await figma.variables.getVariableCollectionByIdAsync(
					refVar.variableCollectionId,
				);
				const refCollectionName = refCollection?.name;
				const cssRef = `var(${toVarName(refVar.name, refVar.resolvedType, refCollectionName)})`;

				// Check if THIS variable (not the referenced one) has style-level opacity
				if (includeColorMix && variable.resolvedType === "COLOR") {
					const opacity = opacityMap.get(variable.id);
					if (opacity !== undefined && opacity < 1) {
						const transparencyPercent = Math.round((1 - opacity) * 100);
						return `color-mix(in srgb, ${cssRef}, transparent ${transparencyPercent}%)`;
					}
				}

				return cssRef;
			}
		}
		return "var(--unknown-ref)";
	}

	switch (variable.resolvedType) {
		case "COLOR":
			if (typeof value === "object" && value !== null && "r" in value) {
				const color = value as RGB & { a?: number };
				// Direct color values: always use rgba() — color-mix is only for
				// style-level opacity on referenced variables (handled above for aliases)
				return convertColor(color, colorFormat);
			}
			return String(value);
		case "FLOAT": {
			const varLower = variable.name.toLowerCase();
			const firstSeg = varLower.split("/")[0];
			// Duration → ms
			if (varLower.includes("duration")) {
				return `${value}ms`;
			}
			// Unitless values: z-index, font weights
			if (
				firstSeg === "z-layer" ||
				firstSeg === "z" ||
				firstSeg === "zlayer" ||
				firstSeg === "z-index" ||
				firstSeg === "zindex" ||
				(firstSeg === "font" && varLower.includes("weight/variable"))
			) {
				return `${value}`;
			}
			// Breakpoints stay in px for :root declarations.
			// The @theme inline block handles rem conversion for Tailwind v4.
			if (firstSeg === "breakpoints" || firstSeg === "breakpoint") {
				return `${value}px`;
			}
			return `${value}px`;
		}
		case "STRING":
			if (isFontFamilyVariable(variable.name)) {
				return toFontStack(String(value), variable.name);
			}
			return String(value);
		case "BOOLEAN":
			return String(value);
		default:
			return String(value);
	}
}

// ============================================================================
// COLLECTION CSS GENERATION
// ============================================================================

async function generateCollectionCSS(
	collection: VariableCollection,
	colorFormat: ColorFormat,
	options: {
		includeThemeInline: boolean;
		includeColorMix: boolean;
		excludePrefixes?: string[];
		rootExcludePrefixes?: string[];
	},
	opacityMap: Map<string, number>,
): Promise<CSSFile> {
	const allVariables = (await Promise.all(collection.variableIds
		.map((id) => figma.variables.getVariableByIdAsync(id))))
		.filter((v): v is Variable => v !== null);

	// Filter out excluded prefixes (e.g. shadow variables when shadow-tokens.css exists)
	const excludePrefixes = options.excludePrefixes;
	const rootExcludePrefixes = options.rootExcludePrefixes;
	const colName = collection.name;
	const variables = excludePrefixes
		? allVariables.filter((v) => {
				const varName = toVarName(v.name, v.resolvedType, colName);
				return !excludePrefixes.some((p) => varName.startsWith(p));
			})
		: allVariables;

	// Variables for :root — additionally exclude tokens that only belong in @theme inline
	const allExclude = [...(excludePrefixes ?? []), ...(rootExcludePrefixes ?? [])];
	const rootVariables = allExclude.length > 0
		? allVariables.filter((v) => {
				const varName = toVarName(v.name, v.resolvedType, colName);
				return !allExclude.some((p) => varName.startsWith(p));
			})
		: variables;

	const hasModes = collection.modes.length > 1;
	const lines: string[] = [];

	lines.push(
		`/* ${collection.name} — ${rootVariables.length} variables */`,
	);
	lines.push("");

	// @theme inline registers CSS variables with Tailwind v4
	// Uses `variables` (not `rootVariables`) so breakpoints still appear here
	if (options.includeThemeInline) {
		lines.push(await generateThemeInline(variables, collection, excludePrefixes));
	}

	if (hasModes) {
		for (let i = 0; i < collection.modes.length; i++) {
			const mode = collection.modes[i];

			if (i === 0) {
				lines.push(":root {");
				for (const variable of rootVariables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(
						variable.name,
						variable.resolvedType,
						colName,
					);
					const cssValue = await valueToCSS(
						value,
						variable,
						colorFormat,
						options.includeColorMix,
						opacityMap,
						colName,
					);
					lines.push(`  ${varName}: ${cssValue};`);
				}
				lines.push("}");
				lines.push("");
			} else if (isResponsiveMode(mode.name)) {
				const mediaQuery = modeToMediaQuery(mode.name);
				if (!mediaQuery) continue;
				lines.push(`${mediaQuery} {`);
				lines.push("  :root {");
				for (const variable of rootVariables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(
						variable.name,
						variable.resolvedType,
						colName,
					);
					const cssValue = await valueToCSS(
						value,
						variable,
						colorFormat,
						options.includeColorMix,
						opacityMap,
						colName,
					);
					lines.push(`    ${varName}: ${cssValue};`);
				}
				lines.push("  }");
				lines.push("}");
				lines.push("");
			} else {
				const selector = modeToSelector(mode.name);
				lines.push(`${selector} {`);
				for (const variable of rootVariables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(
						variable.name,
						variable.resolvedType,
						colName,
					);
					const cssValue = await valueToCSS(
						value,
						variable,
						colorFormat,
						options.includeColorMix,
						opacityMap,
						colName,
					);
					lines.push(`  ${varName}: ${cssValue};`);
				}
				lines.push("}");
				lines.push("");
			}
		}
	} else {
		const mode = collection.modes[0];
		lines.push(":root {");
		for (const variable of rootVariables) {
			const value = variable.valuesByMode[mode.modeId];
			if (value === undefined) continue;
			const varName = toVarName(variable.name, variable.resolvedType, colName);
			const cssValue = await valueToCSS(
				value,
				variable,
				colorFormat,
				options.includeColorMix,
				opacityMap,
				colName,
			);
			lines.push(`  ${varName}: ${cssValue};`);
		}
		lines.push("}");
		lines.push("");
	}

	return {
		name: `${collection.name.toLowerCase().replace(/\s+/g, "-")}.css`,
		content: lines.join("\n"),
		variableCount: rootVariables.length,
	};
}

// ============================================================================
// RESPONSIVE MODES
// ============================================================================

const RESPONSIVE_BREAKPOINTS: Record<string, string> = {
	mobile: "640px",
	sm: "640px",
	small: "640px",
	tablet: "768px",
	md: "768px",
	medium: "768px",
	desktop: "1024px",
	lg: "1024px",
	large: "1024px",
	xl: "1280px",
	wide: "1280px",
};

function isResponsiveMode(modeName: string): boolean {
	return modeName.toLowerCase() in RESPONSIVE_BREAKPOINTS;
}

function modeToMediaQuery(modeName: string): string | null {
	const minWidth = RESPONSIVE_BREAKPOINTS[modeName.toLowerCase()];
	return minWidth ? `@media (min-width: ${minWidth})` : null;
}

function modeToSelector(modeName: string): string {
	const lower = modeName.toLowerCase();
	if (lower === "dark") return ".dark";
	if (lower === "light") return ":root";
	const mediaQuery = modeToMediaQuery(modeName);
	if (mediaQuery) return mediaQuery;
	return `[data-mode="${lower}"]`;
}

// ============================================================================
// TAILWIND @theme inline
// ============================================================================

/**
 * Tailwind v4 theme namespaces — only variables with these prefixes get
 * registered in @theme inline for primitives. Other collections register
 * all variables (aliases) or map to --color-* (semantics).
 */
const TAILWIND_THEME_PREFIXES = [
	"--color-",
	"--shadow-",
	"--blur-",
	"--breakpoint-",
	"--ease-",
	"--duration-",
	// Note: --spacing-*, --size-*, --container-*, --rounded-* are intentionally
	// omitted — Tailwind v4 has built-in defaults for these namespaces and
	// re-registering them in @theme inline can cause overriding complications.
	// They remain available as plain CSS vars in :root for reference.
];

/**
 * Map a font-family variable path to the Tailwind utility name.
 * font/family/sans or font/family/primary → "sans"
 */
function inferTailwindFontKey(
	variableName: string,
): "sans" | "serif" | "mono" | null {
	const lower = variableName.toLowerCase();
	if (lower.includes("/sans") || lower.includes("/primary")) return "sans";
	if (lower.includes("/serif") || lower.includes("/secondary")) return "serif";
	if (lower.includes("/mono") || lower.includes("/tertiary")) return "mono";
	return null;
}

/**
 * Resolve a FLOAT variable to its raw numeric value, walking through
 * alias chains and trying all modes. Returns null if unresolvable.
 */
async function resolveToNumber(variable: Variable): Promise<number | null> {
	for (const mId of Object.keys(variable.valuesByMode)) {
		let v: VariableValue | undefined = variable.valuesByMode[mId];
		let depth = 0;
		while (isVariableAlias(v) && depth < 10) {
			const refVar = await figma.variables.getVariableByIdAsync(
				(v as VariableAlias).id,
			);
			if (!refVar) break;
			const refCol = await figma.variables.getVariableCollectionByIdAsync(
				refVar.variableCollectionId,
			);
			if (!refCol?.modes[0]) break;
			v = refVar.valuesByMode[refCol.modes[0].modeId];
			depth++;
		}
		if (typeof v === "number") return v;
	}
	return null;
}

async function generateThemeInline(
	variables: Variable[],
	collection: VariableCollection,
	excludePrefixes?: string[],
): Promise<string> {
	if (variables.length === 0) return "";

	const colName = collection.name;
	const isSemantics = colName.toLowerCase() === "semantics";
	const isPrimitives = colName.toLowerCase() === "primitives";
	const lines: string[] = [];
	lines.push("/* Tailwind CSS v4 @theme inline */");
	lines.push("@theme inline {");

	const entries: string[] = [];

	for (const variable of variables) {
		const varName = toVarName(variable.name, variable.resolvedType, colName);

		// Skip excluded prefixes (e.g. --shadow- when shadow-tokens.css handles them)
		if (excludePrefixes?.some((p) => varName.startsWith(p))) continue;

		if (isSemantics) {
			// Semantics: --color-{name}: var(--{name})
			const unprefixed = varName;
			entries.push(
				`  --color-${unprefixed.replace("--", "")}: var(${unprefixed});`,
			);
		} else if (isPrimitives) {
			// Primitives: only register vars that match Tailwind theme namespaces
			if (!TAILWIND_THEME_PREFIXES.some((p) => varName.startsWith(p))) continue;

			// Breakpoints need literal values — Tailwind compiles them into
			// @media conditions which can't use var() (CSS spec limitation).
			// var() is resolved at runtime but @media is evaluated at parse time.
			// Resolve through alias chains to find the raw number, convert to rem.
			if (varName.startsWith("--breakpoint-")) {
				const numValue = await resolveToNumber(variable);
				if (numValue !== null) {
					entries.push(`  ${varName}: ${numValue / 16}rem;`);
					continue;
				}
				// Fallback: try reading the raw value from the first mode directly
				const firstModeId = collection.modes[0]?.modeId;
				if (firstModeId !== undefined) {
					const raw = variable.valuesByMode[firstModeId];
					if (typeof raw === "number") {
						entries.push(`  ${varName}: ${raw / 16}rem;`);
						continue;
					}
				}
				// Skip entirely — a var() self-reference breaks @media queries
				continue;
			}

			entries.push(`  ${varName}: var(${varName});`);
		} else {
			// Other collections (aliases, etc.): register all
			entries.push(`  ${varName}: var(${varName});`);
		}
	}

	// Sort alphabetically by variable name for consistent output
	entries.sort((a, b) => {
		const aName = a.split(":")[0];
		const bName = b.split(":")[0];
		return aName.localeCompare(bName);
	});

	for (const entry of entries) {
		lines.push(entry);
	}

	lines.push("}");
	lines.push("");

	return lines.join("\n");
}

// ============================================================================
// EFFECTS: SHADOWS + BLURS
// ============================================================================

/** Tailwind v4 shadow scale (`--shadow-2xs` … `--shadow-2xl`); legacy Figma `shadow/0`…`shadow/6` still map here */
const EFFECTS_TAILWIND_SHADOW_ORDER = [
	"2xs",
	"xs",
	"sm",
	"md",
	"lg",
	"xl",
	"2xl",
] as const;

/** Legacy numeric effect-style steps → Tailwind shadow keys */
const EFFECTS_NUMERIC_SHADOW_TO_TAILWIND: Record<string, string> = {
	"0": "2xs",
	"1": "xs",
	"2": "sm",
	"3": "md",
	"4": "lg",
	"5": "xl",
	"6": "2xl",
};

const EFFECTS_BLUR_ORDER = [
	"xs",
	"sm",
	"md",
	"lg",
	"xl",
	"2xl",
	"3xl",
] as const;

function formatShadowAlpha(a: number): string {
	if (a >= 0.999) return "1";
	return String(Number.parseFloat(a.toPrecision(4)));
}

/**
 * One drop-shadow layer as CSS, using modern `rgb(r g b / a)` (Tailwind-aligned).
 * Short form only when blur and spread are both 0 (e.g. 2xs); otherwise x y blur spread color.
 */
function dropShadowLayerToCss(layer: DropShadowEffect): string {
	const x = `${Math.round(layer.offset.x)}px`;
	const y = `${Math.round(layer.offset.y)}px`;
	const blurPx = Math.round(layer.radius);
	const spreadPx = Math.round(layer.spread ?? 0);
	const r = Math.round((layer.color?.r ?? 0) * 255);
	const g = Math.round((layer.color?.g ?? 0) * 255);
	const b = Math.round((layer.color?.b ?? 0) * 255);
	const a = layer.color?.a ?? 1;
	const color = `rgb(${r} ${g} ${b} / ${formatShadowAlpha(a)})`;

	if (blurPx === 0 && spreadPx === 0) {
		return `${x} ${y} ${color}`;
	}
	const blur = `${blurPx}px`;
	const spread = `${spreadPx}px`;
	return `${x} ${y} ${blur} ${spread} ${color}`;
}

function effectStyleNameToTailwindShadowKey(styleName: string): string {
	const lower = styleName.toLowerCase().trim();
	const rest = lower.startsWith("shadow/")
		? lower.slice("shadow/".length)
		: lower.startsWith("shadow ")
			? lower.slice("shadow ".length).trim()
			: "";
	const segment = (rest.split("/").pop() ?? rest).trim();
	if (!segment) return "0";

	const mapped = EFFECTS_NUMERIC_SHADOW_TO_TAILWIND[segment];
	if (mapped !== undefined) return mapped;

	const segLower = segment.toLowerCase();
	if (
		(EFFECTS_TAILWIND_SHADOW_ORDER as readonly string[]).includes(segLower)
	) {
		return segLower;
	}

	if (/^\d+$/.test(segment)) return segment;
	return segLower.replace(/\s+/g, "-");
}

function tailwindShadowSortKey(key: string): [number, string] {
	const order = EFFECTS_TAILWIND_SHADOW_ORDER as readonly string[];
	const idx = order.indexOf(key);
	if (idx !== -1) return [idx, ""];
	const n = Number.parseInt(key, 10);
	if (!Number.isNaN(n)) return [100 + n, ""];
	return [1000, key];
}

function formatEffectsShadowBlock(cssVar: string, value: string): string[] {
	const prop = `  ${cssVar}:`;
	if (value.length <= 85 && !value.includes(",")) {
		return [`${prop} ${value};`];
	}
	return [prop, `    ${value};`];
}

/**
 * Generate effects.css from Figma effect styles (shadows) and blur variables.
 * In Figma these all live under "Effects" — keeping them in one file mirrors
 * that mental model and avoids scattering related tokens across files.
 *
 * Shadows use Tailwind v4 names (`--shadow-2xs` … `--shadow-2xl`). Effect styles
 * Production naming is `shadow/2xs`…`shadow/2xl` (matches Tailwind `shadow-*` utilities).
 * Legacy files may use `shadow/0`…`shadow/6`; those map to the same `--shadow-*` scale.
 * Output uses modern `rgb(r g b / a)` for box-shadow values.
 */
async function generateEffectsCSS(
	colorFormat: ColorFormat,
	opacityMap: Map<string, number>,
	includeThemeInline: boolean,
): Promise<CSSFile | null> {
	try {
		const shadowEntries: { key: string; lines: string[] }[] = [];

		// --- Shadows from effect styles ---
		const effectStyles = await figma.getLocalEffectStylesAsync();
		const shadowStyles = effectStyles.filter(
			(s) =>
				s.name.toLowerCase().startsWith("shadow/") ||
				s.name.toLowerCase().startsWith("shadow "),
		);

		const shadowByKey = new Map<string, string[]>();

		for (const style of shadowStyles) {
			const twKey = effectStyleNameToTailwindShadowKey(style.name);
			const layers = style.effects
				.filter((e) => e.type === "DROP_SHADOW" && e.visible !== false)
				.map((e) => dropShadowLayerToCss(e as DropShadowEffect));

			if (layers.length === 0) continue;

			const combined = layers.join(", ");
			shadowByKey.set(twKey, formatEffectsShadowBlock(`--shadow-${twKey}`, combined));
		}

		if (shadowByKey.size > 0) {
			const sortedKeys = [...shadowByKey.keys()].sort((a, b) => {
				const [ai, as] = tailwindShadowSortKey(a);
				const [bi, bs] = tailwindShadowSortKey(b);
				if (ai !== bi) return ai - bi;
				return as.localeCompare(bs);
			});
			for (const key of sortedKeys) {
				const blockLines = shadowByKey.get(key);
				if (blockLines) shadowEntries.push({ key, lines: blockLines });
			}
		}

		const shadowCount = shadowByKey.size;

		// --- Blur variables from primitives ---
		const blurEntries: { lines: string[] }[] = [];
		let blurCount = 0;

		const collections = await figma.variables.getLocalVariableCollectionsAsync();
		const primitives = collections.find(
			(c) => c.name.toLowerCase() === "primitives",
		);

		if (primitives) {
			const blurVars = (await Promise.all(primitives.variableIds
				.map((id) => figma.variables.getVariableByIdAsync(id))))
				.filter((v): v is Variable => v !== null)
				.filter((v) => v.name.toLowerCase().startsWith("blur/"));

			const blurOrder = EFFECTS_BLUR_ORDER as readonly string[];

			blurVars.sort((a, b) => {
				const segA = a.name.toLowerCase().replace(/^blur\//, "");
				const segB = b.name.toLowerCase().replace(/^blur\//, "");
				const ia = blurOrder.indexOf(segA);
				const ib = blurOrder.indexOf(segB);
				if (ia !== -1 && ib !== -1) return ia - ib;
				if (ia !== -1) return -1;
				if (ib !== -1) return 1;
				return segA.localeCompare(segB);
			});

			const modeId = primitives.modes[0].modeId;
			for (const variable of blurVars) {
				const varName = toVarName(variable.name, variable.resolvedType, primitives.name);
				const cssValue = await valueToCSS(
					variable.valuesByMode[modeId],
					variable,
					colorFormat,
					false,
					opacityMap,
					primitives.name,
				);
				blurEntries.push({
					lines: [`  ${varName}: ${cssValue};`],
				});
				blurCount++;
			}
		}

		const totalCount = shadowCount + blurCount;
		if (totalCount === 0) return null;

		const lines: string[] = [];
		lines.push("/* Effects — shadows and blurs */");
		lines.push("/* Shadows override Tailwind's defaults so values match Figma tokens */");
		lines.push(
			"/* Usage: shadow-md shadow-black/5 → md spread at 5% opacity */",
		);
		lines.push("");

		const emitThemeBlock = () => {
			lines.push("@theme inline {");
			if (shadowEntries.length > 0) {
				lines.push("  /* Shadows — Tailwind scale, customizable to match Figma */");
				for (const { lines: L } of shadowEntries) {
					for (const line of L) lines.push(line);
				}
			}
			if (shadowEntries.length > 0 && blurEntries.length > 0) lines.push("");
			if (blurEntries.length > 0) {
				lines.push("  /* Blurs */");
				for (const { lines: L } of blurEntries) {
					for (const line of L) lines.push(line);
				}
			}
			lines.push("}");
			lines.push("");
		};

		const emitRootBlock = () => {
			lines.push(":root {");
			if (shadowEntries.length > 0) {
				lines.push("  /* Shadows */");
				for (const { lines: L } of shadowEntries) {
					for (const line of L) lines.push(line);
				}
			}
			if (shadowEntries.length > 0 && blurEntries.length > 0) lines.push("");
			if (blurEntries.length > 0) {
				lines.push("  /* Blurs */");
				for (const { lines: L } of blurEntries) {
					for (const line of L) lines.push(line);
				}
			}
			lines.push("}");
			lines.push("");
		};

		if (includeThemeInline) {
			emitThemeBlock();
		} else {
			emitRootBlock();
		}

		return {
			name: "effects.css",
			content: lines.join("\n"),
			variableCount: totalCount,
		};
	} catch (_e) {
		return null;
	}
}

// ============================================================================
// TYPOGRAPHY: TYPESCALES + FONT FAMILY + FONT WEIGHT
// ============================================================================

/**
 * Breakpoint config — maps 5 CSS breakpoints to the 3 Figma modes.
 * lg and xl reuse desktop (md) values.
 */
const TYPESCALE_BREAKPOINTS = [
	{
		name: "xs",
		mode: "mobile (min)",
		minWidth: null,
		description: "Extra small (< 640px / mobile)",
	},
	{
		name: "sm",
		mode: "tablet (sm)",
		minWidth: "40rem",
		description: "Small (640px+ / tablet portrait)",
	},
	{
		name: "md",
		mode: "desktop (md)",
		minWidth: "48rem",
		description: "Medium (768px+ / tablet landscape)",
	},
	{
		name: "lg",
		mode: "desktop (md)",
		minWidth: "64rem",
		description: "Large (1024px+ / desktop)",
	},
	{
		name: "xl",
		mode: "desktop (md)",
		minWidth: "80rem",
		description: "Extra large (1280px+ / large desktop)",
	},
];

/** Canonical scale order for deterministic output */
const TYPESCALE_ORDER = [
	"xs", "sm", "base", "lg", "xl",
	"2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
];

/**
 * Map typescale names → HTML elements for @layer base.
 * Sorts scales by resolved font-size (largest → h1, smallest → small),
 * detects "body"/"base" for p/h6, and "callout" for blockquote.
 */
function generateBaseTypographyStyles(
	scaleNames: string[],
	baseValues: Map<string, string>,
): string[] {
	if (scaleNames.length < 3) return [];

	// Extract px sizes from calc(Npx * var(...)) for sorting
	const scaleWithSize: { name: string; px: number }[] = [];
	for (const name of scaleNames) {
		const val = baseValues.get(`--typography-${name}-font-size`);
		if (!val) continue;
		const pxMatch = val.match(/calc\((\d+(?:\.\d+)?)px/);
		if (pxMatch) {
			scaleWithSize.push({ name, px: Number.parseFloat(pxMatch[1]) });
		}
	}
	scaleWithSize.sort((a, b) => b.px - a.px);

	if (scaleWithSize.length < 3) return [];

	// Find body/base scale — prefer named match, fall back to median
	const bodyIndex = scaleWithSize.findIndex(
		(s) => s.name === "body" || s.name === "base",
	);
	const bodyScale =
		bodyIndex >= 0
			? scaleWithSize[bodyIndex]
			: scaleWithSize[Math.floor(scaleWithSize.length * 0.6)];
	const bodyName = bodyScale.name;
	const bodyPx = bodyScale.px;

	// Heading scales: everything larger than body, capped at 5
	const headingScales = scaleWithSize
		.filter((s) => s.px > bodyPx)
		.slice(0, 5);

	// Small scale: smallest that's below body
	const smallScale = scaleWithSize
		.filter((s) => s.px < bodyPx)
		.pop();

	// Callout: look for a named "callout" scale, or the scale just below body
	const calloutScale =
		scaleWithSize.find((s) => s.name.includes("callout")) ??
		scaleWithSize.find((s) => s.px < bodyPx && s !== smallScale) ??
		null;

	const el = (tag: string, scaleName: string, extra?: string) => {
		const out = [
			`  ${tag} {`,
			`    font-size: var(--typography-${scaleName}-font-size);`,
		];
		if (extra) out.push(`    ${extra}`);
		out.push(`    line-height: var(--typography-${scaleName}-line-height);`);
		out.push("  }");
		return out;
	};

	const lines: string[] = [];
	lines.push("/* Base Typography Styles */");
	lines.push("@layer base {");

	for (let i = 0; i < headingScales.length; i++) {
		lines.push(...el(`h${i + 1}`, headingScales[i].name));
	}

	// h6 — body size with bold weight
	lines.push(...el("h6", bodyName, "font-weight: 600;"));

	lines.push(...el("p", bodyName));

	if (smallScale) {
		lines.push(...el("small", smallScale.name));
	}

	if (calloutScale) {
		lines.push(...el("blockquote", calloutScale.name));
	}

	lines.push("");
	lines.push("  /* Typography Scale Classes — set --typography-scale per subtree */");
	lines.push("  .text-scale-sm { --typography-scale: 0.8; }");
	lines.push("  .text-scale-normal { --typography-scale: 1; }");
	lines.push("  .text-scale-lg { --typography-scale: 1.2; }");
	lines.push("  .text-scale-xl { --typography-scale: 1.4; }");

	lines.push("}");
	lines.push("");

	return lines;
}

/**
 * Generate typography.css — the single home for all type-related tokens:
 *   - Font families (with CSS font stack fallbacks)
 *   - Font weights
 *   - Responsive typescales (font-size, line-height per breakpoint)
 *
 * Pulls font-family and font-weight variables from primitives, and
 * responsive typescale variables from the responsive collection.
 * Generates:
 *   1. @theme inline mapping --font-*, --text-* for Tailwind v4
 *   2. :root block with font families and weights
 *   3. Responsive :root + @media blocks for typescales (deltas only)
 *   4. [data-window-size] selectors for Figma plugin context
 */
async function generateTypographyCSS(
	colorFormat: ColorFormat,
	opacityMap: Map<string, number>,
): Promise<CSSFile | null> {
	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		// --- Font family + font weight from primitives ---
		const primitives = collections.find(
			(c) => c.name.toLowerCase() === "primitives",
		);
		const fontFamilyVars: Variable[] = [];
		const fontWeightVars: Variable[] = [];

		if (primitives) {
			const primVars = (await Promise.all(primitives.variableIds
				.map((id) => figma.variables.getVariableByIdAsync(id))))
				.filter((v): v is Variable => v !== null);

			for (const v of primVars) {
				if (isFontFamilyVariable(v.name)) {
					fontFamilyVars.push(v);
				} else if (v.name.toLowerCase().startsWith("font/weight/") || v.name.toLowerCase().startsWith("font-weight/")) {
					fontWeightVars.push(v);
				}
			}
		}

		// --- Responsive typescales ---
		const responsive = collections.find(
			(c) => c.name.toLowerCase() === "responsive",
		);

		let typoVars: Variable[] = [];
		if (responsive) {
			const variables = (await Promise.all(responsive.variableIds
				.map((id) => figma.variables.getVariableByIdAsync(id))))
				.filter((v): v is Variable => v !== null);

			typoVars = variables.filter((v) =>
				v.name.toLowerCase().startsWith("typography/"),
			);
		}

		// Need at least something to generate
		if (fontFamilyVars.length === 0 && fontWeightVars.length === 0 && typoVars.length === 0) return null;

		// Group by scale: { "base": { "font-size": Variable, "line-height": Variable }, ... }
		const scales: Record<string, Record<string, Variable>> = {};
		for (const v of typoVars) {
			const parts = v.name.split("/");
			if (parts.length < 3) continue;
			const scale = parts[1];
			const prop = parts.slice(2).join("-");
			if (!scales[scale]) scales[scale] = {};
			scales[scale][prop] = v;
		}

		const scaleNames = Object.keys(scales).sort((a, b) => {
			const ai = TYPESCALE_ORDER.indexOf(a);
			const bi = TYPESCALE_ORDER.indexOf(b);
			return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
		});

		const hasTypescales = scaleNames.length > 0;

		const modeIdMap: Record<string, string> = {};
		if (responsive) {
			for (const m of responsive.modes) {
				modeIdMap[m.name] = m.modeId;
			}
		}

		const resolveToPixels = async (
			variable: Variable,
			modeId: string,
		): Promise<string | null> => {
			let value = variable.valuesByMode[modeId];
			if (value === undefined) return null;

			let depth = 0;
			while (isVariableAlias(value) && depth < 10) {
				const aliasId = (value as VariableAlias).id;
				const refVar = await figma.variables.getVariableByIdAsync(aliasId);
				if (!refVar) return null;
				const refCollection = await figma.variables.getVariableCollectionByIdAsync(
					refVar.variableCollectionId,
				);
				if (!refCollection) return null;
				const refModeId = refCollection.modes[0].modeId;
				value = refVar.valuesByMode[refModeId];
				depth++;
			}

			if (typeof value === "number") return `${value}px`;
			return null;
		};

		// Resolve all typography values for a given mode
		const resolveMode = async (modeName: string): Promise<Map<string, string>> => {
			const modeId = modeIdMap[modeName];
			if (!modeId) return new Map();
			const values = new Map<string, string>();
			for (const scale of scaleNames) {
				for (const prop of ["font-size", "line-height"]) {
					const variable = scales[scale][prop];
					if (!variable) continue;
					const px = await resolveToPixels(variable, modeId);
					if (!px) continue;
					values.set(
						`--typography-${scale}-${prop}`,
						`calc(${px} * var(--typography-scale, 1))`,
					);
				}
			}
			return values;
		};

		const emitMap = (indent: string, values: Map<string, string>) => {
			for (const [key, val] of values) {
				lines.push(`${indent}${key}: ${val};`);
			}
		};

		const getDelta = (
			current: Map<string, string>,
			previous: Map<string, string>,
		): Map<string, string> => {
			const delta = new Map<string, string>();
			for (const [key, val] of current) {
				if (previous.get(key) !== val) {
					delta.set(key, val);
				}
			}
			return delta;
		};

		const serializeMap = (m: Map<string, string>): string =>
			[...m.entries()]
				.map(([k, v]) => `${k}:${v}`)
				.sort()
				.join("|");

		// Resolve typescale values for every breakpoint
		const resolved = hasTypescales
			? await Promise.all(TYPESCALE_BREAKPOINTS.map(async (bp) => ({
					...bp,
					values: await resolveMode(bp.mode),
				})))
			: [];

		const lines: string[] = [];
		let variableCount = 0;
		lines.push(
			"/* Typography — font families, weights, and responsive typescales */",
		);
		lines.push("");

		// --- @theme inline for Tailwind v4 ---
		const themeEntries: string[] = [];

		// Global typography scale multiplier
		if (hasTypescales) {
			themeEntries.push("  --typography-scale: 1;");
		}

		// Font family → --font-sans, --font-serif, --font-mono
		for (const v of fontFamilyVars) {
			const varName = toVarName(v.name, v.resolvedType, "primitives");
			const twKey = inferTailwindFontKey(v.name);
			if (twKey) {
				themeEntries.push(`  --font-${twKey}: var(${varName});`);
			}
		}

		// Typescale → --text-* mappings
		if (hasTypescales) {
			for (const scale of scaleNames) {
				if (scales[scale]["font-size"]) {
					themeEntries.push(
						`  --text-${scale}: var(--typography-${scale}-font-size);`,
					);
				}
				if (scales[scale]["line-height"]) {
					themeEntries.push(
						`  --text-${scale}--line-height: var(--typography-${scale}-line-height);`,
					);
				}
			}
		}

		if (themeEntries.length > 0) {
			lines.push("@theme inline {");
			for (const entry of themeEntries) lines.push(entry);
			lines.push("}");
			lines.push("");
		}

		// --- :root — font families and weights ---
		const fontRootLines: string[] = [];
		const primModeId = primitives?.modes[0]?.modeId;

		if (primModeId !== undefined) {
			for (const v of fontFamilyVars) {
				const varName = toVarName(v.name, v.resolvedType, "primitives");
				const cssValue = await valueToCSS(
					v.valuesByMode[primModeId],
					v,
					colorFormat,
					false,
					opacityMap,
					"primitives",
				);
				fontRootLines.push(`  ${varName}: ${cssValue};`);
				variableCount++;
			}
			for (const v of fontWeightVars) {
				const varName = toVarName(v.name, v.resolvedType, "primitives");
				const cssValue = await valueToCSS(
					v.valuesByMode[primModeId],
					v,
					colorFormat,
					false,
					opacityMap,
					"primitives",
				);
				fontRootLines.push(`  ${varName}: ${cssValue};`);
				variableCount++;
			}
		}

		if (fontRootLines.length > 0) {
			lines.push(":root {");
			for (const line of fontRootLines) lines.push(line);
			lines.push("}");
			lines.push("");
		}

		// --- Responsive typescales ---
		if (hasTypescales && resolved.length > 0) {
			variableCount += typoVars.length;

			// :root — base mobile values
			lines.push(":root {");
			emitMap("  ", resolved[0].values);
			lines.push("}");
			lines.push("");

			// @media queries — emit only values that changed from previous breakpoint
			let previousMedia = resolved[0].values;
			for (const bp of resolved.slice(1)) {
				if (!bp.minWidth) continue;
				const delta = getDelta(bp.values, previousMedia);
				if (delta.size === 0) continue;

				lines.push(`/* ${bp.description} */`);
				lines.push(`@media (min-width: ${bp.minWidth}) {`);
				lines.push("  :root {");
				emitMap("    ", delta);
				lines.push("  }");
				lines.push("}");
				lines.push("");

				previousMedia = bp.values;
			}

			// [data-window-size] — full override selectors for Figma plugin context.
			// Group breakpoints that resolve to identical values into combined selectors.
			const windowGroups: {
				selectors: string[];
				values: Map<string, string>;
				descriptions: string[];
			}[] = [];

			for (const bp of resolved) {
				const serialized = serializeMap(bp.values);
				const existing = windowGroups.find(
					(g) => serializeMap(g.values) === serialized,
				);
				if (existing) {
					existing.selectors.push(`[data-window-size="${bp.name}"]`);
					existing.descriptions.push(bp.description);
				} else {
					windowGroups.push({
						selectors: [`[data-window-size="${bp.name}"]`],
						values: bp.values,
						descriptions: [bp.description],
					});
				}
			}

			for (const group of windowGroups) {
				lines.push(
					`/* Window-responsive: ${group.descriptions.join(" / ")} */`,
				);
				lines.push(`${group.selectors.join(",\n")} {`);
				emitMap("  ", group.values);
				lines.push("}");
				lines.push("");
			}

			// --- @layer base: element mappings + scale utilities ---
			const baseLines = generateBaseTypographyStyles(scaleNames, resolved[0].values);
			if (baseLines.length > 0) {
				for (const line of baseLines) lines.push(line);
			}
		}

		return {
			name: "typography.css",
			content: lines.join("\n"),
			variableCount,
		};
	} catch (_e) {
		return null;
	}
}

// ============================================================================
// RADIUS SCALING SYSTEM
// ============================================================================

/**
 * Generate radius.css with @theme inline block for Tailwind integration.
 * Uses --corner-radius anchor and --radius-multiplier for global scaling.
 */
async function generateRadiusCSS(): Promise<CSSFile | null> {
	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		// Find the radius anchor value. Strategy:
		// 1. Look for "rounded/lg" in aliases (the anchor point at 10px)
		// 2. Fall back to "corner-radius" or "corner/radius" in primitives
		let anchor: number | null = null;

		for (const col of collections) {
			const variables = (await Promise.all(col.variableIds
				.map((id) => figma.variables.getVariableByIdAsync(id))))
				.filter((v): v is Variable => v !== null);
			const modeId = col.modes[0].modeId;

			// Look for rounded/lg (the anchor)
			const roundedLg = variables.find(
				(v) => v.name.toLowerCase() === "rounded/lg",
			);
			if (roundedLg) {
				let value = roundedLg.valuesByMode[modeId];
				// Follow aliases to get the resolved value
				let depth = 0;
				while (isVariableAlias(value) && depth < 10) {
					const refVar = await figma.variables.getVariableByIdAsync(
						(value as VariableAlias).id,
					);
					if (!refVar) break;
					const refCol = await figma.variables.getVariableCollectionByIdAsync(
						refVar.variableCollectionId,
					);
					if (!refCol) break;
					value = refVar.valuesByMode[refCol.modes[0].modeId];
					depth++;
				}
				if (typeof value === "number") {
					anchor = value;
					break;
				}
			}

			// Fall back to corner-radius variable
			const cornerRadius = variables.find(
				(v) =>
					v.name.toLowerCase().includes("corner-radius") ||
					v.name.toLowerCase().includes("corner/radius"),
			);
			if (cornerRadius) {
				const value = cornerRadius.valuesByMode[modeId];
				if (typeof value === "number") {
					anchor = value;
					break;
				}
			}
		}

		if (anchor === null) return null;
		const lines: string[] = [];

		lines.push("@theme inline {");
		lines.push("  /* Tailwind default: `rounded` class (matches md) */");
		lines.push("  --radius: calc((var(--corner-radius) - 2px) * var(--radius-multiplier));");
		lines.push("");
		lines.push("  /* Lower Scale */");
		lines.push(
			`  --radius-2xs: calc((var(--corner-radius) - ${anchor - 2}px) * var(--radius-multiplier));`,
		);
		lines.push(
			`  --radius-xs: calc((var(--corner-radius) - ${anchor - 4}px) * var(--radius-multiplier));`,
		);
		lines.push(
			`  --radius-sm: calc((var(--corner-radius) - ${anchor - 6}px) * var(--radius-multiplier));`,
		);
		lines.push(
			`  --radius-md: calc((var(--corner-radius) - ${anchor - 8}px) * var(--radius-multiplier));`,
		);
		lines.push("");
		lines.push("  /* The Anchor */");
		lines.push(
			"  --radius-lg: calc(var(--corner-radius) * var(--radius-multiplier));",
		);
		lines.push("");
		lines.push("  /* Upper Scale */");
		lines.push(
			"  --radius-xl: calc((var(--corner-radius) + 4px) * var(--radius-multiplier));",
		);
		lines.push(
			"  --radius-2xl: calc((var(--corner-radius) + 8px) * var(--radius-multiplier));",
		);
		lines.push(
			"  --radius-3xl: calc((var(--corner-radius) + 12px) * var(--radius-multiplier));",
		);
		lines.push(
			"  --radius-4xl: calc((var(--corner-radius) + 16px) * var(--radius-multiplier));",
		);
		lines.push("  --radius-full: calc(9999px * var(--radius-multiplier));");
		lines.push("}");
		lines.push("");
		lines.push(":root {");
		lines.push(`  --corner-radius: ${anchor}px;`);
		lines.push("  --radius-multiplier: 1;");
		lines.push("}");
		lines.push("");

		return {
			name: "radius.css",
			content: lines.join("\n"),
			variableCount: 1,
		};
	} catch (_e) {
		return null;
	}
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

// Exported for testing
export {
	toVarName,
	normalizeName,
	modeToSelector,
	isResponsiveMode,
	modeToMediaQuery,
	TYPESCALE_BREAKPOINTS,
	TYPESCALE_ORDER,
	TAILWIND_THEME_PREFIXES,
	detectFontCategory,
	toFontStack,
	isFontFamilyVariable,
	inferTailwindFontKey,
	generateBaseTypographyStyles,
};

export async function generateCSS(options: CSSGeneratorOptions): Promise<CSSExportResult> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const selected =
		options.collectionIds.length > 0
			? collections.filter((c) => options.collectionIds.includes(c.id))
			: collections;

	if (selected.length === 0) {
		return { files: [], totalVariables: 0, totalCollections: 0 };
	}

	// Build opacity map from paint styles — the core differentiator
	// This detects opacity stored on Figma styles (not on variable values)
	// and preserves it via color-mix() in the CSS output
	const opacityMap = options.includeColorMix
		? await buildStyleOpacityMap()
		: new Map<string, number>();

	// Sort: dependency order (primitives → aliases → semantics), then by mode count
	const COLLECTION_ORDER: Record<string, number> = {
		primitives: 0,
		aliases: 1,
		semantics: 2,
	};
	const sorted = [...selected].sort((a, b) => {
		const aOrder = COLLECTION_ORDER[a.name.toLowerCase()] ?? 99;
		const bOrder = COLLECTION_ORDER[b.name.toLowerCase()] ?? 99;
		if (aOrder !== bOrder) return aOrder - bOrder;
		if (a.modes.length === b.modes.length) return a.name.localeCompare(b.name);
		return a.modes.length - b.modes.length;
	});

	const files: CSSFile[] = [];
	let totalVariables = 0;

	// Generate specialized files first so we know which prefixes to exclude
	// from primitives (avoids duplication)
	const effectsFile = await generateEffectsCSS(
		options.colorFormat,
		opacityMap,
		options.includeThemeInline,
	);
	const radiusFile = await generateRadiusCSS();

	// Excluded from primitives entirely (both @theme inline and :root):
	const primitivesExclude: string[] = [];
	if (effectsFile) {
		primitivesExclude.push("--shadow-");
		primitivesExclude.push("--blur-");
	}
	// Note: --rounded-* stays in primitives :root as reference CSS vars.
	// radius.css provides the dynamic --radius-* calc() versions for Tailwind.

	// Generate typography.css — consolidates font families, weights, and
	// responsive typescales into a single file. Exclude all font-related
	// prefixes from ALL collections to avoid duplication.
	const typographyFile = await generateTypographyCSS(options.colorFormat, opacityMap);

	// Font-related prefixes excluded from every collection when typography.css
	// handles them — prevents font aliases in aliases.css duplicating typography.css.
	const typographyExclude: string[] = [];
	if (typographyFile) {
		typographyExclude.push("--font-family-");
		typographyExclude.push("--font-weight-");
		primitivesExclude.push("--font-family-");
		primitivesExclude.push("--font-weight-");
		primitivesExclude.push("--font-typescale-");
	}

	// Excluded from :root only (still appear in @theme inline with literal values):
	// Breakpoints only need @theme inline — Tailwind compiles them into @media
	// conditions which require literal values, not var() references.
	const primitivesRootExclude: string[] = ["--breakpoint-"];

	for (const collection of sorted) {
		const colLower = collection.name.toLowerCase();
		// Skip the "responsive" collection — its typography variables are
		// consumed by generateTypographyCSS() which resolves aliases to px,
		// adds @media queries, [data-window-size] selectors, and utility classes.
		// Emitting it as a raw collection would duplicate data as var() aliases.
		if (colLower === "responsive") continue;
		// Skip the "tailwind-colors" collection — these palette colors
		// (red-50..950, blue-50..950, etc.) are built into Tailwind CSS v4.
		// Exporting them would duplicate what Tailwind provides natively.
		if (colLower === "tailwind-colors" || colLower === "tailwind colors")
			continue;

		const isPrimitives = colLower === "primitives";

		// Build per-collection exclude list:
		// - Primitives get full primitivesExclude (shadows, blurs, font-*)
		// - All other collections get typographyExclude (font-family, font-weight)
		const collectionExclude = isPrimitives
			? primitivesExclude
			: typographyExclude;

		const file = await generateCollectionCSS(
			collection,
			options.colorFormat,
			{
				includeThemeInline: options.includeThemeInline,
				includeColorMix: options.includeColorMix,
				excludePrefixes: collectionExclude.length > 0 ? collectionExclude : undefined,
				rootExcludePrefixes: isPrimitives ? primitivesRootExclude : undefined,
			},
			opacityMap,
		);
		files.push(file);
		totalVariables += file.variableCount;
	}

	// Append effects (shadows + blurs) after collection files
	if (effectsFile) {
		files.push(effectsFile);
		totalVariables += effectsFile.variableCount;
	}

	if (typographyFile) {
		files.push(typographyFile);
		totalVariables += typographyFile.variableCount;
	}

	if (radiusFile) {
		files.push(radiusFile);
		totalVariables += radiusFile.variableCount;
	}

	// Generate index file that imports all
	if (files.length > 1) {
		const indexContent = `${files.map((f) => `@import "./${f.name}";`).join("\n")}\n`;
		files.push({
			name: "index.css",
			content: indexContent,
			variableCount: 0,
		});
	}

	return {
		files,
		totalVariables,
		totalCollections: sorted.length,
	};
}
