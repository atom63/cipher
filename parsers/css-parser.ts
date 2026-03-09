// CSS Custom Property parser for Cipher
// Parses CSS files containing :root { --var-name: value; } declarations
// and converts them to DesignToken[] for the import pipeline.

import type { DesignToken, TokenCategory, TokenType } from "../types/tokens";
import { parseColor } from "./color-parsers";
import { generateTokenId } from "./token-parsers";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CSSParseResult {
	errors: { line: number; message: string }[];
	stats: { totalDeclarations: number; parsed: number; skipped: number };
	tokens: DesignToken[];
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Selector-to-category mapping */
const SELECTOR_CATEGORY_MAP: Record<string, TokenCategory> = {
	":root": "primitives",
	".dark": "semantics",
	".light": "primitives",
};

/** Regex that finds selector blocks: selector { ... } */
const BLOCK_RE = /([^{}]+)\{([^}]*)\}/g;

/** Regex for a single custom-property declaration */
const DECLARATION_RE = /\s*--([\w-]+)\s*:\s*((?:[^;]|;\s*(?![\s}]))*?)\s*;/g;

/** Regex to detect var() references */
const VAR_REF_RE = /^var\(\s*--([\w-]+)\s*\)$/;

/** Color function/hex patterns */
const COLOR_PATTERNS = /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\()/;

/** Numeric value with optional unit */
const NUMERIC_RE =
	/^-?[0-9]*\.?[0-9]+(px|rem|em|%|vw|vh|vmin|vmax|ch|ex|pt|pc|in|cm|mm|deg|rad|turn|s|ms)?$/;

/** Name segments that strongly suggest a color token */
const COLOR_NAME_HINTS = [
	"color",
	"bg",
	"background",
	"fill",
	"stroke",
	"border-color",
	"shadow",
	"text-color",
	"accent",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip CSS comments (both block and single-line) from source text.
 */
function stripComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Derive a category from the CSS selector.
 * For `[data-mode="dark"]` style selectors the mode name is used.
 */
function categoryFromSelector(selector: string): TokenCategory {
	const trimmed = selector.trim();

	// Direct lookup
	if (SELECTOR_CATEGORY_MAP[trimmed]) {
		return SELECTOR_CATEGORY_MAP[trimmed];
	}

	// data-mode / data-theme attribute selectors
	const attrMatch = trimmed.match(/\[data-(?:mode|theme)=["']([^"']+)["']\]/);
	if (attrMatch) {
		return attrMatch[1] as TokenCategory; // e.g. "dark", "high-contrast"
	}

	// Class-based selectors (.dark-mode, .theme-light, etc.)
	const classMatch = trimmed.match(/^\.([\w-]+)$/);
	if (classMatch) {
		return classMatch[1] as TokenCategory;
	}

	return "other";
}

/**
 * Infer the token type from the CSS value string and the variable name.
 */
function inferType(name: string, value: string): TokenType {
	// References
	if (VAR_REF_RE.test(value)) {
		return "reference";
	}

	// Color values (by value)
	if (COLOR_PATTERNS.test(value)) {
		return "color";
	}

	// Color values (by name hint)
	const lowerName = name.toLowerCase();
	for (const hint of COLOR_NAME_HINTS) {
		if (lowerName.startsWith(hint) || lowerName.includes(`-${hint}`)) {
			// Only mark as color if parseColor can handle it
			if (parseColor(value)) {
				return "color";
			}
		}
	}

	// Numeric values
	if (NUMERIC_RE.test(value)) {
		return "number";
	}

	// Plain number
	if (/^-?[0-9]*\.?[0-9]+$/.test(value)) {
		return "number";
	}

	return "string";
}

/**
 * Convert a CSS variable name (without `--`) to a Figma slash-separated path.
 * e.g. "color-primary-500" -> "color/primary/500"
 */
function toFigmaName(name: string): string {
	return name.replace(/-/g, "/");
}

/**
 * Convert a var(--ref) value to the `{category.path}` reference format.
 */
function convertVarReference(value: string): string {
	const match = value.match(VAR_REF_RE);
	if (!match) return value;
	const refName = match[1]; // e.g. "color-primary-500"
	return `{${refName.replace(/-/g, ".")}}`;
}

/**
 * Parse the raw CSS value into a TokenValue.
 */
function parseValue(
	value: string,
	type: TokenType,
): { parsed: string | number | ReturnType<typeof parseColor>; error?: string } {
	if (type === "reference") {
		return { parsed: convertVarReference(value) };
	}

	if (type === "color") {
		const colorValue = parseColor(value);
		if (colorValue) {
			return { parsed: colorValue };
		}
		return { parsed: value, error: `Could not parse color value: ${value}` };
	}

	if (type === "number") {
		const num = Number.parseFloat(value);
		if (!Number.isNaN(num)) {
			return { parsed: num };
		}
		return { parsed: value };
	}

	// String / fallback
	return { parsed: value };
}

/**
 * Compute approximate line number for a declaration within the original
 * (pre-stripped) CSS text by counting preceding newlines up to the match
 * offset in the stripped text.
 */
function lineNumberAt(text: string, offset: number): number {
	let count = 1;
	for (let i = 0; i < offset && i < text.length; i++) {
		if (text[i] === "\n") count++;
	}
	return count;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse CSS text containing custom property declarations and return
 * DesignToken[] compatible with the Cipher import pipeline.
 */
export function parseCSS(cssText: string): CSSParseResult {
	const tokens: DesignToken[] = [];
	const errors: { line: number; message: string }[] = [];
	let totalDeclarations = 0;
	let parsed = 0;
	let skipped = 0;
	let tokenIndex = 0;

	// Strip comments but keep the same character positions for line counting
	const stripped = stripComments(cssText);

	// Find all selector blocks
	for (const blockMatch of stripped.matchAll(BLOCK_RE)) {
		const selector = blockMatch[1];
		const blockBody = blockMatch[2];
		const blockStartOffset = blockMatch.index + blockMatch[1].length + 1; // offset of '{'

		const category = categoryFromSelector(selector);

		// Extract declarations from the block
		for (const declMatch of blockBody.matchAll(DECLARATION_RE)) {
			totalDeclarations++;

			const varName = declMatch[1]; // without --
			const rawValue = declMatch[2].trim();
			const declOffset = blockStartOffset + declMatch.index;
			const line = lineNumberAt(stripped, declOffset);

			// Skip empty values
			if (!rawValue) {
				skipped++;
				errors.push({ line, message: `Empty value for --${varName}` });
				continue;
			}

			const type = inferType(varName, rawValue);
			const { parsed: parsedValue, error } = parseValue(rawValue, type);

			if (error) {
				errors.push({ line, message: error });
			}

			const figmaName = toFigmaName(varName);

			tokens.push({
				id: generateTokenId(varName, tokenIndex++),
				name: varName,
				figmaName,
				value: parsedValue as any,
				originalValue: rawValue,
				type,
				category,
				action: "import",
			});

			parsed++;
		}
	}

	return {
		tokens,
		errors,
		stats: { totalDeclarations, parsed, skipped },
	};
}
