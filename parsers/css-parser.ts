// CSS Custom Property parser for Cipher
// Parses CSS files containing :root { --var-name: value; } declarations
// and converts them to DesignToken[] for the import pipeline.
//
// When CSS is concatenated with /* === filename.css === */ section headers
// (as produced by FileImport), the filename determines the token category
// and enables correct light/dark mode detection for semantic tokens.

import type { DesignToken, TokenCategory, TokenType } from "../types/tokens";
import { parseColor } from "./color-parsers";
import { generateTokenId } from "./token-parsers";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CSSParseResult {
	errors: { line: number; message: string }[];
	/** Whether this looks like a Cipher-exported CSS bundle */
	isCipherExport: boolean;
	stats: { totalDeclarations: number; parsed: number; skipped: number };
	tokens: DesignToken[];
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Known Cipher export file names → category.
 * Only includes files that can round-trip (actual variable values).
 * Computed files (radius.css, typescales.css) are skipped by FileImport. */
const FILE_CATEGORY_MAP: Record<string, TokenCategory> = {
	"primitives.css": "primitives",
	"abstractions.css": "abstractions",
	"semantics.css": "semantics",
	"effects.css": "primitives",
};

/** Fallback: selector-to-category when no file section is active */
const SELECTOR_CATEGORY_MAP: Record<string, TokenCategory> = {
	":root": "primitives",
	".dark": "semantics",
	".light": "primitives",
};

/** Section header pattern: / * === filename.css === * / */
const SECTION_HEADER_RE = /\/\*\s*===\s*(.+?\.css)\s*===\s*\*\//g;

/** Comment pattern: / * category — N variables * / */
const CATEGORY_COMMENT_RE = /\/\*\s*(primitives|abstractions|semantics|effects|typescales|radius)\b/;

/** Regex that finds selector blocks: selector { ... } */
const BLOCK_RE = /([^{}]+)\{([^}]*)\}/g;

/** Regex for a single custom-property declaration */
const DECLARATION_RE = /\s*--([\w-]+)\s*:\s*((?:[^;]|;\s*(?![\s}]))*?)\s*;/g;

/** Regex to detect var() references */
const VAR_REF_RE = /^var\(\s*--([\w-]+)\s*\)$/;

/** Color function/hex patterns */
const COLOR_PATTERNS = /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\()/;

/** color-mix() pattern */
const COLOR_MIX_RE = /^color-mix\(/;

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
 * Build a map of character offset → file section from section headers.
 * Returns an array of { offset, filename } sorted by offset.
 */
function buildSectionMap(
	css: string,
): { filename: string; offset: number }[] {
	const sections: { filename: string; offset: number }[] = [];
	for (const match of css.matchAll(SECTION_HEADER_RE)) {
		sections.push({ offset: match.index, filename: match[1] });
	}
	return sections;
}

/**
 * Find which file section a given offset falls into.
 */
function sectionAtOffset(
	sections: { filename: string; offset: number }[],
	offset: number,
): string | null {
	let current: string | null = null;
	for (const s of sections) {
		if (s.offset <= offset) {
			current = s.filename;
		} else {
			break;
		}
	}
	return current;
}

/**
 * Strip CSS comments from source text, EXCEPT section headers.
 * We need section headers to survive for offset-based section lookup,
 * so we strip all comments first and do section detection on the original.
 */
function stripComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Derive a category from the CSS selector, with optional file-section override.
 */
function categoryFromSelector(
	selector: string,
	fileCategory: TokenCategory | null,
): TokenCategory {
	const trimmed = selector.trim();

	// If we have a file-section category, use it for both :root and .dark
	if (fileCategory) {
		// @theme inline blocks are Tailwind re-exports — skip the selector entirely
		if (trimmed.includes("@theme")) {
			return "__skip__" as TokenCategory;
		}
		return fileCategory;
	}

	// Fallback: direct lookup
	if (SELECTOR_CATEGORY_MAP[trimmed]) {
		return SELECTOR_CATEGORY_MAP[trimmed];
	}

	// data-mode / data-theme attribute selectors
	const attrMatch = trimmed.match(/\[data-(?:mode|theme)=["']([^"']+)["']\]/);
	if (attrMatch) {
		return attrMatch[1] as TokenCategory;
	}

	// Class-based selectors
	const classMatch = trimmed.match(/^\.([\w-]+)$/);
	if (classMatch) {
		return classMatch[1] as TokenCategory;
	}

	return "other";
}

/**
 * Detect the mode name (Light/Dark) from selector context when in semantics.
 */
function modeFromSelector(
	selector: string,
	fileCategory: TokenCategory | null,
): string | undefined {
	if (fileCategory !== "semantics") return undefined;
	const trimmed = selector.trim();
	if (trimmed === ".dark" || trimmed.includes("dark")) return "Dark";
	if (trimmed === ":root" || trimmed.includes("light")) return "Light";
	return undefined;
}

/**
 * Infer the token type from the CSS value string and the variable name.
 */
function inferType(name: string, value: string): TokenType {
	if (VAR_REF_RE.test(value)) {
		return "reference";
	}

	if (COLOR_PATTERNS.test(value) || COLOR_MIX_RE.test(value)) {
		return "color";
	}

	const lowerName = name.toLowerCase();

	// Font family detection (CSS font stacks)
	if (lowerName.includes("font-family") || lowerName.includes("font-stack")) {
		return "fontFamily";
	}

	for (const hint of COLOR_NAME_HINTS) {
		if (lowerName.startsWith(hint) || lowerName.includes(`-${hint}`)) {
			if (parseColor(value)) {
				return "color";
			}
		}
	}

	if (NUMERIC_RE.test(value)) {
		return "number";
	}

	if (/^-?[0-9]*\.?[0-9]+$/.test(value)) {
		return "number";
	}

	return "string";
}

/**
 * Convert a CSS variable name (without `--`) to a Figma slash-separated path.
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
	const refName = match[1];
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
		// color-mix and other complex values — keep as string
		if (COLOR_MIX_RE.test(value)) {
			return { parsed: value };
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

	return { parsed: value };
}

/**
 * Compute approximate line number for a declaration.
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
 *
 * When the input contains `/ * === filename.css === * /` section headers
 * (produced by FileImport when concatenating multiple files), the filename
 * is used to determine each token's category. For semantics.css, `:root`
 * maps to Light mode and `.dark` maps to Dark mode.
 */
export function parseCSS(cssText: string): CSSParseResult {
	const tokens: DesignToken[] = [];
	const errors: { line: number; message: string }[] = [];
	let totalDeclarations = 0;
	let parsed = 0;
	let skipped = 0;
	let tokenIndex = 0;

	// Build section map from original text (before stripping comments)
	const sections = buildSectionMap(cssText);
	const isCipherExport =
		sections.length > 0 &&
		sections.some((s) => FILE_CATEGORY_MAP[s.filename] !== undefined);

	// Also detect via category comment pattern (single-file case)
	const hasCategoryComment = CATEGORY_COMMENT_RE.test(cssText);

	// Strip comments for parsing
	const stripped = stripComments(cssText);

	// Find all selector blocks
	for (const blockMatch of stripped.matchAll(BLOCK_RE)) {
		const selector = blockMatch[1];
		const blockBody = blockMatch[2];
		const blockStartOffset = blockMatch.index + blockMatch[1].length + 1;

		// Determine file section for this block
		const sectionFile = sectionAtOffset(sections, blockMatch.index);
		const fileCategory = sectionFile
			? FILE_CATEGORY_MAP[sectionFile] ?? null
			: null;

		const category = categoryFromSelector(selector, fileCategory);

		// Skip @theme inline blocks
		if (category === ("__skip__" as TokenCategory)) continue;

		// Detect mode for semantic tokens
		const modeName = modeFromSelector(selector, fileCategory);

		// Extract declarations from the block
		for (const declMatch of blockBody.matchAll(DECLARATION_RE)) {
			totalDeclarations++;

			const varName = declMatch[1];
			const rawValue = declMatch[2].trim();
			const declOffset = blockStartOffset + declMatch.index;
			const line = lineNumberAt(stripped, declOffset);

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

			// Font-family tokens contain CSS font stacks that trigger Figma
			// font-loading errors — auto-skip them on import
			const action = type === "fontFamily" ? "skip" : "import";

			tokens.push({
				id: generateTokenId(varName, tokenIndex++),
				name: varName,
				figmaName,
				value: parsedValue as any,
				originalValue: rawValue,
				type,
				category,
				action,
				// Put modeName at top level (import handler reads token.modeName)
				...(modeName ? { modeName } : {}),
			} as any);

			parsed++;
		}
	}

	// Deduplicate tokens with the same category + figmaName + modeName.
	// This handles two cases:
	// 1. Responsive CSS files (typescales.css) that repeat the same variables
	//    in multiple @media / [data-window-size] blocks — keep the base :root value
	// 2. Semantic tokens keep both Light and Dark (different modeName = different key)
	const seen = new Set<string>();
	const deduped: DesignToken[] = [];
	for (const token of tokens) {
		const mode = (token as any).modeName || "__default__";
		const key = `${token.category}::${token.figmaName}::${mode}`;
		if (!seen.has(key)) {
			seen.add(key);
			deduped.push(token);
		}
	}

	return {
		tokens: deduped,
		errors,
		isCipherExport: isCipherExport || hasCategoryComment,
		stats: { totalDeclarations, parsed, skipped },
	};
}
