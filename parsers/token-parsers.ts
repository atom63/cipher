// Token parsing utilities
// Handles parsing of design tokens from JSON format

import type {
	ColorValue,
	DesignToken,
	ParsedTokens,
	ParseError,
} from "../libraries/shared-types";
import { parseColor, parseOKLCHColor } from "./color-parsers";

// Generate unique token ID
export function generateTokenId(name: string, index: number): string {
	return `token-${name.replace(/[^a-zA-Z0-9]/g, "-")}-${index}`;
}

// Transform token name for Figma
export function transformTokenName(name: string, category: string): string {
	name = name.replace(/^(color|clr|bg|text|border)-/, "");
	const parts = name.split(/[-_]/);
	return `${category}/${parts.join("/")}`;
}

// Parse any value based on type - generic and extensible
export function parseTokenValueGeneric(
	value: string | number | boolean,
	type: string,
): { parsed: any; error?: string } {
	// Handle "unknown" type by inferring from value
	if (type === "unknown") {
		// Try to infer the type from the value
		if (typeof value === "boolean" || value === "true" || value === "false") {
			type = "boolean";
		} else if (
			typeof value === "string" &&
			(value.startsWith("#") ||
				value.startsWith("rgb") ||
				value.startsWith("oklch("))
		) {
			type = "color";
		} else if (
			typeof value === "number" ||
			!Number.isNaN(Number.parseFloat(String(value)))
		) {
			type = "number";
		} else {
			type = "string";
		}
	}

	// Handle colors
	if (type === "color") {
		let colorValue: ColorValue | null = null;
		if (typeof value === "string") {
			if (value.startsWith("oklch(")) {
				colorValue = parseOKLCHColor(value);
			} else if (value.startsWith("#")) {
				colorValue = parseColor(value);
			} else if (value.startsWith("rgb")) {
				colorValue = parseColor(value);
			} else if (value.startsWith("hsl")) {
				colorValue = parseColor(value);
			} else {
				// Try parseColor as a fallback
				colorValue = parseColor(value);
			}
		}
		if (colorValue) {
			return { parsed: colorValue };
		}
		return {
			parsed: null,
			error: `Invalid color format: ${value}. Supported formats: OKLCH, HEX, RGB, RGBA, HSL, HSLA`,
		};
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

	// Handle boolean types
	if (type === "boolean") {
		// Parse string values like "true" or "false"
		if (typeof value === "string") {
			const lowerValue = value.toLowerCase();
			if (lowerValue === "true") return { parsed: true };
			if (lowerValue === "false") return { parsed: false };
		}
		// Handle actual boolean values
		if (typeof value === "boolean") {
			return { parsed: value };
		}
		// Handle numeric 0/1 as boolean
		if (typeof value === "number") {
			return { parsed: value !== 0 };
		}
		return { parsed: null, error: `Invalid boolean value: ${value}` };
	}

	// Fallback: try to infer the type
	// If it looks like a color, parse it as color
	if (
		typeof value === "string" &&
		(value.startsWith("#") ||
			value.startsWith("rgb") ||
			value.startsWith("oklch("))
	) {
		let colorValue: ColorValue | null = null;
		if (value.startsWith("oklch(")) {
			colorValue = parseOKLCHColor(value);
		} else {
			colorValue = parseColor(value);
		}
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

// Recursively parse token object structure - completely dynamic
export function parseTokenObjectDynamic(
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
				const { parsed, error } = parseTokenValueGeneric(
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
						type: tokenData.type,
						category,
						description: tokenData.description,
						action: "import",
					});
				}
			} else {
				// This is a nested group, recurse
				tokenIndex = parseTokenObjectDynamic(
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
			} else if (
				typeof value === "boolean" ||
				value === "true" ||
				value === "false"
			) {
				// Infer boolean from value
				inferredType = "boolean";
			} else if (
				key.toLowerCase().startsWith("is") ||
				key.toLowerCase().startsWith("has") ||
				key.toLowerCase().startsWith("enable") ||
				key.toLowerCase().startsWith("show")
			) {
				// Infer boolean from key name patterns
				inferredType = "boolean";
			}

			const { parsed, error } = parseTokenValueGeneric(
				typeof value === "string" ||
					typeof value === "number" ||
					typeof value === "boolean"
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
					type: inferredType,
					category,
					action: "import",
				});
			}
		}
	}

	return tokenIndex;
}

// Recursively parse token groups - handles nested token structures
export function parseTokenGroup(
	obj: any,
	collectionName: string,
	path: string[],
	tokens: DesignToken[],
	errors: ParseError[],
	tokenIndex: number,
) {
	for (const [key, value] of Object.entries(obj)) {
		if (value && typeof value === "object") {
			// Check if this is a token (has 'value' or 'modes' property)
			if ("value" in value || "modes" in value) {
				// This is a token - build the full path
				const tokenPath = [...path, key].join("/");
				const fullName = tokenPath;

				// Handle modes
				if ("modes" in value && value.modes) {
					// Parse all modes and store them
					const tokenData = value as any;
					const modes = value.modes as Record<string, string>;
					for (const [modeName, tokenValue] of Object.entries(modes)) {
						parseTokenValue(
							fullName,
							tokenPath,
							tokenValue,
							tokenData.type || "color",
							collectionName,
							tokens,
							errors,
							tokenIndex++,
							modeName,
							tokenData.description,
						);
					}
				} else if ("value" in value) {
					const tokenData = value as any;
					parseTokenValue(
						fullName,
						tokenPath,
						tokenData.value,
						tokenData.type || "color",
						collectionName,
						tokens,
						errors,
						tokenIndex++,
						undefined,
						tokenData.description,
					);
				}
			} else {
				// This is a nested group (no 'value' or 'modes'), recurse deeper
				parseTokenGroup(
					value,
					collectionName,
					[...path, key],
					tokens,
					errors,
					tokenIndex,
				);
			}
		}
	}
}

// Parse a single token value
export function parseTokenValue(
	fullName: string,
	tokenPath: string,
	value: string | boolean,
	type: string,
	category: string,
	tokens: DesignToken[],
	errors: ParseError[],
	index: number,
	modeName?: string,
	description?: string,
) {
	// Check if value is a reference
	if (
		typeof value === "string" &&
		value.startsWith("{") &&
		value.endsWith("}")
	) {
		// This is a reference, store it as-is for now
		tokens.push({
			id: generateTokenId(fullName, index),
			name: tokenPath,
			figmaName: fullName,
			value: value,
			originalValue: value,
			type: "reference",
			category,
			description,
			action: "import",
			modeName,
		} as any);
		return;
	}

	// Infer boolean type from token name if type is unknown
	let inferredType = type;
	if (type === "unknown") {
		const nameLower = fullName.toLowerCase();
		const tokenNameLower = tokenPath.toLowerCase();
		if (
			nameLower.includes("is") ||
			nameLower.includes("has") ||
			nameLower.includes("enable") ||
			nameLower.includes("show") ||
			tokenNameLower.startsWith("is") ||
			tokenNameLower.startsWith("has") ||
			tokenNameLower.startsWith("enable") ||
			tokenNameLower.startsWith("show")
		) {
			inferredType = "boolean";
		}
	}

	// Use the dynamic parser for all other values
	const { parsed, error } = parseTokenValueGeneric(value, inferredType);

	if (error) {
		errors.push({
			token: fullName,
			message: error,
			severity: "error",
		});
	} else if (parsed !== null) {
		tokens.push({
			id: generateTokenId(fullName, index),
			name: tokenPath,
			figmaName: fullName,
			value: parsed,
			originalValue: String(value),
			type: inferredType,
			category,
			description,
			action: "import",
			modeName,
		} as any);
	}
}

// Parse collection-based JSON format
export function parseCollectionJSON(
	data: any,
	startIndex: number,
): ParsedTokens {
	const tokens: DesignToken[] = [];
	const errors: ParseError[] = [];
	const tokenIndex = startIndex;

	const tokensData = data.tokens || {};

	// Parse each collection
	for (const [collectionKey, collectionTokens] of Object.entries(tokensData)) {
		parseTokenGroup(
			collectionTokens,
			collectionKey,
			[],
			tokens,
			errors,
			tokenIndex,
		);
	}

	const stats = {
		total: tokens.length,
		byCategory: tokens.reduce((acc: Record<string, number>, token) => {
			acc[token.category] = (acc[token.category] || 0) + 1;
			return acc;
		}, {}),
		conflicts: 0,
		errors: errors.length,
	};

	return { tokens, stats, errors };
}

// Parse tokens from JSON (supports both simple and collection formats)
export function parseJSON(content: string): ParsedTokens {
	const tokens: DesignToken[] = [];
	const errors: ParseError[] = [];

	try {
		const data = JSON.parse(content);

		// Check if this is the new collection format
		if (data.$collections && data.tokens) {
			return parseCollectionJSON(data, 0);
		}

		// Check if this is a structured format with tokens key
		const tokensData = data.tokens || data;

		// Recursively parse the entire structure - now completely dynamic
		parseTokenObjectDynamic(tokensData, [], tokens, errors, 0);

		const stats = {
			total: tokens.length,
			byCategory: tokens.reduce((acc: Record<string, number>, token) => {
				acc[token.category] = (acc[token.category] || 0) + 1;
				return acc;
			}, {}),
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
			stats: { total: 0, byCategory: {}, conflicts: 0, errors: errors.length },
			errors,
		};
	}
}
