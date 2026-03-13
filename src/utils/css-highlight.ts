/**
 * Lightweight CSS syntax tokenizer for design token preview.
 * Returns an array of { type, text } tokens for rendering with spans.
 */

export type TokenType =
	| "comment"
	| "selector"
	| "property"
	| "value"
	| "punctuation"
	| "atrule"
	| "function"
	| "string"
	| "plain";

export interface Token {
	text: string;
	type: TokenType;
}

/**
 * Tokenize a CSS string into highlighted segments.
 * Handles comments, at-rules, selectors, properties, values, and functions.
 */
export function tokenizeCSS(css: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	const len = css.length;

	// Context: are we inside a declaration block?
	let inBlock = false;
	// Are we after a colon (reading a value)?
	let afterColon = false;

	while (i < len) {
		// --- Block comments ---
		if (css[i] === "/" && css[i + 1] === "*") {
			const end = css.indexOf("*/", i + 2);
			const closeAt = end === -1 ? len : end + 2;
			tokens.push({ text: css.slice(i, closeAt), type: "comment" });
			i = closeAt;
			continue;
		}

		// --- Whitespace ---
		if (/\s/.test(css[i])) {
			let j = i + 1;
			while (j < len && /\s/.test(css[j])) j++;
			tokens.push({ text: css.slice(i, j), type: "plain" });
			i = j;
			continue;
		}

		// --- Punctuation: { } ; : ---
		if (css[i] === "{") {
			tokens.push({ text: "{", type: "punctuation" });
			inBlock = true;
			afterColon = false;
			i++;
			continue;
		}

		if (css[i] === "}") {
			tokens.push({ text: "}", type: "punctuation" });
			inBlock = false;
			afterColon = false;
			i++;
			continue;
		}

		if (css[i] === ";") {
			tokens.push({ text: ";", type: "punctuation" });
			afterColon = false;
			i++;
			continue;
		}

		if (css[i] === ":" && inBlock && !afterColon) {
			tokens.push({ text: ":", type: "punctuation" });
			afterColon = true;
			i++;
			continue;
		}

		// --- At-rules (@theme, @media, etc.) ---
		if (css[i] === "@") {
			let j = i + 1;
			while (j < len && /[\w-]/.test(css[j])) j++;
			// Include the keyword after @, then any following text up to { or ;
			const _keyword = css.slice(i, j);
			// Grab rest of at-rule params (e.g. "inline" after "@theme")
			while (j < len && css[j] !== "{" && css[j] !== ";") j++;
			tokens.push({ text: css.slice(i, j), type: "atrule" });
			i = j;
			continue;
		}

		// --- Strings (quoted) ---
		if (css[i] === '"' || css[i] === "'") {
			const quote = css[i];
			let j = i + 1;
			while (j < len && css[j] !== quote) {
				if (css[j] === "\\") j++; // skip escaped
				j++;
			}
			if (j < len) j++; // closing quote
			tokens.push({ text: css.slice(i, j), type: "string" });
			i = j;
			continue;
		}

		// --- Inside block: property or value ---
		if (inBlock) {
			if (!afterColon) {
				// Property name (e.g. --color-brand-500, font-size)
				let j = i;
				while (j < len && css[j] !== ":" && css[j] !== "}" && css[j] !== ";") j++;
				const text = css.slice(i, j);
				if (text.trim()) {
					tokens.push({ text, type: "property" });
				}
				i = j;
				continue;
			}

			// Value: read until ; or }
			// Handle functions like var(), color-mix(), oklch()
			let j = i;
			while (j < len && css[j] !== ";" && css[j] !== "}") {
				if (css[j] === "/" && css[j + 1] === "*") break; // comment starts
				j++;
			}
			const valueText = css.slice(i, j);
			if (valueText.trim()) {
				tokenizeValue(valueText, tokens);
			}
			i = j;
			continue;
		}

		// --- Outside block: selector ---
		{
			let j = i;
			while (j < len && css[j] !== "{" && css[j] !== "}" && !(css[j] === "/" && css[j + 1] === "*")) {
				j++;
			}
			const text = css.slice(i, j);
			if (text.trim()) {
				tokens.push({ text, type: "selector" });
			}
			i = j;
		}
	}

	return tokens;
}

/**
 * Tokenize a CSS value, extracting function calls like var(), color-mix(), oklch().
 */
function tokenizeValue(value: string, tokens: Token[]): void {
	const funcRegex = /([\w-]+)\(/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = funcRegex.exec(value)) !== null) {
		// Text before function
		if (match.index > lastIndex) {
			tokens.push({ text: value.slice(lastIndex, match.index), type: "value" });
		}

		// Function name + opening paren
		tokens.push({ text: `${match[1]}(`, type: "function" });

		// Find matching closing paren
		let depth = 1;
		let j = funcRegex.lastIndex;
		while (j < value.length && depth > 0) {
			if (value[j] === "(") depth++;
			else if (value[j] === ")") depth--;
			if (depth > 0) j++;
		}

		// Inner content (recursive)
		const inner = value.slice(funcRegex.lastIndex, j);
		if (inner) {
			tokenizeValue(inner, tokens);
		}

		// Closing paren
		if (j < value.length && value[j] === ")") {
			tokens.push({ text: ")", type: "function" });
			j++;
		}

		lastIndex = j;
		funcRegex.lastIndex = j;
	}

	// Remaining text after last function
	if (lastIndex < value.length) {
		tokens.push({ text: value.slice(lastIndex), type: "value" });
	}
}
