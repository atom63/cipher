// Export handler - exports Figma variables and styles as design tokens
// Supports nested structures and multiple color formats

/// <reference types="@figma/plugin-typings" />

import { convertColor } from "../libraries/color-converters";
import {
	getBoundVariable,
	getPaintBoundVariable,
	isVariableAlias,
	logBinding,
	resolveVariableReference,
} from "../libraries/variable-binding";

// Helper function to convert paint to structured value
function paintToValue(paint: Paint, colorFormat: string = "oklch"): any {
	if (paint.type === "SOLID") {
		const solidPaint = paint as SolidPaint;
		const result: any = {
			type: "solid",
			color: convertColor(solidPaint.color, colorFormat),
			opacity: paint.opacity,
		};

		// Check if this paint is bound to a variable
		const boundVariable = getPaintBoundVariable(paint);
		if (boundVariable) {
			result.boundVariable = boundVariable;
		}

		return result;
	}

	if (
		paint.type === "GRADIENT_LINEAR" ||
		paint.type === "GRADIENT_RADIAL" ||
		paint.type === "GRADIENT_ANGULAR" ||
		paint.type === "GRADIENT_DIAMOND"
	) {
		const gradientPaint = paint as GradientPaint;
		console.log(
			"🌈 Converting gradient with format:",
			colorFormat,
			"stops:",
			gradientPaint.gradientStops.length,
		);

		// Check if gradient stops have variable bindings
		const stopsWithBindings = gradientPaint.gradientStops.map((stop, index) => {
			const stopData: any = {
				position: Math.round(stop.position * 1000) / 1000,
				color: convertColor(stop.color, colorFormat),
			};

			// Check if this gradient stop color is bound to a variable
			const boundVariable = getBoundVariable(stop, "color");
			if (boundVariable) {
				stopData.boundVariable = boundVariable;
				logBinding(`Gradient stop ${index}`, boundVariable);
			}

			return stopData;
		});

		return {
			type: paint.type.toLowerCase().replace("gradient_", ""),
			gradientStops: stopsWithBindings,
			gradientTransform: gradientPaint.gradientTransform.map((row) =>
				row.map((val) => Math.round(val * 1000) / 1000),
			),
			opacity: paint.opacity,
		};
	}

	if (paint.type === "IMAGE") {
		const imagePaint = paint as ImagePaint;
		return {
			type: "image",
			scaleMode: imagePaint.scaleMode,
			imageTransform: imagePaint.imageTransform,
			scalingFactor: imagePaint.scalingFactor,
			rotation: imagePaint.rotation,
			filters: imagePaint.filters,
			opacity: paint.opacity,
		};
	}

	return { type: "unknown" };
}

// Helper function to convert effect to token value
function effectToToken(effect: Effect): any {
	const effectData: any = {};

	if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
		effectData.type = effect.type.toLowerCase().replace("_", "-");
		effectData.offsetX = `${effect.offset.x}px`;
		effectData.offsetY = `${effect.offset.y}px`;
		effectData.radius = `${effect.radius}px`;
		effectData.spread =
			effect.spread !== undefined ? `${effect.spread}px` : undefined;
		effectData.color = effect.color
			? `rgba(${Math.round(effect.color.r * 255)}, ${Math.round(effect.color.g * 255)}, ${Math.round(effect.color.b * 255)}, ${effect.color.a})`
			: undefined;
		effectData.visible = effect.visible;

		// Check for variable bindings on effect properties
		const radiusBinding = getBoundVariable(effect, "radius");
		if (radiusBinding) {
			effectData.radiusBoundVariable = radiusBinding;
			logBinding("Effect radius", radiusBinding);
		}

		if (effect.type === "DROP_SHADOW") {
			const spreadBinding = getBoundVariable(effect, "spread");
			if (spreadBinding) {
				effectData.spreadBoundVariable = spreadBinding;
				logBinding("Effect spread", spreadBinding);
			}
		}

		const colorBinding = getBoundVariable(effect, "color");
		if (colorBinding) {
			effectData.colorBoundVariable = colorBinding;
			logBinding("Effect color", colorBinding);
		}

		return effectData;
	}

	if (effect.type === "LAYER_BLUR" || effect.type === "BACKGROUND_BLUR") {
		effectData.type = effect.type.toLowerCase().replace("_", "-");
		effectData.radius = `${effect.radius}px`;
		effectData.visible = effect.visible;

		// Check for variable bindings on radius
		const radiusBinding = getBoundVariable(effect, "radius");
		if (radiusBinding) {
			effectData.radiusBoundVariable = radiusBinding;
			logBinding("Blur radius", radiusBinding);
		}

		return effectData;
	}

	return { type: effect.type, visible: effect.visible };
}

// Convert Figma variable value to token value
export function convertVariableValue(
	value: any,
	variable: Variable,
	colorFormat: string = "oklch",
): string {
	// Check if this is a reference to another variable
	if (isVariableAlias(value)) {
		const reference = resolveVariableReference(value.id);
		return reference ?? "unknown-reference";
	}

	// Direct value
	switch (variable.resolvedType) {
		case "COLOR":
			if (typeof value === "object" && "r" in value) {
				return convertColor(value as RGB, colorFormat);
			}
			return String(value);

		case "FLOAT":
			// Add 'px' unit for dimension values
			return `${value}px`;

		case "STRING":
			return String(value);

		case "BOOLEAN":
			return String(value);

		default:
			return String(value);
	}
}

// Convert Figma type to token type with semantic inference
export function figmaTypeToTokenType(
	figmaType: string,
	variableName: string,
): string {
	switch (figmaType) {
		case "COLOR":
			return "color";
		case "FLOAT": {
			// Infer semantic type from variable name/path
			const nameLower = variableName.toLowerCase();

			// Check for radius tokens
			if (nameLower.includes("/radius/") || nameLower.startsWith("radius/")) {
				return "borderRadius";
			}

			// Check for spacing tokens
			if (nameLower.includes("/spacing/") || nameLower.startsWith("spacing/")) {
				return "spacing";
			}

			// Check for size/sizing tokens
			if (
				nameLower.includes("/sizes/") ||
				nameLower.startsWith("sizes/") ||
				nameLower.includes("/size/") ||
				nameLower.startsWith("size/")
			) {
				return "sizing";
			}

			// Default to number for other FLOAT types
			return "number";
		}
		case "STRING":
			return "string";
		case "BOOLEAN":
			return "boolean";
		default:
			return "unknown";
	}
}

/**
 * Gather all local styles (paint, text, effect, grid) into a structured object.
 * Returns null if no styles exist — caller silently skips.
 * This preserves opacity, variable bindings, and effect data that variables alone don't carry.
 */
function gatherStyles(colorFormat: string): any | null {
	const paintStyles = figma.getLocalPaintStyles();
	const textStyles = figma.getLocalTextStyles();
	const effectStyles = figma.getLocalEffectStyles();
	const gridStyles = figma.getLocalGridStyles();

	const totalStyles =
		paintStyles.length +
		textStyles.length +
		effectStyles.length +
		gridStyles.length;

	if (totalStyles === 0) return null;

	const styles: any = {};

	// Paint styles — carries opacity + variable bindings (critical for color-mix)
	if (paintStyles.length > 0) {
		styles.paint = {};
		for (const style of paintStyles) {
			setNested(styles.paint, style.name, {
				id: style.id,
				key: style.key,
				type: "color",
				fills: style.paints.map((paint) => paintToValue(paint, colorFormat)),
				description: style.description || undefined,
				value:
					style.paints.length === 1 && style.paints[0].type === "SOLID"
						? paintToValue(style.paints[0], colorFormat).color
						: style.paints.map((p) => paintToValue(p, colorFormat)),
			});
		}
	}

	// Text styles
	if (textStyles.length > 0) {
		styles.text = {};
		for (const style of textStyles) {
			const data: any = {
				id: style.id,
				key: style.key,
				type: "text",
				fontFamily: style.fontName.family,
				fontStyle: style.fontName.style,
				fontWeight: (style as any).fontWeight,
				fontSize: `${style.fontSize}px`,
				lineHeight:
					typeof style.lineHeight === "object" && "value" in style.lineHeight
						? `${style.lineHeight.value}${style.lineHeight.unit === "PIXELS" ? "px" : style.lineHeight.unit === "PERCENT" ? "%" : ""}`
						: style.lineHeight,
				letterSpacing:
					typeof style.letterSpacing === "object" &&
					"value" in style.letterSpacing
						? `${style.letterSpacing.value}${style.letterSpacing.unit === "PIXELS" ? "px" : style.letterSpacing.unit === "PERCENT" ? "%" : ""}`
						: style.letterSpacing,
				paragraphSpacing: `${style.paragraphSpacing}px`,
				textCase: style.textCase,
				textDecoration: style.textDecoration,
				description: style.description || undefined,
			};

			// Capture variable bindings on text properties
			for (const prop of [
				"fontSize",
				"lineHeight",
				"fontFamily",
				"fontWeight",
				"letterSpacing",
				"paragraphSpacing",
			]) {
				try {
					const bound = (style as any).boundVariables?.[prop];
					if (bound?.id) {
						const variable = figma.variables.getVariableById(bound.id);
						if (variable) {
							const collection = figma.variables.getVariableCollectionById(
								variable.variableCollectionId,
							);
							data[`${prop}BoundVariable`] = {
								type: "variable",
								variableId: variable.id,
								variableName: variable.name,
								collectionName: collection?.name ?? "Unknown",
							};
						}
					}
				} catch (_e) {
					/* skip unreadable bindings */
				}
			}

			setNested(styles.text, style.name, data);
		}
	}

	// Effect styles (shadows, blurs)
	if (effectStyles.length > 0) {
		styles.effect = {};
		for (const style of effectStyles) {
			setNested(styles.effect, style.name, {
				id: style.id,
				key: style.key,
				type: "effect",
				effects: style.effects.map((effect) => effectToToken(effect)),
				description: style.description || undefined,
			});
		}
	}

	// Grid styles
	if (gridStyles.length > 0) {
		styles.grid = {};
		for (const style of gridStyles) {
			setNested(styles.grid, style.name, {
				id: style.id,
				key: style.key,
				type: "grid",
				layoutGrids: style.layoutGrids.map((grid) => ({
					pattern: grid.pattern,
					sectionSize: grid.sectionSize,
					visible: grid.visible,
					color: grid.color
						? `rgba(${Math.round(grid.color.r * 255)}, ${Math.round(grid.color.g * 255)}, ${Math.round(grid.color.b * 255)}, ${grid.color.a})`
						: undefined,
					alignment: "alignment" in grid ? grid.alignment : undefined,
					count: "count" in grid ? grid.count : undefined,
					offset: "offset" in grid ? grid.offset : undefined,
					gutterSize: "gutterSize" in grid ? grid.gutterSize : undefined,
				})),
				description: style.description || undefined,
			});
		}
	}

	return styles;
}

/** Set a value at a nested path (e.g. "folder/subfolder/name") in an object */
function setNested(obj: any, path: string, value: any) {
	const parts = path.split("/");
	const name = parts.pop();
	if (!name) return;
	let current = obj;
	for (const part of parts) {
		if (!current[part]) current[part] = {};
		current = current[part];
	}
	current[name] = value;
}

// Export Figma variables as design tokens
// Supports nested structures - example output:
// {
//   "tokens": {
//     "semantics": {
//       "background": {
//         "primary": { "type": "color", "modes": { "Light": "...", "Dark": "..." } }
//       },
//       "data": {
//         "calories": { "type": "color", "modes": { "Light": "...", "Dark": "..." } }
//       }
//     }
//   }
// }
export async function exportVariablesAsTokens(
	collectionIds: string[],
	colorFormat: string = "oklch",
) {
	try {
		const collections = figma.variables.getLocalVariableCollections();
		const selectedCollections =
			collectionIds.length > 0
				? collections.filter((c) => collectionIds.includes(c.id))
				: collections;

		if (selectedCollections.length === 0) {
			figma.ui.postMessage({
				type: "export-error",
				data: { message: "No collections selected or found" },
			});
			return;
		}

		// Build token structure
		const tokenData: any = {
			$schema: "design-tokens-with-collections",
			$version: "1.0",
			$collections: {},
			tokens: {},
		};

		// Process each collection
		for (const collection of selectedCollections) {
			const collectionKey = collection.name;
			const modeCount = collection.modes.length;
			const variableCount = collection.variableIds.length;

			console.log(
				`📦 Exporting collection: "${collectionKey}" (${variableCount} variables, ${modeCount} mode${modeCount !== 1 ? "s" : ""})`,
			);
			if (modeCount > 1) {
				console.log(
					`  🎨 Modes: ${collection.modes.map((m) => m.name).join(", ")}`,
				);
			}

			// Add collection metadata
			tokenData.$collections[collectionKey] = {
				name: collection.name,
				description: `Exported from Figma on ${new Date().toISOString()}`,
				order: selectedCollections.indexOf(collection) + 1,
				modes: collection.modes.map((m) => m.name),
			};

			// Get all variables in this collection
			const variables = collection.variableIds
				.map((id) => figma.variables.getVariableById(id))
				.filter((v) => v !== null) as Variable[];

			// Initialize tokens object for this collection
			tokenData.tokens[collectionKey] = {};

			// Group variables by path and build nested structure
			for (const variable of variables) {
				// Parse variable name - supports nested paths:
				// - "zinc/50" -> ["zinc", "50"]
				// - "background/primary" -> ["background", "primary"]
				// - "data/calories" -> ["data", "calories"]
				const parts = variable.name.split("/");
				const tokenName = parts.at(-1);
				const parentPath = parts.slice(0, -1); // All parts except the last (the token name)

				// Build nested structure by traversing/creating parent objects
				// Example: "background/primary" creates tokens[collection].background.primary
				let current = tokenData.tokens[collectionKey];
				for (const part of parentPath) {
					if (!current[part]) {
						current[part] = {};
					}
					current = current[part];
				}

				// Check if multi-mode
				const hasModes = collection.modes.length > 1;

				if (hasModes) {
					// Multi-mode token (like semantic tokens with Light/Dark or responsive tokens with mobile/tablet/desktop)
					const modes: any = {};
					for (const mode of collection.modes) {
						const value = variable.valuesByMode[mode.modeId];
						modes[mode.name] = convertVariableValue(
							value,
							variable,
							colorFormat,
						);
					}

					current[tokenName] = {
						type: figmaTypeToTokenType(variable.resolvedType, variable.name),
						collection: collectionKey,
						modes,
					};

					// Add description if present
					if (variable.description) {
						current[tokenName].description = variable.description;
					}
				} else {
					// Single mode token
					const mode = collection.modes[0];
					const value = variable.valuesByMode[mode.modeId];
					const tokenValue = convertVariableValue(value, variable, colorFormat);

					current[tokenName] = {
						value: tokenValue,
						type: figmaTypeToTokenType(variable.resolvedType, variable.name),
						collection: collectionKey,
					};

					// Add description if present
					if (variable.description) {
						current[tokenName].description = variable.description;
					}
				}
			}
		}

		// Gather styles (paint, text, effect, grid) — silently skip if none exist
		const stylesSection = gatherStyles(colorFormat);
		if (stylesSection) {
			tokenData.styles = stylesSection;
		}

		// Send to UI with the format that was used
		figma.ui.postMessage({
			type: "export-complete",
			data: {
				tokens: tokenData,
				collectionCount: selectedCollections.length,
				variableCount: selectedCollections.reduce(
					(sum, c) => sum + c.variableIds.length,
					0,
				),
				format: colorFormat,
			},
		});
	} catch (error) {
		console.error("Export error:", error);
		figma.ui.postMessage({
			type: "export-error",
			data: {
				message:
					error instanceof Error
						? error.message
						: "Unknown error during export",
			},
		});
	}
}

// Export Figma Styles (Paint, Text, Effect, Grid) as structured data
export async function exportStylesAsTokens(
	selectedGroups: { category: string; group: string }[],
	colorFormat: string = "oklch",
) {
	try {
		console.log(
			"✨ exportStylesAsTokens called with colorFormat:",
			colorFormat,
		);

		// Get all local styles
		let paintStyles = figma.getLocalPaintStyles();
		let textStyles = figma.getLocalTextStyles();
		let effectStyles = figma.getLocalEffectStyles();
		let gridStyles = figma.getLocalGridStyles();

		// Filter styles based on selected groups
		if (selectedGroups.length > 0) {
			const matchesSelection = (
				styleName: string,
				category: "paint" | "text" | "effect" | "grid",
			) => {
				const parts = styleName.split("/");
				const rootFolder = parts.length > 1 ? parts[0] : "Root";
				return selectedGroups.some(
					(sel) => sel.category === category && sel.group === rootFolder,
				);
			};

			paintStyles = paintStyles.filter((s) =>
				matchesSelection(s.name, "paint"),
			);
			textStyles = textStyles.filter((s) => matchesSelection(s.name, "text"));
			effectStyles = effectStyles.filter((s) =>
				matchesSelection(s.name, "effect"),
			);
			gridStyles = gridStyles.filter((s) => matchesSelection(s.name, "grid"));
		}

		console.log("📊 Styles to export:", {
			paint: paintStyles.length,
			text: textStyles.length,
			effect: effectStyles.length,
			grid: gridStyles.length,
		});

		const totalStyles =
			paintStyles.length +
			textStyles.length +
			effectStyles.length +
			gridStyles.length;

		if (totalStyles === 0) {
			console.warn("⚠️ No styles found matching selection");
			figma.ui.postMessage({
				type: "export-error",
				data: { message: "No styles found matching your selection." },
			});
			return;
		}

		// Build styles structure
		const stylesData: any = {
			$schema: "figma-styles-export",
			$version: "1.0",
			$exportedAt: new Date().toISOString(),
			$counts: {
				paint: paintStyles.length,
				text: textStyles.length,
				effect: effectStyles.length,
				grid: gridStyles.length,
				total: totalStyles,
			},
			styles: {
				paint: {},
				text: {},
				effect: {},
				grid: {},
			},
		};

		// Process Color Styles (colors, gradients, images)
		for (const style of paintStyles) {
			const parts = style.name.split("/");
			const styleName = parts.at(-1);
			const parentPath = parts.slice(0, -1);

			let current = stylesData.styles.paint;
			for (const part of parentPath) {
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part];
			}

			const paints = style.paints;
			const paintValues = paints.map((paint) =>
				paintToValue(paint, colorFormat),
			);

			current[styleName] = {
				id: style.id,
				key: style.key,
				type: "color",
				fills: paintValues,
				description: style.description || undefined,
				// Legacy format for backwards compatibility
				value:
					paintValues.length === 1 && paintValues[0].type === "solid"
						? paintValues[0].color
						: paintValues,
			};
		}

		// Process Text Styles (typography)
		for (const style of textStyles) {
			const parts = style.name.split("/");
			const styleName = parts.at(-1);
			const parentPath = parts.slice(0, -1);

			let current = stylesData.styles.text;
			for (const part of parentPath) {
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part];
			}

			const textStyleData: any = {
				id: style.id,
				key: style.key,
				type: "text",
				fontFamily: style.fontName.family,
				fontStyle: style.fontName.style,
				fontWeight: (style as any).fontWeight,
				fontSize: `${style.fontSize}px`,
				lineHeight:
					typeof style.lineHeight === "object" && "value" in style.lineHeight
						? `${style.lineHeight.value}${style.lineHeight.unit === "PIXELS" ? "px" : style.lineHeight.unit === "PERCENT" ? "%" : ""}`
						: style.lineHeight,
				letterSpacing:
					typeof style.letterSpacing === "object" &&
					"value" in style.letterSpacing
						? `${style.letterSpacing.value}${style.letterSpacing.unit === "PIXELS" ? "px" : style.letterSpacing.unit === "PERCENT" ? "%" : ""}`
						: style.letterSpacing,
				paragraphSpacing: `${style.paragraphSpacing}px`,
				paragraphIndent: `${style.paragraphIndent}px`,
				textCase: style.textCase,
				textDecoration: style.textDecoration,
				description: style.description || undefined,
			};

			// Check for variable bindings on text style properties
			const boundProperties = [
				"fontSize",
				"lineHeight",
				"fontFamily",
				"fontWeight",
				"letterSpacing",
				"paragraphSpacing",
				"paragraphIndent",
			];
			for (const prop of boundProperties) {
				try {
					const styleAny = style as any;
					if (styleAny.boundVariables?.[prop]?.id) {
						const variable = figma.variables.getVariableById(
							styleAny.boundVariables[prop].id,
						);
						if (variable) {
							const collection = figma.variables.getVariableCollectionById(
								variable.variableCollectionId,
							);
							textStyleData[`${prop}BoundVariable`] = {
								type: "variable",
								variableId: variable.id,
								variableName: variable.name,
								collectionName: collection ? collection.name : "Unknown",
								collectionId: collection ? collection.id : undefined,
							};
							console.log(
								`Text style "${style.name}" ${prop} -> variable: ${variable.name}`,
							);
						}
					}
				} catch (error) {
					console.warn(
						`Could not read ${prop} bound variable for style "${style.name}":`,
						error,
					);
				}
			}

			current[styleName] = textStyleData;
		}

		// Process Effect Styles (shadows, blurs)
		for (const style of effectStyles) {
			const parts = style.name.split("/");
			const styleName = parts.at(-1);
			const parentPath = parts.slice(0, -1);

			let current = stylesData.styles.effect;
			for (const part of parentPath) {
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part];
			}

			current[styleName] = {
				id: style.id,
				key: style.key,
				type: "effect",
				effects: style.effects.map((effect) => effectToToken(effect)),
				description: style.description || undefined,
			};
		}

		// Process Layout grid styles
		for (const style of gridStyles) {
			const parts = style.name.split("/");
			const styleName = parts.at(-1);
			const parentPath = parts.slice(0, -1);

			let current = stylesData.styles.grid;
			for (const part of parentPath) {
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part];
			}

			current[styleName] = {
				id: style.id,
				key: style.key,
				type: "grid",
				layoutGrids: style.layoutGrids.map((grid) => ({
					pattern: grid.pattern,
					sectionSize: grid.sectionSize,
					visible: grid.visible,
					color: grid.color
						? `rgba(${Math.round(grid.color.r * 255)}, ${Math.round(grid.color.g * 255)}, ${Math.round(grid.color.b * 255)}, ${grid.color.a})`
						: undefined,
					alignment: "alignment" in grid ? grid.alignment : undefined,
					count: "count" in grid ? grid.count : undefined,
					offset: "offset" in grid ? grid.offset : undefined,
					gutterSize: "gutterSize" in grid ? grid.gutterSize : undefined,
				})),
				description: style.description || undefined,
			};
		}

		// Send to UI
		console.log("✅ Styles export complete:", stylesData.$counts);
		figma.ui.postMessage({
			type: "styles-export-complete",
			data: {
				styles: stylesData,
				counts: stylesData.$counts,
				format: colorFormat,
			},
		});
	} catch (error) {
		console.error("❌ Style export error:", error);
		figma.ui.postMessage({
			type: "export-error",
			data: {
				message:
					error instanceof Error
						? error.message
						: "Unknown error during style export",
			},
		});
	}
}
