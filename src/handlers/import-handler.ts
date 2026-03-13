// Import handler - creates Figma variables and styles from design tokens
// Supports multi-collection imports with references and modes

/// <reference types="@figma/plugin-typings" />

import type {
	DesignToken,
	ImportResults,
	ImportUndoEntry,
} from "../libraries/shared-types";
import { parseColorToRGBA } from "../parsers/color-parsers";
import { debug } from "../utils/debug";

/**
 * Update the paint style opacity for a variable that uses color-mix().
 * Finds the paint style whose name matches the variable name and updates
 * the fill opacity to match the color-mix transparency value.
 */
async function updatePaintStyleOpacity(variable: Variable, opacity: number): Promise<void> {
	try {
		const varNameNorm = variable.name.toLowerCase();
		const paintStyles = await figma.getLocalPaintStylesAsync();

		for (const style of paintStyles) {
			// Match style name to variable name (strip collection prefix)
			const styleNameNorm = style.name
				.replace(/^(semantics|aliases|primitives)\//i, "")
				.toLowerCase();
			if (styleNameNorm !== varNameNorm) continue;

			// Update opacity on fills that reference this variable
			const updatedPaints = style.paints.map((paint) => {
				if (paint.type === "SOLID") {
					const boundVars = paint.boundVariables;
					if (boundVars?.color?.id === variable.id) {
						return { ...paint, opacity };
					}
				}
				if (
					"gradientStops" in paint &&
					Array.isArray(paint.gradientStops)
				) {
					const hasRef = paint.gradientStops.some(
						(stop) => stop.boundVariables?.color?.id === variable.id,
					);
					if (hasRef) {
						return { ...paint, opacity };
					}
				}
				return paint;
			});

			style.paints = updatedPaints as Paint[];
			debug(
				`🎨 Updated paint style "${style.name}" opacity to ${opacity}`,
			);
			return;
		}
	} catch (e) {
		debug(`⚠️ Could not update paint style opacity: ${e}`);
	}
}

// Create Figma variables from tokens (supports multi-collection with references)
// Note: collectionName parameter is currently unused - tokens are grouped by their category property
// This allows multi-collection imports (primitives, aliases, semantic) in a single operation
export async function createVariablesFromTokens(
	tokens: DesignToken[],
	_collectionName: string,
	importMode: "import" | "override" = "import",
): Promise<ImportResults> {
	const isOverrideMode = importMode === "override";
	const results: ImportResults = {
		success: 0,
		failed: 0,
		errors: [],
		skipped: 0,
		changes: [],
		undoData: [],
	};
	const undoEntries: ImportUndoEntry[] = [];

	try {
		// Group tokens by collection
		const tokensByCollection: Record<string, DesignToken[]> = {};
		for (const token of tokens) {
			if (token.action !== "import") continue;

			const collectionKey = token.category;
			if (!tokensByCollection[collectionKey]) {
				tokensByCollection[collectionKey] = [];
			}
			tokensByCollection[collectionKey].push(token);
		}

		// Process collections in dependency order
		// Responsive collection is processed last as it may reference other collections
		const collectionOrder = [
			"primitives",
			"aliases",
			"semantics",
			"responsive",
		];
		const collectionsToProcess = collectionOrder.filter(
			(key) => tokensByCollection[key],
		);

		// Add any other collections not in the predefined order
		for (const key of Object.keys(tokensByCollection)) {
			if (!collectionsToProcess.includes(key)) {
				collectionsToProcess.push(key);
			}
		}

		// Map to store created variables for reference resolution
		const variableMap = new Map<string, Variable>();

		// Process each collection
		for (const collectionKey of collectionsToProcess) {
			const collectionTokens = tokensByCollection[collectionKey];
			if (!collectionTokens || collectionTokens.length === 0) continue;

			debug(
				`📦 Processing collection: "${collectionKey}" with ${collectionTokens.length} tokens`,
			);

			// Create or get Figma collection
			let collection: VariableCollection;
			const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
			const existing = existingCollections.find(
				(c) => c.name === collectionKey,
			);

			if (existing) {
				collection = existing;
				debug(`✅ Found existing collection: "${collectionKey}"`);
			} else {
				collection = figma.variables.createVariableCollection(collectionKey);
				debug(`✨ Created new collection: "${collectionKey}"`);
			}

			// Detect and create modes if tokens have modeName property
			const modeNames = new Set<string>();
			for (const token of collectionTokens) {
				if ((token as any).modeName) {
					modeNames.add((token as any).modeName);
				}
			}

			// Create modes if needed
			const modeMap = new Map<string, string>(); // modeName -> modeId
			if (modeNames.size > 0) {
				const modeNamesArray = Array.from(modeNames);
				debug(
					`🎨 Collection "${collectionKey}" has ${modeNamesArray.length} modes: ${modeNamesArray.join(", ")}`,
				);

				// Rename the first (default) mode using renameMode()
				const firstModeName = modeNamesArray[0];
				const firstModeId = collection.modes[0].modeId;
				collection.renameMode(firstModeId, firstModeName);
				modeMap.set(firstModeName, firstModeId);
				debug(`  ✓ Mode 1: "${firstModeName}" (default mode renamed)`);

				// Add remaining modes
				for (let i = 1; i < modeNamesArray.length; i++) {
					const modeName = modeNamesArray[i];
					const existingMode = collection.modes.find(
						(m) => m.name === modeName,
					);
					if (existingMode) {
						modeMap.set(modeName, existingMode.modeId);
						debug(`  ✓ Mode ${i + 1}: "${modeName}" (already exists)`);
					} else {
						const newMode = collection.addMode(modeName);
						modeMap.set(modeName, newMode);
						debug(`  ✨ Mode ${i + 1}: "${modeName}" (created)`);
					}
				}
			} else {
				debug(
					`📝 Collection "${collectionKey}" has single mode (default)`,
				);
			}

			const defaultMode = collection.modes[0].modeId;

			// First pass: Create variables with direct values
			for (const token of collectionTokens) {
				if (token.type === "reference") continue;

				try {
					const modeName = (token as any).modeName;
					let modeId =
						modeName && modeMap.has(modeName)
							? (modeMap.get(modeName) ?? defaultMode)
							: defaultMode;

					// Validate that the mode exists in the current collection
					if (!collection.modes.some((m) => m.modeId === modeId)) {
						console.warn(
							`⚠️ Mode "${modeName}" (${modeId}) not found in collection "${collectionKey}", using default mode`,
						);
						modeId = defaultMode;
					}

					// Determine Figma variable type based on token type
					let figmaType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN" | null = null;
					let processedValue: any = token.value;

					if (
						token.type === "color" &&
						typeof token.value === "object" &&
						"r" in token.value
					) {
						figmaType = "COLOR";
					} else if (
						token.type === "color" &&
						typeof token.value === "string"
					) {
						// color-mix() and other complex color expressions — store as STRING
						figmaType = "STRING";
						processedValue = token.originalValue || String(token.value);
					} else if (
						token.type === "spacing" ||
						token.type === "sizing" ||
						token.type === "borderRadius" ||
						token.type === "borderWidth" ||
						token.type === "number" ||
						token.type === "dimension" ||
						token.type === "duration"
					) {
						figmaType = "FLOAT";
						processedValue = Number(token.value);
					} else if (
						token.type === "string" ||
						token.type === "fontFamily" ||
						token.type === "fontWeight" ||
						token.type === "text" ||
						token.type === "cubicBezier" ||
						token.type === "boxShadow"
					) {
						figmaType = "STRING";
						processedValue = String(token.value);
					} else if (token.type === "boolean") {
						figmaType = "BOOLEAN";
						processedValue = Boolean(token.value);
					}

					// Skip if we can't determine the Figma type
					if (!figmaType) {
						results.failed++;
						results.errors.push(
							`❌ "${token.figmaName}" - Unsupported type: "${token.type}". Supported types: color, spacing, sizing, borderRadius, borderWidth, duration, fontFamily, fontWeight, string, cubicBezier, boxShadow, number, dimension, boolean, and text.`,
						);
						continue;
					}

					// Get or create variable
					let variable: Variable;
					let isNewVariable = false;
					// Look up with composite key first, then fallback to path only
					const existingVar =
						variableMap.get(`${collectionKey}:${token.figmaName}`) ||
						variableMap.get(token.figmaName);

					if (existingVar) {
						// Verify the variable belongs to the current collection and has the correct modes
						if (existingVar.variableCollectionId === collection.id) {
							variable = existingVar;
						} else {
							// Variable exists but in a different collection - Figma doesn't allow duplicate names
							const existingCollection =
								await figma.variables.getVariableCollectionByIdAsync(
									existingVar.variableCollectionId,
								);
							results.failed++;
							results.errors.push(
								`⚠️ "${token.figmaName}" - Duplicate variable name: A variable with this name already exists in collection "${existingCollection?.name}". Figma requires unique variable names across all collections. Solution: Rename this token to "${collectionKey}/${token.figmaName}" or use a different naming scheme.`,
							);
							continue;
						}
					} else {
						const existing = (await figma.variables
							.getLocalVariablesAsync())
							.find((v) => v.name === token.figmaName);
						if (existing && existing.variableCollectionId === collection.id) {
							if (existing.resolvedType === figmaType) {
								variable = existing;
							} else {
								// Type mismatch: skip this token and report error
								results.failed++;
								results.errors.push(
									`⚠️ "${token.figmaName}" - Type conflict: A variable with this name already exists as ${existing.resolvedType}, but the token is trying to import as ${figmaType}. Solution: Rename the token or delete the existing variable in Figma.`,
								);
								continue;
							}
						} else if (existing) {
							// Variable exists in a different collection - Figma doesn't allow duplicate names
							const existingCollection =
								await figma.variables.getVariableCollectionByIdAsync(
									existing.variableCollectionId,
								);
							results.failed++;
							results.errors.push(
								`⚠️ "${token.figmaName}" - Duplicate variable name: A variable with this name already exists in collection "${existingCollection?.name}". Figma requires unique variable names across all collections. Solution: Rename this token to "${collectionKey}/${token.figmaName}" or use a different naming scheme.`,
							);
							continue;
						} else {
							// Create new variable (allowed in both import and override modes)
							variable = figma.variables.createVariable(
								token.figmaName,
								collection,
								figmaType,
							);
							isNewVariable = true;
						}
						// Store with composite key: collection:path for cross-collection reference resolution
						variableMap.set(`${collectionKey}:${token.figmaName}`, variable);
						// Also store with just the path for backwards compatibility
						variableMap.set(token.figmaName, variable);
					}

					// Track old value for change detection
					const oldValue = !isNewVariable
						? variable.valuesByMode[modeId]
						: undefined;
					const oldValueStr =
						oldValue !== undefined ? String(oldValue) : undefined;
					const newValueStr = String(processedValue);

					// Snapshot all mode values before mutation (for undo)
					const preUpdateSnapshot =
						!(isNewVariable ||undoEntries.some(
							(e) => e.variableId === variable.id && e.action === "updated",
						))
							? { ...variable.valuesByMode }
							: null;
					const preUpdateDescription = !isNewVariable
						? variable.description
						: undefined;

					variable.setValueForMode(modeId, processedValue);

					// Set description after setting value
					if (token.description) {
						variable.description = token.description;
					}
					results.success++;

					// Track change + undo data
					if (isNewVariable) {
						results.changes.push({
							name: token.figmaName,
							type: token.type,
							action: "created",
							newValue: newValueStr,
						});
						undoEntries.push({
							variableId: variable.id,
							action: "created",
						});
					} else if (oldValueStr !== newValueStr) {
						results.changes.push({
							name: token.figmaName,
							type: token.type,
							action: "updated",
							oldValue: oldValueStr,
							newValue: newValueStr,
						});
						// Use pre-mutation snapshot for undo
						if (preUpdateSnapshot) {
							undoEntries.push({
								variableId: variable.id,
								action: "updated",
								previousValues: preUpdateSnapshot,
								previousDescription: preUpdateDescription,
							});
						}
					} else {
						results.changes.push({
							name: token.figmaName,
							type: token.type,
							action: "unchanged",
							newValue: newValueStr,
						});
					}
				} catch (error) {
					results.failed++;
					const errorMsg =
						error instanceof Error ? error.message : "Unknown error";
					results.errors.push(
						`❌ "${token.figmaName}" - Failed to create variable: ${errorMsg}`,
					);
				}
			}

			// Second pass: Create variable aliases (references)
			for (const token of collectionTokens) {
				if (token.type !== "reference") continue;

				try {
					const modeName = (token as any).modeName;
					let modeId =
						modeName && modeMap.has(modeName)
							? (modeMap.get(modeName) ?? defaultMode)
							: defaultMode;

					// Validate that the mode exists in the current collection
					if (!collection.modes.some((m) => m.modeId === modeId)) {
						console.warn(
							`⚠️ Mode "${modeName}" (${modeId}) not found in collection "${collectionKey}", using default mode`,
						);
						modeId = defaultMode;
					}

					// Parse reference: {primitives.zinc.50} -> primitives/zinc/50
					// Use token.value (converted format) over originalValue (raw CSS var())
					const refSource = typeof token.value === "string" ? token.value : token.originalValue;
					const refMatch = refSource.match(/\{([^}]+)\}/);
					if (!refMatch) {
						results.failed++;
						results.errors.push(
							`❌ "${token.figmaName}" - Invalid reference format: "${refSource}". References should be in format {collection.token.path}`,
						);
						continue;
					}

					const refPath = refMatch[1].replace(/\./g, "/");
					// Split to get collection and path (e.g., "primitives/zinc/50" -> ["primitives", "zinc/50"])
					const refParts = refPath.split("/");
					const refCollection = refParts[0];
					const refTokenPath = refParts.slice(1).join("/");

					// Look up by composite key: collection:path
					const compositeKey = `${refCollection}:${refTokenPath}`;
					let referencedVariable = variableMap.get(compositeKey);

					// Fallback: try the full path as a variable name (CSS imports use
					// the full Figma variable name as the reference path)
					if (!referencedVariable) {
						referencedVariable = variableMap.get(refPath);
					}

					// Fallback: try without collection prefix (for backwards compatibility)
					if (!referencedVariable) {
						referencedVariable = variableMap.get(refTokenPath);
					}

					if (!referencedVariable) {
						results.failed++;
						results.errors.push(
							`❌ "${token.figmaName}" - Referenced token not found: "${refPath}". Make sure the referenced token exists and was imported first.`,
						);
						continue;
					}

					// Get or create alias variable
					let variable: Variable;
					let isNewVariable = false;
					// Look up with composite key first, then fallback to path only
					const existingVar =
						variableMap.get(`${collectionKey}:${token.figmaName}`) ||
						variableMap.get(token.figmaName);

					if (existingVar) {
						// Verify the variable belongs to the current collection and has the correct modes
						if (existingVar.variableCollectionId === collection.id) {
							variable = existingVar;
						} else {
							// Variable exists but in a different collection - Figma doesn't allow duplicate names
							const existingCollection =
								await figma.variables.getVariableCollectionByIdAsync(
									existingVar.variableCollectionId,
								);
							results.failed++;
							results.errors.push(
								`⚠️ "${token.figmaName}" - Duplicate variable name: A variable with this name already exists in collection "${existingCollection?.name}". Figma requires unique variable names across all collections. Solution: Rename this token to "${collectionKey}/${token.figmaName}" or use a different naming scheme.`,
							);
							continue;
						}
					} else {
						const existing = (await figma.variables
							.getLocalVariablesAsync())
							.find((v) => v.name === token.figmaName);
						if (existing && existing.variableCollectionId === collection.id) {
							if (existing.resolvedType === referencedVariable.resolvedType) {
								variable = existing;
							} else {
								// Type mismatch: skip this token and report error
								results.failed++;
								results.errors.push(
									`⚠️ "${token.figmaName}" - Type conflict for reference: A variable with this name already exists as ${existing.resolvedType}, but the referenced token is ${referencedVariable.resolvedType}. Solution: Rename the token or delete the existing variable.`,
								);
								continue;
							}
						} else if (existing) {
							// Variable exists in a different collection - Figma doesn't allow duplicate names
							const existingCollection =
								await figma.variables.getVariableCollectionByIdAsync(
									existing.variableCollectionId,
								);
							results.failed++;
							results.errors.push(
								`⚠️ "${token.figmaName}" - Duplicate variable name: A variable with this name already exists in collection "${existingCollection?.name}". Figma requires unique variable names across all collections. Solution: Rename this token to "${collectionKey}/${token.figmaName}" or use a different naming scheme.`,
							);
							continue;
						} else {
							// Create new variable (allowed in both import and override modes)
							variable = figma.variables.createVariable(
								token.figmaName,
								collection,
								referencedVariable.resolvedType,
							);
							isNewVariable = true;
						}
						// Store with composite key: collection:path for cross-collection reference resolution
						variableMap.set(`${collectionKey}:${token.figmaName}`, variable);
						// Also store with just the path for backwards compatibility
						variableMap.set(token.figmaName, variable);
					}

					// Track old value for change detection
					const oldValue = !isNewVariable
						? variable.valuesByMode[modeId]
						: undefined;
					const oldRefId =
						oldValue && typeof oldValue === "object" && "id" in oldValue
							? oldValue.id
							: undefined;
					const newRefId = referencedVariable.id;

					// Snapshot before mutation for undo
					const preRefSnapshot =
						!(isNewVariable ||undoEntries.some(
							(e) => e.variableId === variable.id && e.action === "updated",
						))
							? { ...variable.valuesByMode }
							: null;
					const preRefDescription = !isNewVariable
						? variable.description
						: undefined;

					// Set as alias for this mode
					variable.setValueForMode(modeId, {
						type: "VARIABLE_ALIAS",
						id: newRefId,
					});

					// Update paint style opacity for color-mix() tokens
					// color-mix(in srgb, var(--X), transparent N%) exports a variable
					// alias with style-level opacity — we need to update the paint style
					const styleOpacity = (token as any).styleOpacity;
					if (styleOpacity !== undefined && styleOpacity < 1) {
						await updatePaintStyleOpacity(variable, styleOpacity);
					}

					// Set description after setting value (for references)
					if (token.description) {
						variable.description = token.description;
					}

					results.success++;

					// Track change (for references, we track the referenced variable name)
					const newRefName = referencedVariable.name;
					const oldRefVariable = oldRefId
						? await figma.variables.getVariableByIdAsync(oldRefId as string)
						: null;
					const oldRefName = oldRefVariable ? oldRefVariable.name : undefined;

					if (isNewVariable) {
						results.changes.push({
							name: token.figmaName,
							type: "reference",
							action: "created",
							newValue: `→ ${newRefName}`,
						});
						undoEntries.push({
							variableId: variable.id,
							action: "created",
						});
					} else if (oldRefId !== newRefId) {
						results.changes.push({
							name: token.figmaName,
							type: "reference",
							action: "updated",
							oldValue: oldRefName ? `→ ${oldRefName}` : "unknown",
							newValue: `→ ${newRefName}`,
						});
						if (preRefSnapshot) {
							undoEntries.push({
								variableId: variable.id,
								action: "updated",
								previousValues: preRefSnapshot,
								previousDescription: preRefDescription,
							});
						}
					} else {
						results.changes.push({
							name: token.figmaName,
							type: "reference",
							action: "unchanged",
							newValue: `→ ${newRefName}`,
						});
					}
				} catch (error) {
					results.failed++;
					const errorMsg =
						error instanceof Error ? error.message : "Unknown error";
					results.errors.push(
						`❌ "${token.figmaName}" - Failed to create reference: ${errorMsg}`,
					);
				}
			}
		}

		// --- Auto-rebuild responsive collection from imported typescale primitives ---
		// If primitives include font/typescale/*/size/* tokens but no responsive
		// tokens were imported, synthesize the responsive collection with aliases
		// pointing back to the primitives. This ensures CSS → Figma roundtrip
		// preserves the full typescale system.
		if (tokensByCollection["primitives"] && !tokensByCollection["responsive"]) {
			await rebuildResponsiveFromPrimitives(variableMap, results, undoEntries);
		}

		// Attach undo data
		results.undoData = undoEntries;

		// Log results for debugging
		debug(`${isOverrideMode ? "Override" : "Import"} completed:`, {
			success: results.success,
			failed: results.failed,
			skipped: results.skipped,
			totalErrors: results.errors.length,
			undoEntries: undoEntries.length,
		});

		if (results.errors.length > 0) {
			debug(
				`${isOverrideMode ? "Override" : "Import"} errors:`,
				results.errors,
			);
		}

		return results;
	} catch (error) {
		results.failed++;
		const errorMsg = error instanceof Error ? error.message : "Unknown error";
		results.errors.push(
			`🚨 Critical error during import: ${errorMsg}. Please check your token format and try again.`,
		);
		return results;
	}
}

// ---------------------------------------------------------------------------
// Auto-rebuild responsive collection from imported typescale primitives
// ---------------------------------------------------------------------------

const RESPONSIVE_MODES = ["desktop (md)", "tablet (sm)", "mobile (min)"] as const;
const MODE_TO_VARIANT: Record<string, string> = {
	"desktop (md)": "md",
	"tablet (sm)": "sm",
	"mobile (min)": "min",
};

/** Pattern: font/typescale/{step}/size/{variant} or font/typescale/{step}/line/height/{variant} */
const TYPESCALE_RE = /^font\/typescale\/([^/]+)\/(size|line\/height)\/(min|sm|md)$/;

async function rebuildResponsiveFromPrimitives(
	variableMap: Map<string, Variable>,
	results: ImportResults,
	undoEntries: ImportUndoEntry[],
) {
	// Scan imported primitives for typescale tokens
	const steps = new Set<string>();
	for (const [key] of variableMap) {
		const match = key.match(TYPESCALE_RE);
		if (match) steps.add(match[1]);
	}

	if (steps.size === 0) return;

	debug(`🔄 Rebuilding responsive collection for ${steps.size} typescale steps`);

	// Get or create responsive collection
	const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
	let collection = existingCollections.find((c) => c.name === "responsive");
	if (!collection) {
		collection = figma.variables.createVariableCollection("responsive");
		debug("✨ Created responsive collection");
	}

	// Ensure modes exist
	const modeMap = new Map<string, string>();
	const firstModeName = RESPONSIVE_MODES[0];
	const firstModeId = collection.modes[0].modeId;
	if (collection.modes[0].name !== firstModeName) {
		collection.renameMode(firstModeId, firstModeName);
	}
	modeMap.set(firstModeName, firstModeId);

	for (let i = 1; i < RESPONSIVE_MODES.length; i++) {
		const modeName = RESPONSIVE_MODES[i];
		const existingMode = collection.modes.find((m) => m.name === modeName);
		if (existingMode) {
			modeMap.set(modeName, existingMode.modeId);
		} else {
			const newModeId = collection.addMode(modeName);
			modeMap.set(modeName, newModeId);
		}
	}

	// For each step, create typography/{step}/font/size and typography/{step}/line/height
	// Each mode aliases to the matching primitive variant
	const props = [
		{ responsiveProp: "font/size", primitiveProp: "size" },
		{ responsiveProp: "line/height", primitiveProp: "line/height" },
	];

	for (const step of steps) {
		for (const { responsiveProp, primitiveProp } of props) {
			const varName = `typography/${step}/${responsiveProp}`;

			// Get or create the responsive variable
			let variable: Variable | undefined;
			const existing = (await figma.variables
				.getLocalVariablesAsync())
				.find((v) => v.name === varName && v.variableCollectionId === collection!.id);

			if (existing) {
				variable = existing;
			} else {
				try {
					variable = figma.variables.createVariable(varName, collection!, "FLOAT");
					undoEntries.push({ variableId: variable.id, action: "created" });
					results.success++;
					results.changes.push({
						name: varName,
						type: "reference",
						action: "created",
						newValue: `responsive alias`,
					});
				} catch (error) {
					debug(`⚠️ Failed to create responsive variable: ${varName}`, error);
					continue;
				}
			}

			// Set alias for each mode
			for (const mode of RESPONSIVE_MODES) {
				const modeId = modeMap.get(mode);
				if (!modeId) continue;

				const variant = MODE_TO_VARIANT[mode];
				const primitivePath = `font/typescale/${step}/${primitiveProp}/${variant}`;

				// Look up the primitive variable
				const primitiveVar =
					variableMap.get(`primitives:${primitivePath}`) ||
					variableMap.get(primitivePath);

				if (!primitiveVar) {
					debug(`⚠️ Missing primitive for responsive alias: ${primitivePath}`);
					continue;
				}

				variable.setValueForMode(modeId, {
					type: "VARIABLE_ALIAS",
					id: primitiveVar.id,
				});
			}

			variable.description = `${step} ${responsiveProp.replace(/\//g, " ")} (responsive)`;
		}
	}

	// Also rebuild viewport/screen token if screen primitives exist
	const screenMap: Record<string, string> = {
		"desktop (md)": "screen/macbook-air",
		"tablet (sm)": "screen/ipad-pro-11",
		"mobile (min)": "screen/iphone-16-pro",
	};

	const hasScreenPrimitives = Object.values(screenMap).some(
		(path) => variableMap.has(`primitives:${path}`) || variableMap.has(path),
	);

	if (hasScreenPrimitives) {
		let screenVar = (await figma.variables
			.getLocalVariablesAsync())
			.find((v) => v.name === "viewport/screen" && v.variableCollectionId === collection!.id);

		if (!screenVar) {
			try {
				screenVar = figma.variables.createVariable("viewport/screen", collection!, "FLOAT");
				undoEntries.push({ variableId: screenVar.id, action: "created" });
				results.success++;
				results.changes.push({
					name: "viewport/screen",
					type: "reference",
					action: "created",
					newValue: "responsive alias",
				});
			} catch {
				// Skip if creation fails
			}
		}

		if (screenVar) {
			for (const mode of RESPONSIVE_MODES) {
				const modeId = modeMap.get(mode);
				if (!modeId) continue;

				const path = screenMap[mode];
				const primitiveVar =
					variableMap.get(`primitives:${path}`) || variableMap.get(path);

				if (primitiveVar) {
					screenVar.setValueForMode(modeId, {
						type: "VARIABLE_ALIAS",
						id: primitiveVar.id,
					});
				}
			}
			screenVar.description = "Viewport width (responsive)";
		}
	}

	debug(`✅ Responsive collection rebuilt with ${steps.size} typescale steps`);
}

// Import Figma Styles from style export JSON
export async function importStylesFromTokens(
	stylesData: any,
	selectedGroups: { category: string; group: string }[],
	importMode: "import" | "override" = "import",
): Promise<ImportResults> {
	const isOverrideMode = importMode === "override";
	const results: ImportResults = {
		success: 0,
		failed: 0,
		errors: [],
		skipped: 0,
		changes: [],
	};

	try {
		debug("📥 Starting style import...", {
			selectedGroups: selectedGroups.length,
			mode: importMode,
		});

		// Validate input
		if (!(stylesData?.styles)) {
			throw new Error("Invalid style data format");
		}

		const { paint, text, effect, grid } = stylesData.styles;

		// Helper to check if a style should be imported based on selection
		const shouldImportStyle = (
			styleName: string,
			category: string,
		): boolean => {
			if (selectedGroups.length === 0) return true;

			const parts = styleName.split("/");
			const rootFolder = parts.length > 1 ? parts[0] : "Root";

			return selectedGroups.some(
				(sel) => sel.category === category && sel.group === rootFolder,
			);
		};

		// Helper to process nested style objects recursively
		const processStyleGroup = async (
			obj: any,
			parentPath: string,
			category: string,
			processor: (styleName: string, styleData: any) => Promise<void>,
		) => {
			for (const [key, value] of Object.entries(obj)) {
				const fullPath = parentPath ? `${parentPath}/${key}` : key;

				// Check if this is a style definition (has 'id' and 'type')
				if (
					value &&
					typeof value === "object" &&
					"id" in value &&
					"type" in value
				) {
					if (shouldImportStyle(fullPath, category)) {
						try {
							await processor(fullPath, value);
						} catch (err: any) {
							console.error(`Failed to process style ${fullPath}:`, err);
							results.failed++;
							results.errors.push(
								`Failed to import ${fullPath}: ${err.message}`,
							);
						}
					} else {
						results.skipped++;
					}
				} else if (value && typeof value === "object") {
					// Recurse into nested groups
					await processStyleGroup(value, fullPath, category, processor);
				}
			}
		};

		// Import Paint Styles (Color, Gradients, Images)
		if (paint) {
			await processStyleGroup(paint, "", "paint", async (name, data) => {
				const existingStyles = await figma.getLocalPaintStylesAsync();
				let style = existingStyles.find((s) => s.name === name);

				if (!style) {
					style = figma.createPaintStyle();
					style.name = name;
					results.changes.push({
						name,
						type: "Paint Style",
						action: "created",
						newValue: "Created new paint style",
					});
				} else if (isOverrideMode) {
					results.changes.push({
						name,
						type: "Paint Style",
						action: "updated",
						oldValue: "Existing style",
						newValue: "Updated",
					});
				} else {
					results.skipped++;
					return;
				}

				if (data.description) {
					style.description = data.description;
				}

				// Convert fills back to Figma Paint objects
				if (data.fills && Array.isArray(data.fills)) {
					const paintsWithBindings: Array<{
						paint: Paint;
						variableBinding: any;
						variableName?: string;
					}> = await Promise.all(data.fills.map((fill: any) => convertFillToPaint(fill, true)));

					// Clone paints array and bind variables using the correct API
					const boundPaints = await Promise.all(paintsWithBindings.map(
						async ({ paint, variableBinding, variableName }: any) => {
							if (variableBinding?.id) {
								try {
									// Use figma.variables.setBoundVariableForPaint to bind the variable (solid fills)
									const variable = await figma.variables.getVariableByIdAsync(
										variableBinding.id,
									);
									if (variable) {
										debug(
											`🔗 Bound variable "${variableName}" to style "${name}"`,
										);
										return figma.variables.setBoundVariableForPaint(
											paint,
											"color",
											variable,
										);
									}
								} catch (e) {
									console.warn("Could not bind variable to paint:", e);
								}
							}

							return paint;
						},
					));

					style.paints = boundPaints;
				}

				results.success++;
			});
		}

		// Import Text Styles (Typography)
		if (text) {
			await processStyleGroup(text, "", "text", async (name, data) => {
				const existingStyles = await figma.getLocalTextStylesAsync();
				let style = existingStyles.find((s) => s.name === name);

				if (!style) {
					style = figma.createTextStyle();
					style.name = name;
					results.changes.push({
						name,
						type: "Text Style",
						action: "created",
						newValue: "Created new text style",
					});
				} else if (isOverrideMode) {
					results.changes.push({
						name,
						type: "Text Style",
						action: "updated",
						oldValue: "Existing style",
						newValue: "Updated",
					});
				} else {
					results.skipped++;
					return;
				}

				if (data.description) {
					style.description = data.description;
				}

				// Set font properties - check for variable binding first
				if (data.fontFamilyBoundVariable?.variableName) {
					const collectionName = data.fontFamilyBoundVariable.collectionName;
					const variable = await findVariableByName(
						data.fontFamilyBoundVariable.variableName,
						collectionName,
					);
					if (variable) {
						try {
							// Use the correct API to bind variables to text style properties
							style.setBoundVariable("fontFamily", variable);
							debug(
								`🔗 Bound fontFamily variable "${variable.name}" to style "${name}"`,
							);

							// Still need to load and set the font for immediate display
							if (data.fontFamily && data.fontStyle) {
								try {
									await figma.loadFontAsync({
										family: data.fontFamily,
										style: data.fontStyle,
									});
									style.fontName = {
										family: data.fontFamily,
										style: data.fontStyle,
									};
								} catch (_fontError) {
									console.warn(
										`Could not load font ${data.fontFamily} ${data.fontStyle} for variable-bound style`,
									);
								}
							}
						} catch (error) {
							console.warn(
								`Could not bind fontFamily variable to style "${name}":`,
								error,
							);
							// Fallback to direct value
							if (data.fontFamily && data.fontStyle) {
								try {
									await figma.loadFontAsync({
										family: data.fontFamily,
										style: data.fontStyle,
									});
									style.fontName = {
										family: data.fontFamily,
										style: data.fontStyle,
									};
								} catch (_fontError) {
									console.warn(
										`Could not load font ${data.fontFamily} ${data.fontStyle}, skipping font change`,
									);
									throw new Error(
										`Font not available: ${data.fontFamily} ${data.fontStyle}`,
									);
								}
							}
						}
					} else {
						console.warn(
							`⚠️ Could not find fontFamily variable "${data.fontFamilyBoundVariable.variableName}"`,
						);
						// Fallback to direct value
						if (data.fontFamily && data.fontStyle) {
							try {
								await figma.loadFontAsync({
									family: data.fontFamily,
									style: data.fontStyle,
								});
								style.fontName = {
									family: data.fontFamily,
									style: data.fontStyle,
								};
							} catch (_fontError) {
								console.warn(
									`Could not load font ${data.fontFamily} ${data.fontStyle}, skipping font change`,
								);
								throw new Error(
									`Font not available: ${data.fontFamily} ${data.fontStyle}`,
								);
							}
						}
					}
				} else if (data.fontFamily && data.fontStyle) {
					// No variable binding, set directly
					try {
						await figma.loadFontAsync({
							family: data.fontFamily,
							style: data.fontStyle,
						});
						style.fontName = {
							family: data.fontFamily,
							style: data.fontStyle,
						};
					} catch (_fontError) {
						console.warn(
							`Could not load font ${data.fontFamily} ${data.fontStyle}, skipping font change`,
						);
						throw new Error(
							`Font not available: ${data.fontFamily} ${data.fontStyle}`,
						);
					}
				}

				// Set fontSize - check for variable binding first
				if (data.fontSizeBoundVariable?.variableName) {
					const collectionName = data.fontSizeBoundVariable.collectionName;
					const variable = await findVariableByName(
						data.fontSizeBoundVariable.variableName,
						collectionName,
					);
					if (variable) {
						try {
							// Use the correct API to bind variables to text style properties
							style.setBoundVariable("fontSize", variable);
							debug(
								`🔗 Bound fontSize variable "${variable.name}" to style "${name}"`,
							);
						} catch (error) {
							console.warn(
								`Could not bind fontSize variable to style "${name}":`,
								error,
							);
							// Fallback to direct value
							if (data.fontSize) {
								style.fontSize = Number.parseFloat(data.fontSize);
							}
						}
					} else {
						console.warn(
							`⚠️ Could not find fontSize variable "${data.fontSizeBoundVariable.variableName}"`,
						);
						// Fallback to direct value
						if (data.fontSize) {
							style.fontSize = Number.parseFloat(data.fontSize);
						}
					}
				} else if (data.fontSize) {
					style.fontSize = Number.parseFloat(data.fontSize);
				}

				// Set lineHeight - check for variable binding first
				if (data.lineHeightBoundVariable?.variableName) {
					const collectionName = data.lineHeightBoundVariable.collectionName;
					const variable = await findVariableByName(
						data.lineHeightBoundVariable.variableName,
						collectionName,
					);
					if (variable) {
						try {
							// Figma requires lineHeight variables to be in PERCENT format
							// If the variable stores a multiplier (e.g., 1.4), it should be stored as 140 in the variable
							style.setBoundVariable("lineHeight", variable);
							debug(
								`🔗 Bound lineHeight variable "${variable.name}" to style "${name}"`,
							);
						} catch (error) {
							console.warn(
								`Could not bind lineHeight variable to style "${name}":`,
								error,
							);
							// Fallback to direct value
							if (data.lineHeight) {
								const lineHeightStr = String(data.lineHeight);
								if (lineHeightStr.endsWith("%")) {
									style.lineHeight = {
										value: Number.parseFloat(lineHeightStr),
										unit: "PERCENT",
									};
								} else if (lineHeightStr.endsWith("px")) {
									style.lineHeight = {
										value: Number.parseFloat(lineHeightStr),
										unit: "PIXELS",
									};
								} else {
									style.lineHeight = { unit: "AUTO" };
								}
							}
						}
					} else {
						console.warn(
							`⚠️ Could not find lineHeight variable "${data.lineHeightBoundVariable.variableName}"`,
						);
						// Fallback to direct value
						if (data.lineHeight) {
							const lineHeightStr = String(data.lineHeight);
							if (lineHeightStr.endsWith("%")) {
								style.lineHeight = {
									value: Number.parseFloat(lineHeightStr),
									unit: "PERCENT",
								};
							} else if (lineHeightStr.endsWith("px")) {
								style.lineHeight = {
									value: Number.parseFloat(lineHeightStr),
									unit: "PIXELS",
								};
							} else {
								style.lineHeight = { unit: "AUTO" };
							}
						}
					}
				} else if (data.lineHeight) {
					const lineHeightStr = String(data.lineHeight);
					if (lineHeightStr.endsWith("%")) {
						style.lineHeight = {
							value: Number.parseFloat(lineHeightStr),
							unit: "PERCENT",
						};
					} else if (lineHeightStr.endsWith("px")) {
						style.lineHeight = {
							value: Number.parseFloat(lineHeightStr),
							unit: "PIXELS",
						};
					} else {
						style.lineHeight = { unit: "AUTO" };
					}
				}

				// Set fontWeight - check for variable binding first
				if (data.fontWeightBoundVariable?.variableName) {
					const collectionName = data.fontWeightBoundVariable.collectionName;
					const variable = await findVariableByName(
						data.fontWeightBoundVariable.variableName,
						collectionName,
					);
					if (variable) {
						try {
							style.setBoundVariable("fontWeight", variable);
							debug(
								`🔗 Bound fontWeight variable "${variable.name}" to style "${name}"`,
							);
						} catch (error) {
							console.warn(
								`Could not bind fontWeight variable to style "${name}":`,
								error,
							);
							// Fallback to direct value
							if (data.fontWeight) {
								try {
									(style as any).fontWeight = Number(data.fontWeight);
								} catch (_e) {
									console.warn("Could not set fontWeight directly");
								}
							}
						}
					} else {
						console.warn(
							`⚠️ Could not find fontWeight variable "${data.fontWeightBoundVariable.variableName}"`,
						);
						// Fallback to direct value
						if (data.fontWeight) {
							try {
								(style as any).fontWeight = Number(data.fontWeight);
							} catch (_e) {
								console.warn("Could not set fontWeight directly");
							}
						}
					}
				} else if (data.fontWeight) {
					// No variable binding, set directly if the API supports it
					try {
						(style as any).fontWeight = Number(data.fontWeight);
					} catch (_e) {
						// fontWeight might not be directly settable in all Figma API versions
						console.warn(
							"Could not set fontWeight directly - property may not be supported",
						);
					}
				}

				// Set letterSpacing - check for variable binding first
				if (data.letterSpacingBoundVariable?.variableName) {
					const collectionName = data.letterSpacingBoundVariable.collectionName;
					const variable = await findVariableByName(
						data.letterSpacingBoundVariable.variableName,
						collectionName,
					);
					if (variable) {
						try {
							style.setBoundVariable("letterSpacing", variable);
							debug(
								`🔗 Bound letterSpacing variable "${variable.name}" to style "${name}"`,
							);
						} catch (error) {
							console.warn(
								`Could not bind letterSpacing variable to style "${name}":`,
								error,
							);
							// Fallback to direct value
							if (data.letterSpacing) {
								const letterSpacingStr = String(data.letterSpacing);
								if (letterSpacingStr.endsWith("%")) {
									style.letterSpacing = {
										value: Number.parseFloat(letterSpacingStr),
										unit: "PERCENT",
									};
								} else {
									style.letterSpacing = {
										value: Number.parseFloat(letterSpacingStr),
										unit: "PIXELS",
									};
								}
							}
						}
					} else {
						console.warn(
							`⚠️ Could not find letterSpacing variable "${data.letterSpacingBoundVariable.variableName}"`,
						);
						// Fallback to direct value
						if (data.letterSpacing) {
							const letterSpacingStr = String(data.letterSpacing);
							if (letterSpacingStr.endsWith("%")) {
								style.letterSpacing = {
									value: Number.parseFloat(letterSpacingStr),
									unit: "PERCENT",
								};
							} else {
								style.letterSpacing = {
									value: Number.parseFloat(letterSpacingStr),
									unit: "PIXELS",
								};
							}
						}
					}
				} else if (data.letterSpacing) {
					// No variable binding, set directly
					const letterSpacingStr = String(data.letterSpacing);
					if (letterSpacingStr.endsWith("%")) {
						style.letterSpacing = {
							value: Number.parseFloat(letterSpacingStr),
							unit: "PERCENT",
						};
					} else {
						style.letterSpacing = {
							value: Number.parseFloat(letterSpacingStr),
							unit: "PIXELS",
						};
					}
				}

				// Set paragraphSpacing - check for variable binding first
				if (data.paragraphSpacingBoundVariable?.variableName) {
					const collectionName =
						data.paragraphSpacingBoundVariable.collectionName;
					const variable = await findVariableByName(
						data.paragraphSpacingBoundVariable.variableName,
						collectionName,
					);
					if (variable) {
						try {
							style.setBoundVariable("paragraphSpacing", variable);
							debug(
								`🔗 Bound paragraphSpacing variable "${variable.name}" to style "${name}"`,
							);
						} catch (error) {
							console.warn(
								`Could not bind paragraphSpacing variable to style "${name}":`,
								error,
							);
							// Fallback to direct value
							if (data.paragraphSpacing) {
								style.paragraphSpacing = Number.parseFloat(
									data.paragraphSpacing,
								);
							}
						}
					} else {
						console.warn(
							`⚠️ Could not find paragraphSpacing variable "${data.paragraphSpacingBoundVariable.variableName}"`,
						);
						// Fallback to direct value
						if (data.paragraphSpacing) {
							style.paragraphSpacing = Number.parseFloat(data.paragraphSpacing);
						}
					}
				} else if (data.paragraphSpacing) {
					// No variable binding, set directly
					style.paragraphSpacing = Number.parseFloat(data.paragraphSpacing);
				}

				// Set paragraphIndent - check for variable binding first
				if (data.paragraphIndentBoundVariable?.variableName) {
					const collectionName =
						data.paragraphIndentBoundVariable.collectionName;
					const variable = await findVariableByName(
						data.paragraphIndentBoundVariable.variableName,
						collectionName,
					);
					if (variable) {
						try {
							style.setBoundVariable("paragraphIndent", variable);
							debug(
								`🔗 Bound paragraphIndent variable "${variable.name}" to style "${name}"`,
							);
						} catch (error) {
							console.warn(
								`Could not bind paragraphIndent variable to style "${name}":`,
								error,
							);
							// Fallback to direct value
							if (data.paragraphIndent) {
								style.paragraphIndent = Number.parseFloat(data.paragraphIndent);
							}
						}
					} else {
						console.warn(
							`⚠️ Could not find paragraphIndent variable "${data.paragraphIndentBoundVariable.variableName}"`,
						);
						// Fallback to direct value
						if (data.paragraphIndent) {
							style.paragraphIndent = Number.parseFloat(data.paragraphIndent);
						}
					}
				} else if (data.paragraphIndent) {
					// No variable binding, set directly
					style.paragraphIndent = Number.parseFloat(data.paragraphIndent);
				}

				if (data.textCase) {
					style.textCase = data.textCase;
				}

				if (data.textDecoration) {
					style.textDecoration = data.textDecoration;
				}

				results.success++;
			});
		}

		// Import Effect Styles (Shadows, Blurs)
		if (effect) {
			await processStyleGroup(effect, "", "effect", async (name, data) => {
				const existingStyles = await figma.getLocalEffectStylesAsync();
				let style = existingStyles.find((s) => s.name === name);

				if (!style) {
					style = figma.createEffectStyle();
					style.name = name;
					results.changes.push({
						name,
						type: "Effect Style",
						action: "created",
						newValue: "Created new effect style",
					});
				} else if (isOverrideMode) {
					results.changes.push({
						name,
						type: "Effect Style",
						action: "updated",
						oldValue: "Existing style",
						newValue: "Updated",
					});
				} else {
					results.skipped++;
					return;
				}

				if (data.description) {
					style.description = data.description;
				}

				// Convert effects and handle variable bindings
				if (data.effects && Array.isArray(data.effects)) {
					const convertedEffects = data.effects
						.map((eff: any) => convertDataToEffect(eff))
						.filter(Boolean);
					style.effects = convertedEffects;

					// After setting effects, bind variables if present
					// We need to reconstruct the effects array with bound variables
					const newEffects = await Promise.all(style.effects.map(async (effect, index) => {
						const effectData = data.effects[index];
						if (!effectData) return effect;

						try {
							// Clone the effect and add variable bindings
							const _boundEffect: any = { ...effect };

							// Bind radius variable
							if (effectData.radiusBoundVariable?.variableName) {
								const collectionName =
									effectData.radiusBoundVariable.collectionName;
								const variable = await findVariableByName(
									effectData.radiusBoundVariable.variableName,
									collectionName,
								);
								if (variable) {
									try {
										const boundEffectResult =
											figma.variables.setBoundVariableForEffect(
												effect,
												"radius",
												variable,
											);
										debug(
											`🔗 Bound radius variable "${variable.name}" to effect ${index} in style "${name}"`,
										);
										return boundEffectResult;
									} catch (error) {
										console.warn(
											`Could not bind radius variable to effect ${index}:`,
											error,
										);
									}
								} else {
									console.warn(
										`⚠️ Could not find radius variable "${effectData.radiusBoundVariable.variableName}"`,
									);
								}
							}

							// Bind spread variable (for drop shadows)
							if (effectData.spreadBoundVariable?.variableName) {
								const collectionName =
									effectData.spreadBoundVariable.collectionName;
								const variable = await findVariableByName(
									effectData.spreadBoundVariable.variableName,
									collectionName,
								);
								if (variable) {
									try {
										const boundEffectResult =
											figma.variables.setBoundVariableForEffect(
												effect,
												"spread",
												variable,
											);
										debug(
											`🔗 Bound spread variable "${variable.name}" to effect ${index} in style "${name}"`,
										);
										return boundEffectResult;
									} catch (error) {
										console.warn(
											`Could not bind spread variable to effect ${index}:`,
											error,
										);
									}
								} else {
									console.warn(
										`⚠️ Could not find spread variable "${effectData.spreadBoundVariable.variableName}"`,
									);
								}
							}

							// Bind color variable (for shadows)
							if (effectData.colorBoundVariable?.variableName) {
								const collectionName =
									effectData.colorBoundVariable.collectionName;
								const variable = await findVariableByName(
									effectData.colorBoundVariable.variableName,
									collectionName,
								);
								if (variable) {
									try {
										const boundEffectResult =
											figma.variables.setBoundVariableForEffect(
												effect,
												"color",
												variable,
											);
										debug(
											`🔗 Bound color variable "${variable.name}" to effect ${index} in style "${name}"`,
										);
										return boundEffectResult;
									} catch (error) {
										console.warn(
											`Could not bind color variable to effect ${index}:`,
											error,
										);
									}
								} else {
									console.warn(
										`⚠️ Could not find color variable "${effectData.colorBoundVariable.variableName}"`,
									);
								}
							}
						} catch (error) {
							console.warn(
								`Error binding variables for effect ${index}:`,
								error,
							);
						}

						return effect;
					}));

					// Update the style with the newly bound effects
					style.effects = newEffects;
				}

				results.success++;
			});
		}

		// Import Grid Styles
		if (grid) {
			await processStyleGroup(grid, "", "grid", async (name, data) => {
				const existingStyles = await figma.getLocalGridStylesAsync();
				let style = existingStyles.find((s) => s.name === name);

				if (!style) {
					style = figma.createGridStyle();
					style.name = name;
					results.changes.push({
						name,
						type: "Grid Style",
						action: "created",
						newValue: "Created new grid style",
					});
				} else if (isOverrideMode) {
					results.changes.push({
						name,
						type: "Grid Style",
						action: "updated",
						oldValue: "Existing style",
						newValue: "Updated",
					});
				} else {
					results.skipped++;
					return;
				}

				if (data.description) {
					style.description = data.description;
				}

				// Convert grid layouts
				if (data.layoutGrids && Array.isArray(data.layoutGrids)) {
					style.layoutGrids = data.layoutGrids
						.map((grid: any) => convertDataToLayoutGrid(grid))
						.filter(Boolean);
				}

				results.success++;
			});
		}

		debug("✅ Style import complete:", results);
		return results;
	} catch (error) {
		console.error("❌ Style import error:", error);
		results.failed++;
		const errorMsg = error instanceof Error ? error.message : "Unknown error";
		results.errors.push(`🚨 Critical error during style import: ${errorMsg}`);
		return results;
	}
}

// Helper: Find variable by name (since IDs change on import)
async function findVariableByName(
	variableName: string,
	collectionName?: string,
): Promise<Variable | null> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();

	for (const collection of collections) {
		// If collection name is specified, only search in that collection
		if (collectionName && collection.name !== collectionName) {
			continue;
		}

		for (const variableId of collection.variableIds) {
			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			// Try exact match first
			if (variable.name === variableName) {
				debug(
					`✅ Found variable "${variableName}" in collection "${collection.name}"`,
				);
				return variable;
			}

			// Try alternative formats:
			// 1. Try dot-to-slash conversion (e.g., "background" → "background")
			const alternativeName = variableName.replace(/\./g, "/");
			if (variable.name === alternativeName) {
				debug(
					`✅ Found variable "${alternativeName}" (alternative format) in collection "${collection.name}"`,
				);
				return variable;
			}

			// 2. Try with collection prefix (e.g., "semantics/background")
			if (collectionName) {
				const fullPathSlash = `${collectionName}/${alternativeName}`;
				const fullPathDot = `${collectionName}.${variableName}`;
				if (variable.name === fullPathSlash || variable.name === fullPathDot) {
					debug(
						`✅ Found variable "${variable.name}" (full path) in collection "${collection.name}"`,
					);
					return variable;
				}
			}
		}
	}

	console.warn(
		`⚠️ Could not find variable "${variableName}"${collectionName ? ` in collection "${collectionName}"` : ""}`,
	);
	return null;
}

// Helper: Convert fill data to Figma Paint object
// Returns both the paint and variable binding info (for styles, bindings must be set separately)
async function convertFillToPaint(fill: any, returnBindingInfo = false): Promise<any> {
	if (fill.type === "solid") {
		const color = parseColorToRGBA(fill.color);
		const paint: SolidPaint = {
			type: "SOLID",
			color: { r: color.r, g: color.g, b: color.b },
			opacity: fill.opacity !== undefined ? fill.opacity : 1,
		};

		// Find variable binding if present - find by name since IDs change on import
		let variableBinding = null;
		let variableName = null;
		if (fill.boundVariable?.variableName) {
			variableName = fill.boundVariable.variableName;
			const collectionName = fill.boundVariable.collectionName;
			const variable = await findVariableByName(variableName, collectionName);
			if (variable) {
				variableBinding = { type: "VARIABLE_ALIAS" as const, id: variable.id };
			} else {
				console.warn(`⚠️ Could not find variable "${variableName}" for binding`);
			}
		}

		if (returnBindingInfo) {
			return { paint, variableBinding, variableName };
		}
		return paint;
	}

	if (
		fill.type === "linear" ||
		fill.type === "radial" ||
		fill.type === "angular" ||
		fill.type === "diamond"
	) {
		const gradientType = `GRADIENT_${fill.type.toUpperCase()}` as
			| "GRADIENT_LINEAR"
			| "GRADIENT_RADIAL"
			| "GRADIENT_ANGULAR"
			| "GRADIENT_DIAMOND";

		// Create gradient stops with variable bindings attached
		const gradientStops = await Promise.all(fill.gradientStops.map(async (stop: any) => {
			const color = parseColorToRGBA(stop.color);
			const gradStop: any = {
				position: stop.position,
				color: { r: color.r, g: color.g, b: color.b, a: color.a },
			};

			// Attach variable binding directly to the gradient stop if present
			if (stop.boundVariable?.variableName) {
				const collectionName = stop.boundVariable.collectionName;
				const variable = await findVariableByName(
					stop.boundVariable.variableName,
					collectionName,
				);
				if (variable) {
					// Attach boundVariables structure directly to the gradient stop
					gradStop.boundVariables = {
						color: {
							type: "VARIABLE_ALIAS",
							id: variable.id,
						},
					};
					debug(
						`🔗 Bound variable to gradient stop: ${stop.boundVariable.variableName}`,
					);
				} else {
					console.warn(
						`⚠️ Could not find variable "${stop.boundVariable.variableName}" for gradient stop`,
					);
				}
			}

			return gradStop;
		}));

		const paint: GradientPaint = {
			type: gradientType,
			gradientStops,
			gradientTransform: fill.gradientTransform || [
				[1, 0, 0],
				[0, 1, 0],
			],
			opacity: fill.opacity !== undefined ? fill.opacity : 1,
		};

		if (returnBindingInfo) {
			return {
				paint,
				variableBinding: null,
				variableName: null,
			};
		}
		return paint;
	}

	// Default fallback
	const defaultPaint = {
		type: "SOLID" as const,
		color: { r: 0, g: 0, b: 0 },
		opacity: 1,
	};
	if (returnBindingInfo) {
		return { paint: defaultPaint, variableBinding: null, variableName: null };
	}
	return defaultPaint;
}

// Helper: Convert effect data to Figma Effect
function convertDataToEffect(data: any): Effect | null {
	// Helper to strip 'px' suffix and convert to number
	const parsePixelValue = (value: string | number): number => {
		if (typeof value === "number") return value;
		if (typeof value === "string") {
			return Number.parseFloat(value.replace("px", ""));
		}
		return 0;
	};

	if (data.type === "drop-shadow") {
		return {
			type: "DROP_SHADOW",
			offset: {
				x: parsePixelValue(data.offsetX),
				y: parsePixelValue(data.offsetY),
			},
			radius: parsePixelValue(data.radius),
			spread: parsePixelValue(data.spread || 0),
			color: parseColorToRGBA(data.color ?? "", { r: 0, g: 0, b: 0, a: 1 }),
			visible: data.visible !== false,
			blendMode: "NORMAL",
		} as DropShadowEffect;
	}

	if (data.type === "inner-shadow") {
		return {
			type: "INNER_SHADOW",
			offset: {
				x: parsePixelValue(data.offsetX),
				y: parsePixelValue(data.offsetY),
			},
			radius: parsePixelValue(data.radius),
			color: parseColorToRGBA(data.color ?? "", { r: 0, g: 0, b: 0, a: 1 }),
			visible: data.visible !== false,
			blendMode: "NORMAL",
		} as InnerShadowEffect;
	}

	if (data.type === "layer-blur" || data.type === "background-blur") {
		return {
			type: data.type === "layer-blur" ? "LAYER_BLUR" : "BACKGROUND_BLUR",
			radius: parsePixelValue(data.radius),
			visible: data.visible !== false,
		} as BlurEffect;
	}

	return null;
}

// Helper: Convert grid data to Figma LayoutGrid
function convertDataToLayoutGrid(data: any): LayoutGrid | null {
	const color = parseColorToRGBA(data.color ?? "", {
		r: 0.8,
		g: 0.8,
		b: 0.8,
		a: 0.1,
	});
	const visible = data.visible !== false;
	const pattern = data.pattern || "COLUMNS";

	// GRID pattern uses sectionSize only
	if (pattern === "GRID") {
		return {
			pattern: "GRID",
			sectionSize: data.sectionSize || 8,
			visible,
			color,
		} as LayoutGrid;
	}

	// COLUMNS and ROWS require alignment, gutterSize, count, offset
	return {
		pattern,
		alignment: data.alignment || "STRETCH",
		gutterSize: data.gutterSize ?? 20,
		count: data.count ?? 4,
		offset: data.offset ?? 0,
		visible,
		color,
	} as LayoutGrid;
}
