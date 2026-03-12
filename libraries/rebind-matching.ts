/**
 * Rebind matching helpers — extracted from scan-rebind handler for testability.
 * Used to match unbound style properties to local variables by path and value.
 */

/** Normalize a path for comparison: lowercase, strip hyphens/underscores/spaces */
export const normalizePath = (p: string) =>
	p.toLowerCase().replace(/[\s\-_]/g, "");

/** Variable entry with resolved values */
export interface VarEntry {
	id: string;
	name: string;
	values: number[];
}

export interface StringVarEntry {
	id: string;
	name: string;
	values: string[];
}

export interface MatchResult<T> {
	type: "exact" | "name";
	var: T;
}

/**
 * Find a float variable by:
 * 1. Path-based: variable name includes stylePath/suffix (e.g. "typography/large-title/font/size")
 * 2. Fallback: value match + name contains one of the hint strings
 */
export function findFloatVar(
	varMap: VarEntry[],
	value: number,
	styleName: string,
	suffix: string,
	...fallbackHints: string[]
): MatchResult<VarEntry> | undefined {
	const styleNorm = normalizePath(styleName);
	const suffixNorm = normalizePath(suffix);

	// 1. Path-based
	const pathMatch = varMap.find((v) => {
		const vNorm = normalizePath(v.name);
		return (
			v.values.some((val) => val === value) &&
			(vNorm.endsWith(`${styleNorm}/${suffixNorm}`) ||
				vNorm.includes(`${styleNorm}/${suffixNorm}`))
		);
	});
	if (pathMatch) return { var: pathMatch, type: "exact" };

	// 2. Fallback: value match + name must contain one of the hints
	for (const hint of [suffix, ...fallbackHints]) {
		const hintNorm = normalizePath(hint);
		const match = varMap.find(
			(v) =>
				v.values.some((val) => val === value) &&
				normalizePath(v.name).includes(hintNorm),
		);
		if (match) return { var: match, type: "name" };
	}

	return undefined;
}

/**
 * Find a string variable by:
 * 1. Path-based: variable name includes stylePath/suffix
 * 2. Fallback: value match + name contains one of the hint strings
 */
export function findStringVar(
	varMap: StringVarEntry[],
	value: string,
	styleName: string,
	suffix: string,
	...fallbackHints: string[]
): MatchResult<StringVarEntry> | undefined {
	const lower = value.toLowerCase();
	const styleNorm = normalizePath(styleName);
	const suffixNorm = normalizePath(suffix);

	// 1. Path-based
	const pathMatch = varMap.find((v) => {
		const vNorm = normalizePath(v.name);
		return (
			v.values.some((val) => val.toLowerCase() === lower) &&
			(vNorm.endsWith(`${styleNorm}/${suffixNorm}`) ||
				vNorm.includes(`${styleNorm}/${suffixNorm}`))
		);
	});
	if (pathMatch) return { var: pathMatch, type: "exact" };

	// 2. Fallback
	for (const hint of [suffix, ...fallbackHints]) {
		const hintNorm = normalizePath(hint);
		const match = varMap.find(
			(v) =>
				v.values.some((val) => val.toLowerCase() === lower) &&
				normalizePath(v.name).includes(hintNorm),
		);
		if (match) return { var: match, type: "name" };
	}

	return undefined;
}

/** RGBA color key for matching (includes alpha) */
export function colorKey(r: number, g: number, b: number, a: number): string {
	return `${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${Math.round(a * 100)}`;
}

/** Font style name → numeric weight */
export const WEIGHT_MAP: Record<string, number> = {
	thin: 100,
	hairline: 100,
	"extra light": 200,
	ultralight: 200,
	light: 300,
	regular: 400,
	normal: 400,
	medium: 500,
	"semi bold": 600,
	semibold: 600,
	demibold: 600,
	bold: 700,
	"extra bold": 800,
	ultrabold: 800,
	extrabold: 800,
	black: 900,
	heavy: 900,
	"extra black": 950,
	ultrablack: 950,
};
