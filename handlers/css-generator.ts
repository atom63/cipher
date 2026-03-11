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
function buildStyleOpacityMap(): Map<string, number> {
	const opacityMap = new Map<string, number>();

	try {
		const paintStyles = figma.getLocalPaintStyles();

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
						const variable = figma.variables.getVariableById(varId);
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
							const variable = figma.variables.getVariableById(varId);
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
 * Strips collection prefixes (semantics/, abstractions/, primitives/)
 * and common intermediary segments (status/) to match across naming conventions.
 */
function normalizeName(name: string): string {
	return name
		.replace(/^(semantics|abstractions|primitives)\//i, "")
		.replace(/\/status\//g, "/")
		.toLowerCase();
}

// ============================================================================
// CSS VARIABLE NAME GENERATION
// ============================================================================

// Infer CSS variable prefix from variable name path
function inferPrefix(name: string, _resolvedType: string): string {
	const lower = name.toLowerCase();
	const firstSegment = lower.split("/")[0];

	// Spacing → --spacing-*
	if (firstSegment === "spacing" || lower.includes("/spacing/"))
		return "spacing";
	// Sizes → --size-* (note: "sizes" category maps to "size" prefix)
	if (firstSegment === "size" || firstSegment === "sizes") return "size";
	// Radius → --radius-*
	if (firstSegment === "radius" || lower.includes("/radius/")) return "radius";
	// Rounded → --rounded-*
	if (firstSegment === "rounded") return "rounded";
	// Z-index → --z-*
	if (
		firstSegment === "z-index" ||
		firstSegment === "zindex" ||
		firstSegment === "zlayer"
	)
		return "z";
	// Font → --font-* (must come before generic /size/ check to avoid
	// font/typescale/base/size/md → --size-font-typescale-... )
	if (firstSegment === "font") return "font";
	// Size (matches deeper paths like component/size/*)
	if (lower.includes("/size/")) return "size";
	// Container → --container-*
	if (firstSegment === "container") return "container";
	// Motion / easing → --ease-*
	if (firstSegment === "motion" && lower.includes("easing")) return "ease";
	// Duration — any path containing "duration" (but not easing)
	if (lower.includes("duration")) return "duration";
	// Breakpoints → --breakpoint-*
	if (firstSegment === "breakpoints" || firstSegment === "breakpoint")
		return "breakpoint";
	// Screen → --screen-*
	if (firstSegment === "screen") return "screen";
	// Shadow → --shadow-*
	if (firstSegment === "shadow") return "shadow";
	// Blur → --blur-*
	if (firstSegment === "blur") return "blur";
	// Gap → --gap-*
	if (firstSegment === "gap") return "gap";
	// Margin → --margin-*
	if (firstSegment === "margin") return "margin";
	// Gutter → --gutter-*
	if (firstSegment === "gutter") return "gutter";
	// Surface → --surface-*
	if (firstSegment === "surface") return "surface";

	// Default: --color-* for color types
	return "color";
}

/**
 * Convert variable name to CSS variable name.
 *
 * Naming rules (matching generate-tokens.js):
 * - Semantics collection: no type prefix → --background
 * - Spacing: strip "spacing/" from path, add --spacing- prefix → --spacing-4
 * - Sizes: strip "sizes/" from path, add --size- prefix → --size-0
 * - Radius: strip "radius/" from path, add --radius- prefix → --radius-lg
 * - Duration/Motion: keep full path, add --duration- prefix → --duration-motion-duration-250
 * - Color: strip "color/" from path, add --color- prefix → --color-zinc-50
 * - Everything else: add --color- prefix → --color-font-family-sans
 */
function toVarName(
	name: string,
	resolvedType: string,
	collectionName?: string,
): string {
	const cssName = name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();

	// Semantics: no type prefix, use name directly
	if (collectionName?.toLowerCase() === "semantics") {
		return `--${cssName}`;
	}

	const prefix = inferPrefix(name, resolvedType);

	// Strip redundant category from the path to avoid double-prefix
	let cleanName = cssName;

	if (prefix === "color") {
		// Strip leading "color-" from path since prefix adds it
		if (cleanName.startsWith("color-")) {
			cleanName = cleanName.substring("color-".length);
		}
	} else {
		// For non-color prefixes, strip the matching category segment
		const prefixPattern = `${prefix}-`;
		if (cleanName.startsWith(prefixPattern)) {
			cleanName = cleanName.substring(prefixPattern.length);
		}
		// Also strip legacy/alternate category names that map to different prefixes
		if (cleanName.startsWith("spacing-")) {
			cleanName = cleanName.replace(/^spacing-/, "");
		} else if (cleanName.startsWith("sizes-")) {
			cleanName = cleanName.replace(/^sizes-/, "");
		} else if (cleanName.startsWith("radius-")) {
			cleanName = cleanName.replace(/^radius-/, "");
		} else if (cleanName.startsWith("rounded-")) {
			cleanName = cleanName.replace(/^rounded-/, "");
		} else if (cleanName.startsWith("zlayer-")) {
			cleanName = cleanName.replace(/^zlayer-/, "layer-");
		} else if (cleanName.startsWith("motion-easing-")) {
			cleanName = cleanName.replace(/^motion-easing-/, "");
		} else if (cleanName.startsWith("motion-duration-")) {
			cleanName = cleanName.replace(/^motion-duration-/, "");
		} else if (cleanName.startsWith("breakpoints-")) {
			cleanName = cleanName.replace(/^breakpoints-/, "");
		}
	}

	return `--${prefix}-${cleanName}`;
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
function valueToCSS(
	value: VariableValue,
	variable: Variable,
	colorFormat: ColorFormat,
	includeColorMix: boolean,
	opacityMap: Map<string, number>,
	_collectionName?: string,
): string {
	if (isVariableAlias(value)) {
		const aliasId = (value as VariableAlias).id;
		const ref = resolveVariableReference(aliasId);
		if (ref) {
			const refVar = figma.variables.getVariableById(aliasId);
			if (refVar) {
				// Resolve the referenced variable's collection name for correct naming
				const refCollection = figma.variables.getVariableCollectionById(
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
			// Unitless values: z-index, font weights, opacity, blur (raw number)
			if (
				firstSeg === "zlayer" ||
				firstSeg === "z-index" ||
				firstSeg === "zindex" ||
				(firstSeg === "font" && varLower.includes("weight/variable"))
			) {
				return `${value}`;
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

function generateCollectionCSS(
	collection: VariableCollection,
	colorFormat: ColorFormat,
	options: { includeThemeInline: boolean; includeColorMix: boolean },
	opacityMap: Map<string, number>,
): CSSFile {
	const variables = collection.variableIds
		.map((id) => figma.variables.getVariableById(id))
		.filter((v): v is Variable => v !== null);

	const hasModes = collection.modes.length > 1;
	const lines: string[] = [];

	lines.push(`/* ${collection.name} — ${variables.length} variables */`);
	lines.push("");

	const colName = collection.name;
	const isPrimitives = colName.toLowerCase() === "primitives";

	// @theme inline always comes before :root (matching generate-tokens.js)
	// Skip for primitives — no borderRadius tokens there, so nothing to register
	if (options.includeThemeInline && !isPrimitives) {
		lines.push(generateThemeInline(variables, collection));
	}

	if (hasModes) {
		for (let i = 0; i < collection.modes.length; i++) {
			const mode = collection.modes[i];

			if (i === 0) {
				lines.push(":root {");
				for (const variable of variables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(
						variable.name,
						variable.resolvedType,
						colName,
					);
					const cssValue = valueToCSS(
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
				for (const variable of variables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(
						variable.name,
						variable.resolvedType,
						colName,
					);
					const cssValue = valueToCSS(
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
				for (const variable of variables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(
						variable.name,
						variable.resolvedType,
						colName,
					);
					const cssValue = valueToCSS(
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
		for (const variable of variables) {
			const value = variable.valuesByMode[mode.modeId];
			if (value === undefined) continue;
			const varName = toVarName(variable.name, variable.resolvedType, colName);
			const cssValue = valueToCSS(
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
		variableCount: variables.length,
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

function generateThemeInline(
	variables: Variable[],
	collection: VariableCollection,
): string {
	if (variables.length === 0) return "";

	const colName = collection.name;
	const isSemantics = colName.toLowerCase() === "semantics";
	const lines: string[] = [];
	lines.push("/* Tailwind CSS v4 @theme inline */");
	lines.push("@theme inline {");

	// Build entries for ALL variable types
	const entries: string[] = [];

	for (const variable of variables) {
		const varName = toVarName(variable.name, variable.resolvedType, colName);

		if (isSemantics) {
			// Semantics: --color-{name}: var(--{name})
			const unprefixed = varName; // e.g., "--background"
			entries.push(
				`  --color-${unprefixed.replace("--", "")}: var(${unprefixed});`,
			);
		} else {
			// Other collections: self-reference for Tailwind registration
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
// SHADOW TOKENS FROM EFFECT STYLES
// ============================================================================

/**
 * Generate shadow-tokens.css from local effect styles.
 * Extracts drop-shadow effects, cleans Figma float precision artifacts,
 * and emits CSS custom properties + utility classes.
 */
function generateShadowCSS(): CSSFile | null {
	try {
		const effectStyles = figma.getLocalEffectStyles();
		// Find shadow styles (nested under "shadow/" path or named with numeric levels)
		const shadowStyles = effectStyles.filter(
			(s) =>
				s.name.toLowerCase().startsWith("shadow/") ||
				s.name.toLowerCase().startsWith("shadow "),
		);

		if (shadowStyles.length === 0) return null;

		// Sort by the numeric level in the name (shadow/0, shadow/1, etc.)
		shadowStyles.sort((a, b) => {
			const aNum = Number.parseInt(a.name.split(/[/\s]/).pop() || "0", 10);
			const bNum = Number.parseInt(b.name.split(/[/\s]/).pop() || "0", 10);
			return aNum - bNum;
		});

		const lines: string[] = [];
		lines.push("/* Shadow tokens — extracted from Figma effect styles */");
		lines.push("");
		lines.push(":root {");

		const levelNames: string[] = [];

		for (const style of shadowStyles) {
			const level = style.name.split(/[/\s]/).pop() || "0";
			const dropShadows = style.effects
				.filter((e) => e.type === "DROP_SHADOW" && e.visible !== false)
				.map((effect) => {
					const e = effect as DropShadowEffect;
					const x = `${Math.round(e.offset.x)}px`;
					const y = `${Math.round(e.offset.y)}px`;
					const blur = `${Math.round(e.radius)}px`;
					// Figma uses 'spread' property on DropShadowEffect
					const spreadVal = (e as any).spread ?? 0;
					const spread = `${Math.round(spreadVal)}px`;
					const r = Math.round((e.color?.r ?? 0) * 255);
					const g = Math.round((e.color?.g ?? 0) * 255);
					const b = Math.round((e.color?.b ?? 0) * 255);
					// Clean Figma's float precision artifacts
					const a = Number.parseFloat((e.color?.a ?? 1).toPrecision(4));
					return `${x} ${y} ${blur} ${spread} rgba(${r}, ${g}, ${b}, ${a})`;
				})
				.join(", ");

			if (dropShadows) {
				const desc = style.description ? ` /* ${style.description} */` : "";
				lines.push(`  --shadow-${level}: ${dropShadows};${desc}`);
				levelNames.push(level);
			}
		}

		lines.push("}");
		lines.push("");

		// Utility classes
		if (levelNames.length > 0) {
			lines.push("/* Utility classes for shadows */");
			lines.push("@layer utilities {");
			for (const level of levelNames) {
				lines.push(
					`  .shadow-${level} { box-shadow: var(--shadow-${level}); }`,
				);
			}
			lines.push("}");
			lines.push("");
		}

		return {
			name: "shadow-tokens.css",
			content: lines.join("\n"),
			variableCount: levelNames.length,
		};
	} catch (_e) {
		return null;
	}
}

// ============================================================================
// TYPESCALES FROM RESPONSIVE TYPOGRAPHY VARIABLES
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

/** Tailwind text utility → typescale mapping (matches STEP_NAMES_UP/DOWN) */
const TAILWIND_TEXT_MAP: [string, string][] = [
	["text-xs", "xs"],
	["text-sm", "sm"],
	["text-base", "base"],
	["text-lg", "lg"],
	["text-xl", "xl"],
	["text-2xl", "2xl"],
	["text-3xl", "3xl"],
	["text-4xl", "4xl"],
	["text-5xl", "5xl"],
];

/**
 * Generate typescales.css from the responsive collection's typography variables.
 * Resolves variable references to get actual px values, wraps in calc() with
 * --typography-scale multiplier, generates @media + [data-window-size] selectors
 * and utility classes.
 */
function generateTypescalesCSS(): CSSFile | null {
	try {
		const collections = figma.variables.getLocalVariableCollections();
		const responsive = collections.find(
			(c) => c.name.toLowerCase() === "responsive",
		);
		if (!responsive) return null;

		const variables = responsive.variableIds
			.map((id) => figma.variables.getVariableById(id))
			.filter((v): v is Variable => v !== null);

		// Find typography variables — match pattern "typography/{scale}/{font-size|line-height}"
		const typoVars = variables.filter((v) =>
			v.name.toLowerCase().startsWith("typography/"),
		);
		if (typoVars.length === 0) return null;

		// Group by scale: { "large-title": { "font-size": Variable, "line-height": Variable }, ... }
		const scales: Record<string, Record<string, Variable>> = {};
		for (const v of typoVars) {
			const parts = v.name.split("/");
			if (parts.length < 3) continue;
			const scale = parts[1];
			const prop = parts.slice(2).join("-"); // "font-size" or "line-height"
			if (!scales[scale]) scales[scale] = {};
			scales[scale][prop] = v;
		}

		const scaleNames = Object.keys(scales);
		if (scaleNames.length === 0) return null;

		// Build mode name → modeId map for the responsive collection
		const modeIdMap: Record<string, string> = {};
		for (const m of responsive.modes) {
			modeIdMap[m.name] = m.modeId;
		}

		// Helper: resolve a variable value to px string, following aliases
		const resolveToPixels = (
			variable: Variable,
			modeId: string,
		): string | null => {
			let value = variable.valuesByMode[modeId];
			if (value === undefined) return null;

			// Follow aliases to get the resolved FLOAT value
			let depth = 0;
			while (isVariableAlias(value) && depth < 10) {
				const aliasId = (value as VariableAlias).id;
				const refVar = figma.variables.getVariableById(aliasId);
				if (!refVar) return null;
				// For the referenced variable, use its first mode's value
				const refCollection = figma.variables.getVariableCollectionById(
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

		const lines: string[] = [];
		lines.push(
			"/* Responsive Typography — extracted from Figma responsive collection */",
		);
		lines.push(
			"/* Supports viewport-based (@media) and window-based ([data-window-size]) */",
		);
		lines.push("");

		// Helper: emit a set of typography variables for a mode
		const emitVars = (indent: string, modeName: string) => {
			const modeId = modeIdMap[modeName];
			if (!modeId) return;
			for (const scale of scaleNames) {
				for (const prop of ["font-size", "line-height"]) {
					const variable = scales[scale][prop];
					if (!variable) continue;
					const px = resolveToPixels(variable, modeId);
					if (!px) continue;
					lines.push(
						`${indent}--typography-${scale}-${prop}: calc(${px} * var(--typography-scale, 1));`,
					);
				}
			}
		};

		// :root — base mobile values
		lines.push(":root {");
		emitVars("  ", TYPESCALE_BREAKPOINTS[0].mode);
		lines.push("}");
		lines.push("");

		// [data-window-size="xs"] — explicit mobile
		lines.push(
			`/* Window-responsive: ${TYPESCALE_BREAKPOINTS[0].description} */`,
		);
		lines.push(`[data-window-size="xs"] {`);
		emitVars("  ", TYPESCALE_BREAKPOINTS[0].mode);
		lines.push("}");
		lines.push("");

		// Remaining breakpoints (sm, md, lg, xl)
		for (const bp of TYPESCALE_BREAKPOINTS.slice(1)) {
			if (bp.minWidth) {
				lines.push(`/* ${bp.description} */`);
				lines.push(`@media (min-width: ${bp.minWidth}) {`);
				lines.push("  :root {");
				emitVars("    ", bp.mode);
				lines.push("  }");
				lines.push("}");
				lines.push("");
			}

			lines.push(`/* Window-responsive: ${bp.description} */`);
			lines.push(`[data-window-size="${bp.name}"] {`);
			emitVars("  ", bp.mode);
			lines.push("}");
			lines.push("");
		}

		// Utility classes
		lines.push("/* Utility classes for typography */");
		lines.push("@layer utilities {");

		lines.push("  /* Font Size Utilities (Custom Scale) */");
		for (const scale of scaleNames) {
			lines.push(
				`  .size-${scale} { font-size: var(--typography-${scale}-font-size); }`,
			);
		}

		lines.push("");
		lines.push("  /* Line Height Utilities (Custom Scale) */");
		for (const scale of scaleNames) {
			lines.push(
				`  .leading-${scale} { line-height: var(--typography-${scale}-line-height); }`,
			);
		}

		lines.push("");
		lines.push("  /* Combined Typography Utilities (size + leading) */");
		for (const scale of scaleNames) {
			lines.push(`  .type-${scale} {`);
			lines.push(`    font-size: var(--typography-${scale}-font-size);`);
			lines.push(`    line-height: var(--typography-${scale}-line-height);`);
			lines.push("  }");
		}

		lines.push("");
		lines.push(
			"  /* Tailwind Standard Text Utilities (mapped to custom scale) */",
		);
		for (const [tw, scale] of TAILWIND_TEXT_MAP) {
			lines.push(
				`  .${tw} { font-size: var(--typography-${scale}-font-size); line-height: var(--typography-${scale}-line-height); }`,
			);
		}

		lines.push("}");
		lines.push("");

		return {
			name: "typescales.css",
			content: lines.join("\n"),
			variableCount: typoVars.length,
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
function generateRadiusCSS(): CSSFile | null {
	try {
		const collections = figma.variables.getLocalVariableCollections();

		// Find the radius anchor value. Strategy:
		// 1. Look for "rounded/lg" in abstractions (the anchor point at 10px)
		// 2. Fall back to "corner-radius" or "corner/radius" in primitives
		let anchor: number | null = null;

		for (const col of collections) {
			const variables = col.variableIds
				.map((id) => figma.variables.getVariableById(id))
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
					const refVar = figma.variables.getVariableById(
						(value as VariableAlias).id,
					);
					if (!refVar) break;
					const refCol = figma.variables.getVariableCollectionById(
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
		lines.push("  /* Tailwind default: `rounded` class */");
		lines.push("  --radius: calc(4px * var(--radius-multiplier));");
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
	inferPrefix,
	normalizeName,
	modeToSelector,
	isResponsiveMode,
	modeToMediaQuery,
	TYPESCALE_BREAKPOINTS,
	TAILWIND_TEXT_MAP,
	detectFontCategory,
	toFontStack,
	isFontFamilyVariable,
};

export function generateCSS(options: CSSGeneratorOptions): CSSExportResult {
	const collections = figma.variables.getLocalVariableCollections();
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
		? buildStyleOpacityMap()
		: new Map<string, number>();

	// Sort collections: single-mode first (primitives), multi-mode after (semantics)
	const sorted = [...selected].sort((a, b) => {
		if (a.modes.length === b.modes.length) return a.name.localeCompare(b.name);
		return a.modes.length - b.modes.length;
	});

	const files: CSSFile[] = [];
	let totalVariables = 0;

	for (const collection of sorted) {
		const colLower = collection.name.toLowerCase();
		// Skip the "responsive" collection — its typography variables are
		// consumed by generateTypescalesCSS() which resolves aliases to px,
		// adds @media queries, [data-window-size] selectors, and utility classes.
		// Emitting it as a raw collection would duplicate data as var() aliases.
		if (colLower === "responsive") continue;
		// Skip the "tailwind-colors" collection — these palette colors
		// (red-50..950, blue-50..950, etc.) are built into Tailwind CSS v4.
		// Exporting them would duplicate what Tailwind provides natively.
		if (colLower === "tailwind-colors" || colLower === "tailwind colors")
			continue;

		const file = generateCollectionCSS(
			collection,
			options.colorFormat,
			{
				includeThemeInline: options.includeThemeInline,
				includeColorMix: options.includeColorMix,
			},
			opacityMap,
		);
		files.push(file);
		totalVariables += file.variableCount;
	}

	// Generate specialized CSS files from styles and cross-collection data
	const shadowFile = generateShadowCSS();
	if (shadowFile) {
		files.push(shadowFile);
		totalVariables += shadowFile.variableCount;
	}

	const typescaleFile = generateTypescalesCSS();
	if (typescaleFile) {
		files.push(typescaleFile);
		totalVariables += typescaleFile.variableCount;
	}

	const radiusFile = generateRadiusCSS();
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
