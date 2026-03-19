/**
 * Color Ramp Parser — parses pasted CSS or JSON color ramps into DesignTokens.
 *
 * Supports:
 * - Radix UI CSS: --red-1 through --red-12 with light/dark modes
 * - Tailwind CSS: --color-blue-ribbon-50 through --color-blue-ribbon-950
 * - JSON: flat { "red-1": "#fff" } or nested { "red": { "1": "#fff" } }
 * - oklch() and color(display-p3 ...) values (prefers P3/@supports over hex)
 * - Multi-mode: detects :root/.light/.light-theme vs .dark/.dark-theme selectors
 *
 * Runs client-side in the UI thread for instant preview.
 */

import { parseColor } from "./color-parsers";
import type { ColorValue } from "../libraries/shared-types";
import type { DesignToken, ParseError } from "../types/tokens";

export interface RampStep {
	step: string;
	value: string;
	color: ColorValue | null;
}

export interface ParsedRamp {
	name: string;
	/** Steps for the primary (or only) mode */
	steps: RampStep[];
	/** If multi-mode, the detected modes and their steps */
	modes?: { name: string; steps: RampStep[] }[];
}

export interface RampParseResult {
	ramps: ParsedRamp[];
	errors: ParseError[];
}

// Known Tailwind shade steps for disambiguation
const TAILWIND_STEPS = new Set([
	"50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950",
]);

// Radix extra keys (detected but excluded from output)
const RADIX_EXTRAS = new Set([
	"contrast", "surface", "indicator", "track",
]);

// Selectors that indicate light mode
const LIGHT_SELECTORS = [":root", ".light", ".light-theme"];
// Selectors that indicate dark mode
const DARK_SELECTORS = [".dark", ".dark-theme"];

/**
 * Parse a CSS or JSON color ramp string into structured ramps.
 */
export function parseColorRamp(input: string): RampParseResult {
	const trimmed = input.trim();
	if (!trimmed) {
		return { ramps: [], errors: [{ message: "Empty input", severity: "error" }] };
	}

	// Detect JSON
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		try {
			const data = JSON.parse(trimmed);
			return parseJsonRamp(data);
		} catch {
			return { ramps: [], errors: [{ message: "Invalid JSON", severity: "error" }] };
		}
	}

	// Otherwise treat as CSS
	return parseCssRamp(trimmed);
}

// ============================================================================
// CSS PARSING
// ============================================================================

/** Detect mode from a CSS selector string */
function detectMode(selector: string): "light" | "dark" | null {
	const lower = selector.toLowerCase().trim();
	if (DARK_SELECTORS.some((s) => lower.includes(s))) return "dark";
	if (LIGHT_SELECTORS.some((s) => lower.includes(s))) return "light";
	return null;
}

/** Extract CSS selector blocks with their selectors and body content */
function extractSelectorBlocks(css: string): { selector: string; body: string }[] {
	const blocks: { selector: string; body: string }[] = [];
	// Match: selector { body } — handles nested braces by counting
	const re = /([^{}]+?)\{/g;
	let match: RegExpExecArray | null;

	while ((match = re.exec(css)) !== null) {
		const selector = match[1].trim();
		const start = re.lastIndex;
		let depth = 1;
		let pos = start;
		while (pos < css.length && depth > 0) {
			if (css[pos] === "{") depth++;
			else if (css[pos] === "}") depth--;
			pos++;
		}
		if (depth === 0) {
			blocks.push({ selector, body: css.slice(start, pos - 1) });
			re.lastIndex = pos;
		}
	}
	return blocks;
}

/** Extract CSS custom property declarations from a CSS string */
function extractDeclarations(css: string): Map<string, string> {
	const declarations = new Map<string, string>();
	const re = /--([\w-]+)\s*:\s*([^;]+);/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(css)) !== null) {
		declarations.set(match[1], match[2].trim());
	}
	return declarations;
}

function parseCssRamp(css: string): RampParseResult {
	// 1. Strip @supports blocks — extract their declarations keyed by mode,
	//    prefer them over base declarations for the same variable+mode.
	const p3DeclsByMode = new Map<string, Map<string, string>>(); // mode → (varName → value)

	// Find @supports blocks using brace counting (regex can't handle nested braces)
	const supportsRanges: [number, number][] = [];
	// Match @supports with nested parens: e.g. @supports (color: oklch(0 0 0)) {
	const supportsStartRe = /@supports\s*\((?:[^()]*|\([^()]*\))*\)\s*\{/g;
	let startMatch: RegExpExecArray | null;

	while ((startMatch = supportsStartRe.exec(css)) !== null) {
		const blockStart = supportsStartRe.lastIndex;
		let depth = 1;
		let pos = blockStart;
		while (pos < css.length && depth > 0) {
			if (css[pos] === "{") depth++;
			else if (css[pos] === "}") depth--;
			pos++;
		}
		if (depth === 0) {
			const inner = css.slice(blockStart, pos - 1);
			supportsRanges.push([startMatch.index, pos]);

			// Parse selector blocks inside @supports (handles nested @media too)
			const blocks = extractSelectorBlocks(inner);
			for (const block of blocks) {
				// Recurse into nested blocks (e.g. @media inside @supports)
				const innerBlocks = extractSelectorBlocks(block.body);
				const targetBlocks = innerBlocks.length > 0 ? innerBlocks : [block];
				for (const b of targetBlocks) {
					const mode = detectMode(b.selector) ?? detectMode(block.selector) ?? "light";
					if (!p3DeclsByMode.has(mode)) p3DeclsByMode.set(mode, new Map());
					const modeMap = p3DeclsByMode.get(mode)!;
					for (const [name, value] of extractDeclarations(b.body)) {
						modeMap.set(name, value);
					}
				}
			}
			// Also extract any flat declarations (no nested blocks)
			if (blocks.length === 0) {
				const topDecls = extractDeclarations(inner);
				if (topDecls.size > 0) {
					if (!p3DeclsByMode.has("light")) p3DeclsByMode.set("light", new Map());
					const modeMap = p3DeclsByMode.get("light")!;
					for (const [name, value] of topDecls) {
						modeMap.set(name, value);
					}
				}
			}
			supportsStartRe.lastIndex = pos;
		}
	}

	// Remove @supports blocks from CSS for base parsing
	let baseCss = css;
	for (const [start, end] of [...supportsRanges].reverse()) {
		baseCss = baseCss.slice(0, start) + baseCss.slice(end);
	}

	// 2. Parse base CSS by selector blocks to detect light/dark modes
	const baseDeclsByMode = new Map<string, Map<string, string>>();
	const blocks = extractSelectorBlocks(baseCss);

	if (blocks.length > 0) {
		for (const block of blocks) {
			const mode = detectMode(block.selector) ?? "light";
			if (!baseDeclsByMode.has(mode)) baseDeclsByMode.set(mode, new Map());
			const modeMap = baseDeclsByMode.get(mode)!;
			for (const [name, value] of extractDeclarations(block.body)) {
				modeMap.set(name, value);
			}
		}
	} else {
		// No selector blocks — treat all declarations as light mode
		const decls = extractDeclarations(baseCss);
		if (decls.size > 0) {
			baseDeclsByMode.set("light", decls);
		}
	}

	// 3. Merge: P3/@supports values override base only when parseable
	const allModes = new Set([...baseDeclsByMode.keys(), ...p3DeclsByMode.keys()]);
	const mergedByMode = new Map<string, Map<string, string>>();

	for (const mode of allModes) {
		const merged = new Map<string, string>();
		const base = baseDeclsByMode.get(mode);
		const p3 = p3DeclsByMode.get(mode);
		if (base) for (const [k, v] of base) merged.set(k, v);
		if (p3) {
			for (const [k, v] of p3) {
				// Only prefer the P3/@supports value if it can actually be parsed;
				// otherwise keep the base hex value as a usable fallback.
				if (parseColor(v)) {
					merged.set(k, v);
				}
			}
		}
		if (merged.size > 0) mergedByMode.set(mode, merged);
	}

	if (mergedByMode.size === 0) {
		return { ramps: [], errors: [{ message: "No CSS custom properties found", severity: "error" }] };
	}

	// 4. Group declarations into ramps per mode
	const isMultiMode = mergedByMode.size > 1;
	const errors: ParseError[] = [];

	if (!isMultiMode) {
		// Single mode — simple path
		const [, decls] = [...mergedByMode.entries()][0];
		const groups = groupDeclarations(decls);
		const ramps: ParsedRamp[] = [];
		for (const [name, entries] of groups) {
			const steps = entriesToSteps(entries, name, errors);
			if (steps.length > 0) ramps.push({ name, steps });
		}
		return { ramps, errors };
	}

	// Multi-mode — group per mode, then merge into ramps with modes
	const rampsByName = new Map<string, Map<string, RampStep[]>>(); // name → (mode → steps)

	for (const [mode, decls] of mergedByMode) {
		const groups = groupDeclarations(decls);
		for (const [name, entries] of groups) {
			const steps = entriesToSteps(entries, name, errors);
			if (steps.length === 0) continue;
			if (!rampsByName.has(name)) rampsByName.set(name, new Map());
			rampsByName.get(name)!.set(mode, steps);
		}
	}

	const ramps: ParsedRamp[] = [];
	for (const [name, modesMap] of rampsByName) {
		const modes = [...modesMap.entries()].map(([modeName, steps]) => ({
			name: modeName, // lowercase: "light", "dark"
			steps,
		}));
		// Use light mode steps as the primary preview
		const lightSteps = modesMap.get("light") ?? [...modesMap.values()][0];
		ramps.push({ name, steps: lightSteps, modes });
	}

	return { ramps, errors };
}

/** Convert name/value entries to RampStep[], collecting parse errors */
function entriesToSteps(
	entries: [string, string][],
	colorName: string,
	errors: ParseError[],
): RampStep[] {
	const steps: RampStep[] = [];
	for (const [step, value] of entries) {
		const color = parseColor(value);
		if (!color) {
			errors.push({
				message: `Could not parse color "${value}" for --${colorName}-${step}`,
				severity: "warning",
			});
		}
		steps.push({ step, value, color });
	}
	return steps;
}

/**
 * Group CSS declarations into named ramps.
 * Detects Radix (--red-1) and Tailwind (--color-blue-ribbon-50) patterns.
 */
function groupDeclarations(
	declarations: Map<string, string>,
): Map<string, [string, string][]> {
	const groups = new Map<string, [string, string][]>();

	for (const [name, value] of declarations) {
		let colorName: string | null = null;
		let step: string | null = null;

		// Try Tailwind pattern: color-{name}-{step}
		if (name.startsWith("color-")) {
			const withoutPrefix = name.slice(6);
			const match = withoutPrefix.match(/^(.+)-(\d+)$/);
			if (match && TAILWIND_STEPS.has(match[2])) {
				colorName = match[1];
				step = match[2];
			}
		}

		// Try Radix pattern: {name}-{step} (numeric only)
		// Skips alpha variants (a1-a12) and extras (contrast, surface, etc.)
		if (!colorName) {
			const numMatch = name.match(/^(.+)-(\d+)$/);
			if (numMatch) {
				colorName = numMatch[1];
				step = numMatch[2];
			}
		}

		if (colorName && step) {
			if (!groups.has(colorName)) groups.set(colorName, []);
			groups.get(colorName)!.push([step, value]);
		}
	}

	return groups;
}

// ============================================================================
// JSON PARSING
// ============================================================================

function parseJsonRamp(data: any): RampParseResult {
	const errors: ParseError[] = [];
	const ramps: ParsedRamp[] = [];

	if (typeof data !== "object" || data === null) {
		return { ramps: [], errors: [{ message: "Expected a JSON object", severity: "error" }] };
	}

	const firstValue = Object.values(data)[0];
	const isNested =
		typeof firstValue === "object" &&
		firstValue !== null &&
		!Array.isArray(firstValue);

	if (isNested) {
		for (const [name, steps] of Object.entries(data)) {
			if (typeof steps !== "object" || steps === null) continue;
			const rampSteps: RampStep[] = [];
			for (const [step, value] of Object.entries(steps as Record<string, unknown>)) {
				if (typeof value !== "string") continue;
				const color = parseColor(value);
				if (!color) {
					errors.push({
						message: `Could not parse "${value}" for ${name}.${step}`,
						severity: "warning",
					});
				}
				rampSteps.push({ step, value, color });
			}
			if (rampSteps.length > 0) ramps.push({ name, steps: rampSteps });
		}
	} else {
		const declarations = new Map<string, string>();
		for (const [key, value] of Object.entries(data)) {
			if (typeof value === "string") {
				const cleanKey = key.startsWith("--") ? key.slice(2) : key;
				declarations.set(cleanKey, value);
			}
		}
		const groups = groupDeclarations(declarations);
		for (const [name, entries] of groups) {
			const steps = entriesToSteps(entries, name, errors);
			if (steps.length > 0) ramps.push({ name, steps });
		}
	}

	return { ramps, errors };
}

// ============================================================================
// TOKEN CONVERSION
// ============================================================================

let _idCounter = 0;

/**
 * Convert parsed ramps into DesignToken[] for the import pipeline.
 *
 * Single-mode (Tailwind): color/{name}/{step}
 * Multi-mode (Radix light/dark): color/{name}/{mode}/{step}
 *   e.g. color/gray/light/1, color/gray/dark/1
 */
export function rampsToTokens(
	ramps: ParsedRamp[],
	nameOverrides?: Map<string, string>,
): DesignToken[] {
	const tokens: DesignToken[] = [];

	for (const ramp of ramps) {
		const name = nameOverrides?.get(ramp.name) ?? ramp.name;

		if (ramp.modes && ramp.modes.length > 0) {
			// Multi-mode: separate variables per mode
			// color/{name}/{mode}/{step} — e.g. color/gray/light/1, color/gray/dark/a3
			for (const mode of ramp.modes) {
				for (const step of mode.steps) {
					if (!step.color) continue;
					const figmaName = `color/${name}/${mode.name}/${step.step}`;
					tokens.push({
						id: `ramp-${name}-${mode.name}-${step.step}-${++_idCounter}`,
						name: figmaName,
						figmaName,
						type: "color",
						category: "primitives",
						value: step.color,
						originalValue: step.value,
						action: "import",
					});
				}
			}
		} else {
			// Single mode: color/{name}/{step}
			for (const step of ramp.steps) {
				if (!step.color) continue;
				const figmaName = `color/${name}/${step.step}`;
				tokens.push({
					id: `ramp-${name}-${step.step}-${++_idCounter}`,
					name: figmaName,
					figmaName,
					type: "color",
					category: "primitives",
					value: step.color,
					originalValue: step.value,
					action: "import",
				});
			}
		}
	}

	return tokens;
}
