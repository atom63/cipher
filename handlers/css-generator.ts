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

import { convertColor, convertColorOpaque } from "../libraries/color-converters";
import {
	isVariableAlias,
	resolveVariableReference,
} from "../libraries/variable-binding";

type ColorFormat = "oklch" | "hex" | "rgba" | "hsl";

interface CSSGeneratorOptions {
	collectionIds: string[];
	colorFormat: ColorFormat;
	includeThemeInline: boolean;
	includeColorMix: boolean;
}

interface CSSFile {
	name: string;
	content: string;
	variableCount: number;
}

interface CSSExportResult {
	files: CSSFile[];
	totalVariables: number;
	totalCollections: number;
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
				if (paint.type !== "SOLID" && paint.type !== "GRADIENT_LINEAR" &&
					paint.type !== "GRADIENT_RADIAL" && paint.type !== "GRADIENT_ANGULAR" &&
					paint.type !== "GRADIENT_DIAMOND") {
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
						// Style: "semantics/muted-foreground" → Variable: "shadcn/muted-foreground"
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
 * and common intermediary segments (status/, shadcn/) to match across naming conventions.
 */
function normalizeName(name: string): string {
	return name
		.replace(/^(semantics|abstractions|primitives)\//i, "")
		.replace(/\/status\//g, "/")
		.replace(/^shadcn\//i, "")
		.toLowerCase();
}

// ============================================================================
// CSS VARIABLE NAME GENERATION
// ============================================================================

// Infer CSS variable prefix from variable name path
function inferPrefix(name: string, resolvedType: string): string {
	const lower = name.toLowerCase();
	const firstSegment = lower.split("/")[0];

	if (resolvedType === "COLOR") {
		return "color";
	}

	if (firstSegment === "spacing" || lower.includes("/spacing/"))
		return "spacing";
	if (firstSegment === "radius" || lower.includes("/radius/")) return "radius";
	if (firstSegment === "size" || firstSegment === "sizes") return "size";
	if (firstSegment === "z-index" || firstSegment === "zindex") return "z";
	if (firstSegment === "opacity") return "opacity";
	if (firstSegment === "font-size" || lower.includes("font-size"))
		return "font-size";
	if (firstSegment === "line-height" || lower.includes("line-height"))
		return "line-height";
	if (firstSegment === "letter-spacing" || lower.includes("letter-spacing"))
		return "letter-spacing";
	if (firstSegment === "duration" || firstSegment === "motion")
		return "duration";
	if (firstSegment === "shadow" || firstSegment === "elevation")
		return "shadow";

	if (resolvedType === "FLOAT") return "size";

	return "";
}

// Convert variable name (e.g. "color/zinc/50") to CSS variable name (e.g. "--color-zinc-50")
function toVarName(name: string, resolvedType: string): string {
	const cssName = name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();
	const prefix = inferPrefix(name, resolvedType);

	if (prefix) {
		if (cssName.startsWith(`${prefix}-`)) {
			return `--${cssName}`;
		}
		return `--${prefix}-${cssName}`;
	}

	return `--${cssName}`;
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
): string {
	if (isVariableAlias(value)) {
		const aliasId = (value as VariableAlias).id;
		const ref = resolveVariableReference(aliasId);
		if (ref) {
			const refVar = figma.variables.getVariableById(aliasId);
			if (refVar) {
				const cssRef = `var(${toVarName(refVar.name, refVar.resolvedType)})`;

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
				const alpha = "a" in color && color.a !== undefined ? color.a : 1;
				if (includeColorMix && alpha < 1) {
					const opaqueColor = convertColorOpaque(color, colorFormat);
					const percentage = Math.round(alpha * 100);
					return `color-mix(in oklch, ${opaqueColor} ${percentage}%, transparent)`;
				}
				return convertColor(color, colorFormat);
			}
			return String(value);
		case "FLOAT":
			return `${value}px`;
		case "STRING":
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

	if (hasModes) {
		for (let i = 0; i < collection.modes.length; i++) {
			const mode = collection.modes[i];

			if (i === 0) {
				lines.push(":root {");
				for (const variable of variables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(variable.name, variable.resolvedType);
					const cssValue = valueToCSS(value, variable, colorFormat, options.includeColorMix, opacityMap);
					lines.push(`  ${varName}: ${cssValue};`);
				}
				lines.push("}");
				lines.push("");
			} else if (isResponsiveMode(mode.name)) {
				const mediaQuery = modeToMediaQuery(mode.name)!;
				lines.push(`${mediaQuery} {`);
				lines.push("  :root {");
				for (const variable of variables) {
					const value = variable.valuesByMode[mode.modeId];
					if (value === undefined) continue;
					const varName = toVarName(variable.name, variable.resolvedType);
					const cssValue = valueToCSS(value, variable, colorFormat, options.includeColorMix, opacityMap);
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
					const varName = toVarName(variable.name, variable.resolvedType);
					const cssValue = valueToCSS(value, variable, colorFormat, options.includeColorMix, opacityMap);
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
			const varName = toVarName(variable.name, variable.resolvedType);
			const cssValue = valueToCSS(value, variable, colorFormat, options.includeColorMix, opacityMap);
			lines.push(`  ${varName}: ${cssValue};`);
		}
		lines.push("}");
		lines.push("");
	}

	if (options.includeThemeInline) {
		lines.push(generateThemeInline(variables, collection));
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
	_collection: VariableCollection,
): string {
	const colorVars = variables.filter((v) => v.resolvedType === "COLOR");
	if (colorVars.length === 0) return "";

	const lines: string[] = [];
	lines.push("/* Tailwind CSS v4 @theme inline */");
	lines.push("@theme inline {");

	for (const variable of colorVars) {
		const varName = toVarName(variable.name, variable.resolvedType);
		lines.push(`  ${varName}: ${varName.replace("--", "var(--")});`);
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
			(s) => s.name.toLowerCase().startsWith("shadow/") || s.name.toLowerCase().startsWith("shadow "),
		);

		if (shadowStyles.length === 0) return null;

		// Sort by the numeric level in the name (shadow/0, shadow/1, etc.)
		shadowStyles.sort((a, b) => {
			const aNum = Number.parseInt(a.name.split(/[/\s]/).pop() || "0");
			const bNum = Number.parseInt(b.name.split(/[/\s]/).pop() || "0");
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
					const x = `${e.offset.x}px`;
					const y = `${e.offset.y}px`;
					const blur = `${e.radius}px`;
					const spread = `${e.spread ?? 0}px`;
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
				lines.push(`  .shadow-${level} { box-shadow: var(--shadow-${level}); }`);
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
	{ name: "xs", mode: "mobile (min)", minWidth: null, description: "Extra small (< 640px / mobile)" },
	{ name: "sm", mode: "tablet (sm)", minWidth: "40rem", description: "Small (640px+ / tablet portrait)" },
	{ name: "md", mode: "desktop (md)", minWidth: "48rem", description: "Medium (768px+ / tablet landscape)" },
	{ name: "lg", mode: "desktop (md)", minWidth: "64rem", description: "Large (1024px+ / desktop)" },
	{ name: "xl", mode: "desktop (md)", minWidth: "80rem", description: "Extra large (1280px+ / large desktop)" },
];

/** Tailwind text utility → typescale mapping */
const TAILWIND_TEXT_MAP: [string, string][] = [
	["text-xs", "caption-1"],
	["text-sm", "callout"],
	["text-base", "body"],
	["text-lg", "headline"],
	["text-xl", "title-3"],
	["text-2xl", "title-3"],
	["text-3xl", "title-2"],
	["text-4xl", "title-1"],
	["text-5xl", "large-title"],
	["text-6xl", "large-title"],
	["text-7xl", "large-title"],
	["text-8xl", "large-title"],
	["text-9xl", "large-title"],
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
		const typoVars = variables.filter(
			(v) => v.name.toLowerCase().startsWith("typography/"),
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
		const resolveToPixels = (variable: Variable, modeId: string): string | null => {
			let value = variable.valuesByMode[modeId];
			if (value === undefined) return null;

			// Follow aliases to get the resolved FLOAT value
			let depth = 0;
			while (isVariableAlias(value) && depth < 10) {
				const aliasId = (value as VariableAlias).id;
				const refVar = figma.variables.getVariableById(aliasId);
				if (!refVar) return null;
				// For the referenced variable, use its first mode's value
				const refCollection = figma.variables.getVariableCollectionById(refVar.variableCollectionId);
				if (!refCollection) return null;
				const refModeId = refCollection.modes[0].modeId;
				value = refVar.valuesByMode[refModeId];
				depth++;
			}

			if (typeof value === "number") return `${value}px`;
			return null;
		};

		const lines: string[] = [];
		lines.push("/* Responsive Typography — extracted from Figma responsive collection */");
		lines.push("/* Supports viewport-based (@media) and window-based ([data-window-size]) */");
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
					lines.push(`${indent}--typography-${scale}-${prop}: calc(${px} * var(--typography-scale, 1));`);
				}
			}
		};

		// :root — base mobile values
		lines.push(":root {");
		emitVars("  ", TYPESCALE_BREAKPOINTS[0].mode);
		lines.push("}");
		lines.push("");

		// [data-window-size="xs"] — explicit mobile
		lines.push(`/* Window-responsive: ${TYPESCALE_BREAKPOINTS[0].description} */`);
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
			lines.push(`  .size-${scale} { font-size: var(--typography-${scale}-font-size); }`);
		}

		lines.push("");
		lines.push("  /* Line Height Utilities (Custom Scale) */");
		for (const scale of scaleNames) {
			lines.push(`  .leading-${scale} { line-height: var(--typography-${scale}-line-height); }`);
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
		lines.push("  /* Tailwind Standard Text Utilities (mapped to custom scale) */");
		for (const [tw, scale] of TAILWIND_TEXT_MAP) {
			lines.push(`  .${tw} { font-size: var(--typography-${scale}-font-size); line-height: var(--typography-${scale}-line-height); }`);
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
		const primitives = collections.find(
			(c) => c.name.toLowerCase() === "primitives",
		);
		if (!primitives) return null;

		const variables = primitives.variableIds
			.map((id) => figma.variables.getVariableById(id))
			.filter((v): v is Variable => v !== null);

		// Find the corner-radius anchor variable
		const cornerRadius = variables.find(
			(v) => v.name.toLowerCase().includes("corner-radius") || v.name.toLowerCase().includes("corner/radius"),
		);
		if (!cornerRadius) return null;

		// Get the anchor value
		const modeId = primitives.modes[0].modeId;
		let anchorValue = cornerRadius.valuesByMode[modeId];
		if (isVariableAlias(anchorValue)) return null; // skip if alias
		if (typeof anchorValue !== "number") return null;

		const anchor = anchorValue;
		const lines: string[] = [];

		lines.push("@theme inline {");
		lines.push("  /* Tailwind default: `rounded` class */");
		lines.push(`  --radius: calc(4px * var(--radius-multiplier));`);
		lines.push("");
		lines.push("  /* Lower Scale */");
		lines.push(`  --radius-2xs: calc((var(--corner-radius) - ${anchor - 2}px) * var(--radius-multiplier));`);
		lines.push(`  --radius-xs: calc((var(--corner-radius) - ${anchor - 4}px) * var(--radius-multiplier));`);
		lines.push(`  --radius-sm: calc((var(--corner-radius) - ${anchor - 6}px) * var(--radius-multiplier));`);
		lines.push(`  --radius-md: calc((var(--corner-radius) - ${anchor - 8}px) * var(--radius-multiplier));`);
		lines.push("");
		lines.push("  /* The Anchor */");
		lines.push("  --radius-lg: calc(var(--corner-radius) * var(--radius-multiplier));");
		lines.push("");
		lines.push("  /* Upper Scale */");
		lines.push(`  --radius-xl: calc((var(--corner-radius) + 4px) * var(--radius-multiplier));`);
		lines.push(`  --radius-2xl: calc((var(--corner-radius) + 8px) * var(--radius-multiplier));`);
		lines.push(`  --radius-3xl: calc((var(--corner-radius) + 12px) * var(--radius-multiplier));`);
		lines.push(`  --radius-4xl: calc((var(--corner-radius) + 16px) * var(--radius-multiplier));`);
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
		const file = generateCollectionCSS(collection, options.colorFormat, {
			includeThemeInline: options.includeThemeInline,
			includeColorMix: options.includeColorMix,
		}, opacityMap);
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
		const indexContent = `${files.map((f) => `@import './${f.name}';`).join("\n")}\n`;
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
