// Pre-flight validation for import tokens
// Pure functions - no Figma API dependency, fully testable

import type { DesignToken } from "../types/tokens";

export interface ValidationIssue {
	tokenId: string;
	tokenName: string;
	severity: "error" | "warning";
	type:
		| "circular-ref"
		| "broken-ref"
		| "type-mismatch"
		| "duplicate-name"
		| "self-ref";
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	issues: ValidationIssue[];
	stats: {
		errors: number;
		warnings: number;
		circularRefs: number;
		brokenRefs: number;
		typeMismatches: number;
		duplicateNames: number;
	};
}

/**
 * Parse a reference string like "{primitives.zinc.50}" and return
 * { collection: "primitives", path: "zinc/50", full: "primitives/zinc/50" }
 */
function parseRef(ref: string): {
	collection: string;
	path: string;
	full: string;
} | null {
	const match = ref.match(/\{([^}]+)\}/);
	if (!match) return null;
	const parts = match[1].split(".");
	const collection = parts[0];
	const path = parts.slice(1).join("/");
	return { collection, path, full: match[1].replace(/\./g, "/") };
}

/**
 * Build lookup maps for token resolution.
 * Keys: "collection:figmaName" and plain "figmaName" for fallback.
 */
function buildTokenMap(tokens: DesignToken[]): Map<string, DesignToken[]> {
	const map = new Map<string, DesignToken[]>();

	const addToMap = (key: string, token: DesignToken) => {
		const existing = map.get(key);
		if (existing) {
			existing.push(token);
		} else {
			map.set(key, [token]);
		}
	};

	for (const token of tokens) {
		if (token.action === "skip") continue;
		// Store by composite key: "category:figmaName"
		addToMap(`${token.category}:${token.figmaName}`, token);
		// Store by plain figmaName for fallback
		addToMap(token.figmaName, token);
	}
	return map;
}

/**
 * Look up a token by reference, matching how the import handler resolves references
 */
function lookupRef(
	ref: string,
	tokenMap: Map<string, DesignToken[]>,
): DesignToken[] | null {
	const parsed = parseRef(ref);
	if (!parsed) return null;

	// Try composite key first: "collection:path"
	const compositeKey = `${parsed.collection}:${parsed.path}`;
	const byComposite = tokenMap.get(compositeKey);
	if (byComposite && byComposite.length > 0) return byComposite;

	// Fallback: try full path as figmaName
	const byFull = tokenMap.get(parsed.full);
	if (byFull && byFull.length > 0) return byFull;

	// Fallback: try just the path portion
	const byPath = tokenMap.get(parsed.path);
	if (byPath && byPath.length > 0) return byPath;

	return null;
}

/**
 * Get a unique identity for a token for cycle detection
 */
function tokenKey(token: DesignToken): string {
	return `${token.category}:${token.figmaName}`;
}

/**
 * Detect circular references by following reference chains
 */
function detectCircularRef(
	token: DesignToken,
	tokenMap: Map<string, DesignToken[]>,
	visited: Set<string>,
): boolean {
	if (token.type !== "reference") return false;

	const key = tokenKey(token);
	if (visited.has(key)) return true; // cycle found
	visited.add(key);

	const targets = lookupRef(token.originalValue, tokenMap);
	if (!targets) return false; // broken ref handled separately

	for (const target of targets) {
		if (target.type === "reference") {
			if (detectCircularRef(target, tokenMap, new Set(visited))) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Resolve the concrete type of a token, following references
 */
function resolveTokenType(
	token: DesignToken,
	tokenMap: Map<string, DesignToken[]>,
	visited: Set<string>,
): string | null {
	if (token.type !== "reference") return token.type;

	const key = tokenKey(token);
	if (visited.has(key)) return null; // cycle
	visited.add(key);

	const targets = lookupRef(token.originalValue, tokenMap);
	if (!targets || targets.length === 0) return null;

	return resolveTokenType(targets[0], tokenMap, new Set(visited));
}

/**
 * Map token type to Figma variable type for compatibility checking
 */
function toFigmaType(
	type: string,
): "COLOR" | "FLOAT" | "STRING" | "BOOLEAN" | null {
	if (type === "color") return "COLOR";
	if (
		type === "spacing" ||
		type === "sizing" ||
		type === "borderRadius" ||
		type === "borderWidth" ||
		type === "number" ||
		type === "dimension" ||
		type === "duration"
	)
		return "FLOAT";
	if (
		type === "string" ||
		type === "fontFamily" ||
		type === "fontWeight" ||
		type === "text" ||
		type === "cubicBezier" ||
		type === "boxShadow"
	)
		return "STRING";
	if (type === "boolean") return "BOOLEAN";
	return null;
}

/**
 * Check if a reference points to itself
 */
function isSelfRef(token: DesignToken): boolean {
	if (token.type !== "reference") return false;
	const parsed = parseRef(token.originalValue);
	if (!parsed) return false;

	// Check: does the ref resolve back to this token?
	// e.g., token category="semantics", figmaName="bg", ref="{semantics.bg}"
	if (parsed.collection === token.category && parsed.path === token.figmaName) {
		return true;
	}
	// Also check full path match
	if (parsed.full === token.figmaName) {
		return true;
	}
	return false;
}

/**
 * Validate tokens before import - checks for issues that would cause failures
 */
export function validateTokens(tokens: DesignToken[]): ValidationResult {
	const issues: ValidationIssue[] = [];
	const activeTokens = tokens.filter((t) => t.action !== "skip");
	const tokenMap = buildTokenMap(activeTokens);

	// 1. Check for duplicate figmaNames within the same collection and mode
	const seenNames = new Map<string, DesignToken>();
	for (const token of activeTokens) {
		const modeName = (token as any).modeName || "__default__";
		const key = `${token.category}::${token.figmaName}::${modeName}`;
		const existing = seenNames.get(key);
		if (existing) {
			issues.push({
				tokenId: token.id,
				tokenName: token.figmaName,
				severity: "error",
				type: "duplicate-name",
				message: `Duplicate name "${token.figmaName}" in collection "${token.category}"`,
			});
		} else {
			seenNames.set(key, token);
		}
	}

	// 2. Check references
	for (const token of activeTokens) {
		if (token.type !== "reference") continue;

		// Self-reference check
		if (isSelfRef(token)) {
			issues.push({
				tokenId: token.id,
				tokenName: token.figmaName,
				severity: "error",
				type: "self-ref",
				message: `Self-reference: "${token.figmaName}" references itself`,
			});
			continue;
		}

		// Broken reference check
		const targets = lookupRef(token.originalValue, tokenMap);
		if (!targets || targets.length === 0) {
			issues.push({
				tokenId: token.id,
				tokenName: token.figmaName,
				severity: "warning",
				type: "broken-ref",
				message: `Reference "${token.originalValue}" not found in import set (may exist in Figma)`,
			});
			continue;
		}

		// Circular reference check
		if (detectCircularRef(token, tokenMap, new Set())) {
			issues.push({
				tokenId: token.id,
				tokenName: token.figmaName,
				severity: "error",
				type: "circular-ref",
				message: `Circular reference detected starting from "${token.figmaName}"`,
			});
			continue;
		}

		// Type mismatch check
		const sourceType = resolveTokenType(token, tokenMap, new Set());
		if (sourceType && targets[0].type !== "reference") {
			const targetType = targets[0].type;
			const sourceFigma = toFigmaType(sourceType);
			const targetFigma = toFigmaType(targetType);
			if (sourceFigma && targetFigma && sourceFigma !== targetFigma) {
				issues.push({
					tokenId: token.id,
					tokenName: token.figmaName,
					severity: "error",
					type: "type-mismatch",
					message: `Type mismatch: references "${targets[0].figmaName}" (${targetType}) but expected compatible type`,
				});
			}
		}
	}

	const stats = {
		errors: issues.filter((i) => i.severity === "error").length,
		warnings: issues.filter((i) => i.severity === "warning").length,
		circularRefs: issues.filter((i) => i.type === "circular-ref").length,
		brokenRefs: issues.filter((i) => i.type === "broken-ref").length,
		typeMismatches: issues.filter((i) => i.type === "type-mismatch").length,
		duplicateNames: issues.filter(
			(i) => i.type === "duplicate-name" || i.type === "self-ref",
		).length,
	};

	return {
		valid: stats.errors === 0,
		issues,
		stats,
	};
}
