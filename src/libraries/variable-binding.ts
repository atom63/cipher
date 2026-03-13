/**
 * Cipher - Figma Design System Plugin
 * Variable binding utilities for export/import operations
 *
 * These utilities handle the common pattern of checking if Figma properties
 * (paints, effects, etc.) are bound to variables and extracting that information.
 */

/// <reference types="@figma/plugin-typings" />

const DEBUG = false;

// ============================================================================
// TYPES
// ============================================================================

/** Information about a bound variable */
export interface BoundVariableInfo {
	collectionId: string | undefined;
	collectionName: string;
	type: "variable";
	variableId: string;
	variableName: string;
}

/** Properties that can have variable bindings */
export type BindableProperty =
	| "color"
	| "radius"
	| "spread"
	| "opacity"
	| "x"
	| "y";

// ============================================================================
// CORE UTILITIES
// ============================================================================

/**
 * Get bound variable information from any object that may have boundVariables
 *
 * @param obj - Any Figma object that may have boundVariables (paint, effect, stop, etc.)
 * @param property - The property to check for binding (color, radius, spread, etc.)
 * @returns BoundVariableInfo if bound, null otherwise
 *
 * @example
 * ```ts
 * // Check if a paint's color is bound to a variable
 * const binding = getBoundVariable(paint, 'color')
 * if (binding) {
 *   console.log(`Bound to ${binding.variableName}`)
 * }
 * ```
 */
export async function getBoundVariable(
	obj: unknown,
	property: BindableProperty,
): Promise<BoundVariableInfo | null> {
	try {
		if (!obj || typeof obj !== "object") return null;

		const anyObj = obj as Record<string, unknown>;
		const boundVariables = anyObj.boundVariables as
			| Record<string, { id?: string }>
			| undefined;

		if (!boundVariables || typeof boundVariables !== "object") return null;
		if (!boundVariables[property]?.id) return null;

		const variableId = boundVariables[property].id;
		if (!variableId) return null;

		const variable = await figma.variables.getVariableByIdAsync(variableId);
		if (!variable) return null;

		const collection = await figma.variables.getVariableCollectionByIdAsync(
			variable.variableCollectionId,
		);

		return {
			type: "variable",
			variableId: variable.id,
			variableName: variable.name,
			collectionName: collection?.name ?? "Unknown",
			collectionId: collection?.id,
		};
	} catch (_error) {
		// Silently fail - boundVariables may not be available in all contexts
		return null;
	}
}

/**
 * Get all bound variables from an object
 *
 * @param obj - Any Figma object that may have boundVariables
 * @param properties - Array of properties to check
 * @returns Record of property name to BoundVariableInfo (only includes bound properties)
 *
 * @example
 * ```ts
 * const bindings = getAllBoundVariables(effect, ['color', 'radius', 'spread'])
 * // Returns: { color: BoundVariableInfo, radius: BoundVariableInfo }
 * ```
 */
export async function getAllBoundVariables(
	obj: unknown,
	properties: BindableProperty[],
): Promise<Partial<Record<BindableProperty, BoundVariableInfo>>> {
	const result: Partial<Record<BindableProperty, BoundVariableInfo>> = {};

	for (const property of properties) {
		const binding = await getBoundVariable(obj, property);
		if (binding) {
			result[property] = binding;
		}
	}

	return result;
}

/**
 * Check if a paint/fill is bound to a variable (convenience function)
 *
 * @param paint - A Figma paint object
 * @returns BoundVariableInfo if the paint's color is bound, null otherwise
 */
export async function getPaintBoundVariable(paint: Paint): Promise<BoundVariableInfo | null> {
	return await getBoundVariable(paint, "color");
}

/**
 * Get all effect bindings (color, radius, spread)
 *
 * @param effect - A Figma effect object
 * @returns Object with any bound properties
 */
export async function getEffectBoundVariables(effect: Effect): Promise<{
	color?: BoundVariableInfo;
	radius?: BoundVariableInfo;
	spread?: BoundVariableInfo;
}> {
	return await getAllBoundVariables(effect, ["color", "radius", "spread"]);
}

/**
 * Resolve a variable reference to a token path string
 *
 * @param variableId - The Figma variable ID
 * @returns Token reference string like "{collection.path.to.variable}" or null
 *
 * @example
 * ```ts
 * const ref = resolveVariableReference(value.id)
 * // Returns: "{primitives.color.zinc.50}"
 * ```
 */
export async function resolveVariableReference(variableId: string): Promise<string | null> {
	try {
		const variable = await figma.variables.getVariableByIdAsync(variableId);
		if (!variable) return null;

		const collection = await figma.variables.getVariableCollectionByIdAsync(
			variable.variableCollectionId,
		);
		const collectionName = collection?.name ?? "unknown";

		// Convert slashes to dots for token path format
		const variablePath = variable.name.replace(/\//g, ".");

		return `{${collectionName}.${variablePath}}`;
	} catch {
		return null;
	}
}

/**
 * Check if a value is a variable alias (reference to another variable)
 *
 * @param value - Any value from a Figma variable
 * @returns True if this is a variable alias
 */
export function isVariableAlias(
	value: unknown,
): value is { type: "VARIABLE_ALIAS"; id: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		(value as { type: string }).type === "VARIABLE_ALIAS" &&
		"id" in value
	);
}

// ============================================================================
// LOGGING HELPERS (for debugging)
// ============================================================================

/**
 * Log bound variable information (for debugging during export)
 *
 * @param context - Description of where this binding was found
 * @param binding - The bound variable info
 */
export function logBinding(
	context: string,
	binding: BoundVariableInfo | null,
): void {
	if (binding && DEBUG) {
		console.log(`🔗 ${context} → variable: ${binding.variableName}`);
	}
}
