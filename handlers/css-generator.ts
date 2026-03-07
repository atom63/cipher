// CSS Generator — converts Figma variables to CSS custom properties
// Runs in the main thread (Figma sandbox), generates CSS strings to send to UI

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

// Infer CSS variable prefix from variable name path
function inferPrefix(name: string, resolvedType: string): string {
	const lower = name.toLowerCase();
	const firstSegment = lower.split("/")[0];

	if (resolvedType === "COLOR") {
		return "color";
	}

	// Common naming conventions
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

	// FLOAT without clear category
	if (resolvedType === "FLOAT") return "size";

	return "";
}

// Convert variable name (e.g. "color/zinc/50") to CSS variable name (e.g. "color-zinc-50")
function toVarName(name: string, resolvedType: string): string {
	// Replace / with - and normalize
	const cssName = name.replace(/\//g, "-").replace(/\s+/g, "-").toLowerCase();

	// Determine prefix
	const prefix = inferPrefix(name, resolvedType);

	if (prefix) {
		// Check if name already starts with the prefix to avoid duplication
		if (cssName.startsWith(`${prefix}-`)) {
			return `--${cssName}`;
		}
		return `--${prefix}-${cssName}`;
	}

	return `--${cssName}`;
}

// Convert a Figma variable value to a CSS value string
function valueToCSS(
	value: VariableValue,
	variable: Variable,
	colorFormat: ColorFormat,
): string {
	if (isVariableAlias(value)) {
		const ref = resolveVariableReference((value as VariableAlias).id);
		if (ref) {
			// Get the referenced variable to build the correct CSS var name
			const refVar = figma.variables.getVariableById(
				(value as VariableAlias).id,
			);
			if (refVar) {
				return `var(${toVarName(refVar.name, refVar.resolvedType)})`;
			}
		}
		return "var(--unknown-ref)";
	}

	switch (variable.resolvedType) {
		case "COLOR":
			if (typeof value === "object" && value !== null && "r" in value) {
				return convertColor(value as RGB, colorFormat);
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

// Generate CSS for a single collection
function generateCollectionCSS(
	collection: VariableCollection,
	colorFormat: ColorFormat,
	options: { includeThemeInline: boolean; includeColorMix: boolean },
): CSSFile {
	const variables = collection.variableIds
		.map((id) => figma.variables.getVariableById(id))
		.filter((v): v is Variable => v !== null);

	const hasModes = collection.modes.length > 1;
	const lines: string[] = [];

	lines.push(`/* ${collection.name} — ${variables.length} variables */`);
	lines.push("");

	if (hasModes) {
		// Multi-mode: generate :root for first mode, selectors for rest
		for (let i = 0; i < collection.modes.length; i++) {
			const mode = collection.modes[i];
			const selector = i === 0 ? ":root" : modeToSelector(mode.name);

			lines.push(`${selector} {`);

			for (const variable of variables) {
				const value = variable.valuesByMode[mode.modeId];
				if (value === undefined) continue;
				const varName = toVarName(variable.name, variable.resolvedType);
				const cssValue = valueToCSS(value, variable, colorFormat);
				lines.push(`  ${varName}: ${cssValue};`);
			}

			lines.push("}");
			lines.push("");
		}
	} else {
		// Single mode: everything under :root
		const mode = collection.modes[0];
		lines.push(":root {");

		for (const variable of variables) {
			const value = variable.valuesByMode[mode.modeId];
			if (value === undefined) continue;
			const varName = toVarName(variable.name, variable.resolvedType);
			const cssValue = valueToCSS(value, variable, colorFormat);
			lines.push(`  ${varName}: ${cssValue};`);
		}

		lines.push("}");
		lines.push("");
	}

	// Optional @theme inline block for Tailwind
	if (options.includeThemeInline) {
		lines.push(generateThemeInline(variables, collection));
	}

	return {
		name: `${collection.name.toLowerCase().replace(/\s+/g, "-")}.css`,
		content: lines.join("\n"),
		variableCount: variables.length,
	};
}

// Map mode names to CSS selectors
function modeToSelector(modeName: string): string {
	const lower = modeName.toLowerCase();
	if (lower === "dark") return ".dark";
	if (lower === "light") return ":root";
	// data attribute for custom modes
	return `[data-mode="${lower}"]`;
}

// Generate @theme inline block for Tailwind CSS v4
function generateThemeInline(
	variables: Variable[],
	collection: VariableCollection,
): string {
	const colorVars = variables.filter((v) => v.resolvedType === "COLOR");
	if (colorVars.length === 0) return "";

	const lines: string[] = [];
	lines.push("/* Tailwind CSS v4 @theme inline */");
	lines.push("@theme inline {");

	// Map each color variable to a Tailwind-compatible --color-* reference
	const _mode = collection.modes[0];
	for (const variable of colorVars) {
		const varName = toVarName(variable.name, variable.resolvedType);
		// Tailwind expects --color-{name}: oklch(... / <alpha-value>)
		// For references, point to the CSS variable
		lines.push(`  ${varName}: ${varName.replace("--", "var(--")});`);
	}

	lines.push("}");
	lines.push("");

	return lines.join("\n");
}

// Main export function
export function generateCSS(options: CSSGeneratorOptions): CSSExportResult {
	const collections = figma.variables.getLocalVariableCollections();
	const selected =
		options.collectionIds.length > 0
			? collections.filter((c) => options.collectionIds.includes(c.id))
			: collections;

	if (selected.length === 0) {
		return { files: [], totalVariables: 0, totalCollections: 0 };
	}

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
		});
		files.push(file);
		totalVariables += file.variableCount;
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
