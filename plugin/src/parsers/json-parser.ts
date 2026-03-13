import type {
	ColorValue,
	DesignToken,
	ParsedTokens,
	ParseError,
} from "../types/tokens";

/**
 * Parse a hex color string to RGB values (0-1)
 */
export function parseHexColor(hex: string): ColorValue | null {
	// Remove # if present
	hex = hex.replace("#", "");

	// Handle shorthand hex (e.g., #fff)
	if (hex.length === 3) {
		hex = hex
			.split("")
			.map((char) => char + char)
			.join("");
	}

	// Parse hex to RGB
	if (hex.length === 6) {
		const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
		const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
		const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
		return { r, g, b };
	}

	// Handle 8-digit hex with alpha
	if (hex.length === 8) {
		const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
		const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
		const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
		const a = Number.parseInt(hex.slice(6, 8), 16) / 255;
		return { r, g, b, a };
	}

	return null;
}

/**
 * Parse RGB/RGBA color string to ColorValue
 */
export function parseRGBColor(rgb: string): ColorValue | null {
	const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
	if (match) {
		return {
			r: Number.parseInt(match[1], 10) / 255,
			g: Number.parseInt(match[2], 10) / 255,
			b: Number.parseInt(match[3], 10) / 255,
			a: match[4] ? Number.parseFloat(match[4]) : undefined,
		};
	}
	return null;
}

/**
 * Parse any color format to ColorValue
 */
export function parseColor(color: string): ColorValue | null {
	color = color.trim();

	if (color.startsWith("#")) {
		return parseHexColor(color);
	}

	if (color.startsWith("rgb")) {
		return parseRGBColor(color);
	}

	return null;
}

/**
 * Generate a unique ID for a token
 */
function generateTokenId(name: string, index: number): string {
	return `token-${name.replace(/[^a-zA-Z0-9]/g, "-")}-${index}`;
}

/**
 * Transform token name to Figma-friendly format
 * e.g., "primary-blue" -> "color/primary/blue"
 */
function _transformTokenName(name: string, category: string): string {
	// Remove common prefixes
	name = name.replace(/^(color|clr|bg|text|border)-/, "");

	// Convert kebab-case or snake_case to path
	const parts = name.split(/[-_]/);

	return `${category}/${parts.join("/")}`;
}

/**
 * Parse any value based on type - generic and extensible
 */
function parseTokenValue(
	value: string | number,
	type: string,
): { parsed: any; error?: string } {
	// Handle colors
	if (type === "color") {
		const colorValue = parseColor(String(value));
		if (colorValue) {
			return { parsed: colorValue };
		}
		return { parsed: null, error: `Invalid color format: ${value}` };
	}

	// Handle numeric types (spacing, sizing, borderRadius, borderWidth, etc.)
	if (
		type === "spacing" ||
		type === "sizing" ||
		type === "borderRadius" ||
		type === "borderWidth" ||
		type === "number" ||
		type === "dimension"
	) {
		const numValue =
			typeof value === "number" ? value : Number.parseFloat(String(value));
		if (!Number.isNaN(numValue)) {
			return { parsed: numValue };
		}
		return { parsed: null, error: `Invalid numeric value: ${value}` };
	}

	// Handle string types (fontFamily, fontWeight, etc.)
	if (
		type === "string" ||
		type === "fontFamily" ||
		type === "fontWeight" ||
		type === "text"
	) {
		return { parsed: String(value) };
	}

	// Fallback: try to infer the type
	// If it looks like a color, parse it as color
	if (
		typeof value === "string" &&
		(value.startsWith("#") || value.startsWith("rgb"))
	) {
		const colorValue = parseColor(value);
		if (colorValue) {
			return { parsed: colorValue };
		}
	}

	// If it's a number or can be parsed as number, return numeric
	const numValue =
		typeof value === "number" ? value : Number.parseFloat(String(value));
	if (!Number.isNaN(numValue)) {
		return { parsed: numValue };
	}

	// Default: return as string
	return { parsed: String(value) };
}

/**
 * Recursively parse token object structure - completely dynamic
 */
function parseTokenObject(
	obj: any,
	path: string[] = [],
	tokens: DesignToken[] = [],
	errors: ParseError[] = [],
	tokenIndex = 0,
): number {
	for (const [key, value] of Object.entries(obj)) {
		// Skip metadata keys
		if (key.startsWith("$")) continue;

		if (value && typeof value === "object") {
			// Check if this is a token (has 'value' and 'type' properties)
			if ("value" in value && "type" in value) {
				const tokenData = value as {
					value: string | number;
					type: string;
					description?: string;
				};
				const tokenPath = [...path, key].join("/");
				const category = path[0] || "tokens";

				// Parse the value
				const { parsed, error } = parseTokenValue(
					tokenData.value,
					tokenData.type,
				);

				if (error) {
					errors.push({
						token: tokenPath,
						message: error,
						severity: "error",
					});
				} else if (parsed !== null) {
					tokens.push({
						id: generateTokenId(tokenPath, tokenIndex++),
						name: key,
						figmaName: tokenPath,
						value: parsed,
						originalValue: String(tokenData.value),
						type: tokenData.type as any,
						category: category as any,
						action: "import",
					});
				}
			} else {
				// This is a nested group, recurse
				tokenIndex = parseTokenObject(
					value,
					[...path, key],
					tokens,
					errors,
					tokenIndex,
				);
			}
		} else {
			// Legacy format: simple key-value pairs (e.g., { "primary": "#3B82F6" })
			// Try to infer type from the parent key
			const category = path[0] || "tokens";
			const tokenPath = [...path, key].join("/");

			let inferredType = "string";
			if (category === "colors" || path.includes("colors")) {
				inferredType = "color";
			} else if (category === "spacing" || path.includes("spacing")) {
				inferredType = "spacing";
			} else if (category === "radius" || path.includes("radius")) {
				inferredType = "borderRadius";
			} else if (category === "sizes" || path.includes("sizes")) {
				inferredType = "sizing";
			}

			const { parsed, error } = parseTokenValue(
				typeof value === "string" || typeof value === "number"
					? value
					: String(value),
				inferredType,
			);

			if (error) {
				errors.push({
					token: tokenPath,
					message: error,
					severity: "warning", // Warning since it's inferred
				});
			} else if (parsed !== null) {
				tokens.push({
					id: generateTokenId(tokenPath, tokenIndex++),
					name: key,
					figmaName: tokenPath,
					value: parsed,
					originalValue: String(value),
					type: inferredType as any,
					category: category as any,
					action: "import",
				});
			}
		}
	}

	return tokenIndex;
}

/**
 * Parse simple JSON token format (MVP) - now completely dynamic
 */
export function parseSimpleJSON(content: string): ParsedTokens {
	const tokens: DesignToken[] = [];
	const errors: ParseError[] = [];

	try {
		const data = JSON.parse(content);

		// Check if this is a structured format with tokens key
		const tokensData = data.tokens || data;

		// Recursively parse the entire structure
		parseTokenObject(tokensData, [], tokens, errors, 0);

		// Calculate stats
		const stats = {
			total: tokens.length,
			byCategory: tokens.reduce(
				(acc, token) => {
					acc[token.category] = (acc[token.category] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			),
			conflicts: 0,
			errors: errors.length,
		};

		return { tokens, stats, errors };
	} catch (error) {
		errors.push({
			message: `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
			severity: "error",
		});

		return {
			tokens: [],
			stats: {
				total: 0,
				byCategory: {},
				conflicts: 0,
				errors: errors.length,
			},
			errors,
		};
	}
}

/**
 * Main parser function - detects format and parses accordingly
 */
export function parseTokenFile(
	content: string,
	format: "json" | "css" = "json",
): ParsedTokens {
	if (format === "json") {
		return parseSimpleJSON(content);
	}

	// CSS parsing will be implemented later
	return {
		tokens: [],
		stats: { total: 0, byCategory: {}, conflicts: 0, errors: 1 },
		errors: [{ message: "CSS parsing not yet implemented", severity: "error" }],
	};
}
