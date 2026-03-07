// This file runs in Figma's main thread (no DOM access)
// It handles communication with the Figma API
//
// Cipher - Figma Design System Plugin
// Author: You Zhang (ATOM63)

/// <reference types="@figma/plugin-typings" />

import { generateCSS } from "./handlers/css-generator";
import {
	exportStylesAsTokens,
	exportVariablesAsTokens,
} from "./handlers/export-handler";
import {
	createVariablesFromTokens,
	importStylesFromTokens,
} from "./handlers/import-handler";
// Import modules
import { parseJSON } from "./parsers/token-parsers";
import type { PluginSettings, UIToMainMessage } from "./types/messages";

// Show the plugin UI (resizable by default)
figma.showUI(__html__, {
	width: 800,
	height: 700,
	title: "Cipher",
	themeColors: true,
});

// Group styles by root folder, returning name + count pairs
function groupStylesByRoot(
	styles: { name: string }[],
): { name: string; count: number }[] {
	const groups = new Map<string, number>();
	for (const style of styles) {
		const parts = style.name.split("/");
		const rootFolder = parts.length > 1 ? parts[0] : "Root";
		groups.set(rootFolder, (groups.get(rootFolder) ?? 0) + 1);
	}
	return Array.from(groups, ([name, count]) => ({ name, count })).sort((a, b) =>
		a.name.localeCompare(b.name),
	);
}

// Settings persistence via clientStorage
const DEFAULT_SETTINGS: PluginSettings = {
	colorFormat: "oklch",
	lastExportTab: "variables",
};

async function loadSettings(): Promise<PluginSettings> {
	const stored = await figma.clientStorage.getAsync("settings");
	return { ...DEFAULT_SETTINGS, ...stored };
}

async function saveSettings(
	partial: Partial<PluginSettings>,
): Promise<PluginSettings> {
	const current = await loadSettings();
	const updated = { ...current, ...partial };
	await figma.clientStorage.setAsync("settings", updated);
	return updated;
}

// Handle messages from the UI
figma.ui.onmessage = async (msg: UIToMainMessage) => {
	switch (msg.type) {
		case "parse-tokens": {
			const { content } = msg.data;
			const parsed = parseJSON(content);
			figma.ui.postMessage({
				type: "tokens-parsed",
				data: parsed,
			});
			break;
		}

		case "get-collections": {
			const collections = figma.variables.getLocalVariableCollections();
			const collectionsData = collections
				.map((c) => ({
					id: c.id,
					name: c.name,
					variableCount: c.variableIds.length,
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
			figma.ui.postMessage({
				type: "collections-list",
				data: { collections: collectionsData },
			});
			break;
		}

		case "get-styles": {
			const paintStyles = figma.getLocalPaintStyles();
			const textStyles = figma.getLocalTextStyles();
			const effectStyles = figma.getLocalEffectStyles();
			const gridStyles = figma.getLocalGridStyles();

			const stylesByCategory = {
				paint: groupStylesByRoot(paintStyles),
				text: groupStylesByRoot(textStyles),
				effect: groupStylesByRoot(effectStyles),
				grid: groupStylesByRoot(gridStyles),
			};

			figma.ui.postMessage({
				type: "styles-list",
				data: {
					stylesByCategory,
					totalCounts: {
						paint: paintStyles.length,
						text: textStyles.length,
						effect: effectStyles.length,
						grid: gridStyles.length,
						total:
							paintStyles.length +
							textStyles.length +
							effectStyles.length +
							gridStyles.length,
					},
				},
			});
			break;
		}

		case "get-style-details": {
			const paintStyles = figma.getLocalPaintStyles();
			const textStyles = figma.getLocalTextStyles();
			const effectStyles = figma.getLocalEffectStyles();
			const gridStyles = figma.getLocalGridStyles();

			// Helper: convert Figma RGB to hex string
			const rgbToHex = (c: RGB | RGBA) => {
				const r = Math.round(c.r * 255);
				const g = Math.round(c.g * 255);
				const b = Math.round(c.b * 255);
				return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
			};

			// Helper: resolve a VariableAlias to its variable name
			const resolveVarName = (
				alias: { id: string } | undefined,
			): string | undefined => {
				if (!alias || !alias.id) return undefined;
				try {
					const v = figma.variables.getVariableById(alias.id);
					return v ? v.name : undefined;
				} catch (err) {
					console.warn("[Cipher] resolveVarName error for id:", alias.id, err);
					return undefined;
				}
			};

			const styles: {
				id: string;
				name: string;
				category: string;
				description: string;
				preview: any;
			}[] = [];

			for (const s of paintStyles) {
				const paints: any[] = [];

				for (let pi = 0; pi < s.paints.length; pi++) {
					const paint = s.paints[pi];
					const bv = (paint as any).boundVariables || {};

					if (paint.type === "SOLID") {
						const solid = paint as SolidPaint;
						paints.push({
							paintType: "SOLID",
							color: rgbToHex(solid.color),
							opacity: solid.opacity ?? 1,
							colorVariable: resolveVarName(bv.color),
							opacityVariable: resolveVarName(bv.opacity),
						});
					} else if (paint.type.startsWith("GRADIENT_")) {
						const grad = paint as GradientPaint;
						const stops = grad.gradientStops.map((stop) => {
							// Variable bindings are directly on each stop object
							const stopBv = (stop as any).boundVariables || {};
							return {
								color: rgbToHex(stop.color),
								position: Math.round(stop.position * 100) / 100,
								variable: resolveVarName(stopBv.color),
							};
						});
						paints.push({
							paintType: paint.type,
							opacity: grad.opacity ?? 1,
							stops,
							opacityVariable: resolveVarName(bv.opacity),
						});
					} else if (paint.type === "IMAGE") {
						paints.push({
							paintType: "IMAGE",
							opacity: (paint as ImagePaint).opacity ?? 1,
						});
					} else {
						paints.push({
							paintType: paint.type,
							opacity: (paint as any).opacity ?? 1,
						});
					}
				}
				styles.push({
					id: s.id,
					name: s.name,
					category: "paint",
					description: s.description,
					preview: { type: "paint", paints },
				});
			}

			for (const s of textStyles) {
				const lh =
					typeof s.lineHeight === "object" && "value" in s.lineHeight
						? `${s.lineHeight.value}${s.lineHeight.unit === "PIXELS" ? "px" : s.lineHeight.unit === "PERCENT" ? "%" : ""}`
						: "auto";
				const bv = (s as any).boundVariables || {};
				const variables: Record<string, string> = {};
				if (bv.fontSize) {
					const n = resolveVarName(bv.fontSize);
					if (n) variables.fontSize = n;
				}
				if (bv.lineHeight) {
					const n = resolveVarName(bv.lineHeight);
					if (n) variables.lineHeight = n;
				}
				if (bv.letterSpacing) {
					const n = resolveVarName(bv.letterSpacing);
					if (n) variables.letterSpacing = n;
				}
				if (bv.paragraphSpacing) {
					const n = resolveVarName(bv.paragraphSpacing);
					if (n) variables.paragraphSpacing = n;
				}
				styles.push({
					id: s.id,
					name: s.name,
					category: "text",
					description: s.description,
					preview: {
						type: "text",
						fontFamily: s.fontName.family,
						fontStyle: s.fontName.style,
						fontSize: `${s.fontSize}px`,
						lineHeight: lh,
						variables:
							Object.keys(variables).length > 0 ? variables : undefined,
					},
				});
			}

			for (const s of effectStyles) {
				const styleEffectBv = (s as any).boundVariables?.effects || [];
				const effects = s.effects.map((e, ei) => {
					// Merge effect-level and style-level bindings
					const effectBv = (e as any).boundVariables || {};
					const styleEBv = styleEffectBv[ei] || {};
					const bv = { ...effectBv, ...styleEBv };
					if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
						const shadow = e as DropShadowEffect;
						return {
							effectType: e.type,
							description: `${e.type === "INNER_SHADOW" ? "inset " : ""}${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px${shadow.spread ? ` ${shadow.spread}px` : ""}`,
							color: rgbToHex(shadow.color),
							colorVariable: resolveVarName(bv.color),
							radiusVariable: resolveVarName(bv.radius),
							spreadVariable: resolveVarName(bv.spread),
						};
					}
					if (e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR") {
						return {
							effectType: e.type,
							description: `${e.type === "LAYER_BLUR" ? "blur" : "bg blur"} ${(e as BlurEffect).radius}px`,
							radiusVariable: resolveVarName(bv.radius),
						};
					}
					return {
						effectType: e.type,
						description: e.type.toLowerCase().replace(/_/g, " "),
					};
				});
				styles.push({
					id: s.id,
					name: s.name,
					category: "effect",
					description: s.description,
					preview: { type: "effect", effects },
				});
			}

			for (const s of gridStyles) {
				const patterns = s.layoutGrids.map(
					(g) => `${g.pattern}${g.sectionSize ? ` ${g.sectionSize}px` : ""}`,
				);
				styles.push({
					id: s.id,
					name: s.name,
					category: "grid",
					description: s.description,
					preview: { type: "grid", patterns },
				});
			}

			figma.ui.postMessage({
				type: "style-details-list",
				data: {
					styles,
					counts: {
						paint: paintStyles.length,
						text: textStyles.length,
						effect: effectStyles.length,
						grid: gridStyles.length,
						total:
							paintStyles.length +
							textStyles.length +
							effectStyles.length +
							gridStyles.length,
					},
				},
			});
			break;
		}

		case "delete-styles": {
			const { styleIds, category } = msg.data;
			let success = 0;
			let failed = 0;
			for (const id of styleIds) {
				try {
					let style: BaseStyle | null = null;
					if (category === "paint")
						style = figma.getStyleById(id) as PaintStyle | null;
					else if (category === "text")
						style = figma.getStyleById(id) as TextStyle | null;
					else if (category === "effect")
						style = figma.getStyleById(id) as EffectStyle | null;
					else if (category === "grid")
						style = figma.getStyleById(id) as GridStyle | null;
					if (style) {
						style.remove();
						success++;
					} else {
						failed++;
					}
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "styles-deleted",
				data: { success, failed },
			});
			figma.notify(
				`Deleted ${success} style${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "rename-styles": {
			const { renames } = msg.data;
			let success = 0;
			let failed = 0;
			for (const { id, newName } of renames) {
				try {
					const style = figma.getStyleById(id);
					if (style) {
						style.name = newName;
						success++;
					} else {
						failed++;
					}
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "styles-renamed",
				data: { success, failed },
			});
			figma.notify(
				`Renamed ${success} style${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "scan-rebind": {
			const { styleIds } = msg.data;
			// Build a map of all local COLOR variables with their resolved hex values per mode
			const allVars = figma.variables.getLocalVariables("COLOR");
			const varColorMap: { id: string; name: string; colors: string[] }[] = [];
			for (const v of allVars) {
				const collection = figma.variables.getVariableCollectionById(
					v.variableCollectionId,
				);
				if (!collection) continue;
				const colors: string[] = [];
				for (const modeId of collection.modes.map((m) => m.modeId)) {
					const val = v.valuesByMode[modeId];
					if (val && typeof val === "object" && "r" in val) {
						const c = val as RGBA;
						const r = Math.round(c.r * 255);
						const g = Math.round(c.g * 255);
						const b = Math.round(c.b * 255);
						colors.push(
							`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
						);
					}
				}
				varColorMap.push({ id: v.id, name: v.name, colors });
			}

			const suggestions: any[] = [];

			// Helper to find matching variable by hex color
			const findByColor = (hex: string) => {
				const lower = hex.toLowerCase();
				return varColorMap.find((v) =>
					v.colors.some((c) => c.toLowerCase() === lower),
				);
			};
			// Helper to find matching variable by name similarity
			const findByName = (styleName: string) => {
				// Extract last segment of style name path
				const parts = styleName.split("/");
				const leaf = parts[parts.length - 1]
					.toLowerCase()
					.replace(/[\s-_]/g, "");
				return varColorMap.find((v) => {
					const vParts = v.name.split("/");
					const vLeaf = vParts[vParts.length - 1]
						.toLowerCase()
						.replace(/[\s-_]/g, "");
					return (
						vLeaf === leaf ||
						v.name.toLowerCase().replace(/[\s-_/]/g, "") ===
							styleName.toLowerCase().replace(/[\s-_/]/g, "")
					);
				});
			};

			const rgbToHex = (c: RGB | RGBA) => {
				const r = Math.round(c.r * 255);
				const g = Math.round(c.g * 255);
				const b = Math.round(c.b * 255);
				return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
			};

			for (const styleId of styleIds) {
				const style = figma.getStyleById(styleId);
				if (!style) continue;

				if (style.type === "PAINT") {
					const paintStyle = style as PaintStyle;
					paintStyle.paints.forEach((paint, pi) => {
						if (paint.type === "SOLID") {
							const bv = (paint as any).boundVariables || {};
							if (!bv.color) {
								// Unbound solid — try to match
								const hex = rgbToHex((paint as SolidPaint).color);
								const match = findByColor(hex) || findByName(paintStyle.name);
								if (match) {
									suggestions.push({
										styleId,
										styleName: paintStyle.name,
										field: `solid:${pi}`,
										currentColor: hex,
										suggestedVariableId: match.id,
										suggestedVariableName: match.name,
										matchType: findByColor(hex) ? "exact" : "name",
									});
								}
							}
						} else if (paint.type.startsWith("GRADIENT_")) {
							const grad = paint as GradientPaint;
							grad.gradientStops.forEach((stop, si) => {
								const stopBv = (stop as any).boundVariables || {};
								if (!stopBv.color) {
									const hex = rgbToHex(stop.color);
									const match = findByColor(hex);
									if (match) {
										suggestions.push({
											styleId,
											styleName: paintStyle.name,
											field: `stop:${pi}:${si}`,
											currentColor: hex,
											suggestedVariableId: match.id,
											suggestedVariableName: match.name,
											matchType: "exact",
										});
									}
								}
							});
						}
					});
				} else if (style.type === "EFFECT") {
					const effectStyle = style as EffectStyle;
					effectStyle.effects.forEach((e, ei) => {
						if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
							const bv = (e as any).boundVariables || {};
							if (!bv.color) {
								const hex = rgbToHex((e as DropShadowEffect).color);
								const match = findByColor(hex);
								if (match) {
									suggestions.push({
										styleId,
										styleName: effectStyle.name,
										field: `effect:${ei}`,
										currentColor: hex,
										suggestedVariableId: match.id,
										suggestedVariableName: match.name,
										matchType: "exact",
									});
								}
							}
						}
					});
				}
			}

			figma.ui.postMessage({
				type: "rebind-suggestions",
				data: { suggestions },
			});
			break;
		}

		case "apply-rebind": {
			const { bindings } = msg.data;
			let success = 0;
			let failed = 0;
			const applied: { styleId: string; field: string }[] = [];

			for (const { styleId, field, variableId } of bindings) {
				try {
					const style = figma.getStyleById(styleId);
					const variable = figma.variables.getVariableById(variableId);
					if (!style || !variable) {
						failed++;
						continue;
					}

					if (style.type === "PAINT") {
						const paintStyle = style as PaintStyle;
						const paints = [...paintStyle.paints];

						if (field.startsWith("solid:")) {
							const pi = parseInt(field.split(":")[1], 10);
							if (paints[pi]?.type === "SOLID") {
								paints[pi] = figma.variables.setBoundVariableForPaint(
									paints[pi] as SolidPaint,
									"color",
									variable,
								);
								paintStyle.paints = paints;
								success++;
								applied.push({ styleId, field });
							} else {
								failed++;
							}
						} else if (field.startsWith("stop:")) {
							const [, piStr, siStr] = field.split(":");
							const pi = parseInt(piStr, 10);
							const si = parseInt(siStr, 10);
							const paint = paints[pi];
							if (paint?.type.startsWith("GRADIENT_")) {
								const grad = paint as GradientPaint;
								const stops = [...grad.gradientStops];
								const stop = stops[si];
								if (stop) {
									const alias = figma.variables.createVariableAlias(variable);
									stops[si] = {
										...stop,
										color: stop.color,
										position: stop.position,
										boundVariables: { color: alias },
									} as any;
									paints[pi] = { ...grad, gradientStops: stops } as any;
									paintStyle.paints = paints;
									success++;
									applied.push({ styleId, field });
								} else {
									failed++;
								}
							} else {
								failed++;
							}
						} else {
							failed++;
						}
					} else if (style.type === "EFFECT") {
						const effectStyle = style as EffectStyle;
						if (field.startsWith("effect:")) {
							const ei = parseInt(field.split(":")[1], 10);
							const effects = [...effectStyle.effects];
							if (effects[ei]) {
								effects[ei] = figma.variables.setBoundVariableForEffect(
									effects[ei],
									"color",
									variable,
								);
								effectStyle.effects = effects;
								success++;
								applied.push({ styleId, field });
							} else {
								failed++;
							}
						} else {
							failed++;
						}
					} else {
						failed++;
					}
				} catch (err) {
					console.error("[Cipher] rebind error:", err);
					failed++;
				}
			}

			figma.ui.postMessage({
				type: "rebind-applied",
				data: { success, failed, applied },
			});
			figma.notify(
				`Rebound ${success} color${success !== 1 ? "s" : ""} to variables${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "undo-rebind": {
			const { bindings } = msg.data;
			let success = 0;
			let failed = 0;

			for (const { styleId, field } of bindings) {
				try {
					const style = figma.getStyleById(styleId);
					if (!style) {
						failed++;
						continue;
					}

					if (style.type === "PAINT") {
						const paintStyle = style as PaintStyle;
						const paints = [...paintStyle.paints];

						if (field.startsWith("solid:")) {
							const pi = parseInt(field.split(":")[1], 10);
							if (paints[pi]?.type === "SOLID") {
								paints[pi] = figma.variables.setBoundVariableForPaint(
									paints[pi] as SolidPaint,
									"color",
									null as any,
								);
								paintStyle.paints = paints;
								success++;
							} else {
								failed++;
							}
						} else if (field.startsWith("stop:")) {
							const [, piStr, siStr] = field.split(":");
							const pi = parseInt(piStr, 10);
							const si = parseInt(siStr, 10);
							const paint = paints[pi];
							if (paint?.type.startsWith("GRADIENT_")) {
								const grad = paint as GradientPaint;
								const stops = [...grad.gradientStops];
								const stop = stops[si];
								if (stop) {
									stops[si] = {
										color: stop.color,
										position: stop.position,
									} as any;
									paints[pi] = { ...grad, gradientStops: stops } as any;
									paintStyle.paints = paints;
									success++;
								} else {
									failed++;
								}
							} else {
								failed++;
							}
						} else {
							failed++;
						}
					} else if (style.type === "EFFECT") {
						const effectStyle = style as EffectStyle;
						if (field.startsWith("effect:")) {
							const ei = parseInt(field.split(":")[1], 10);
							const effects = [...effectStyle.effects];
							if (effects[ei]) {
								effects[ei] = figma.variables.setBoundVariableForEffect(
									effects[ei],
									"color",
									null as any,
								);
								effectStyle.effects = effects;
								success++;
							} else {
								failed++;
							}
						} else {
							failed++;
						}
					} else {
						failed++;
					}
				} catch (err) {
					console.error("[Cipher] undo-rebind error:", err);
					failed++;
				}
			}

			figma.ui.postMessage({
				type: "rebind-undone",
				data: { success, failed },
			});
			figma.notify(
				`Unbound ${success} color${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "get-variables": {
			const collections = figma.variables.getLocalVariableCollections();
			const filterIds = msg.data?.collectionIds;
			const filteredCollections = filterIds
				? collections.filter((c) => filterIds.includes(c.id))
				: collections;

			const collectionsData = filteredCollections
				.map((c) => ({
					id: c.id,
					name: c.name,
					variableCount: c.variableIds.length,
				}))
				.sort((a, b) => a.name.localeCompare(b.name));

			const variables: {
				id: string;
				name: string;
				resolvedType: string;
				collectionId: string;
				collectionName: string;
				valuesByMode: Record<string, string>;
				description: string;
			}[] = [];

			for (const collection of filteredCollections) {
				const modeNames = new Map(
					collection.modes.map((m) => [m.modeId, m.name]),
				);
				for (const varId of collection.variableIds) {
					const variable = figma.variables.getVariableById(varId);
					if (!variable) continue;

					const valuesByMode: Record<string, string> = {};
					for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
						const modeName = modeNames.get(modeId) || modeId;
						if (
							typeof value === "object" &&
							value !== null &&
							"type" in value &&
							value.type === "VARIABLE_ALIAS"
						) {
							const refVar = figma.variables.getVariableById(
								(value as VariableAlias).id,
							);
							valuesByMode[modeName] = refVar
								? `{${refVar.name}}`
								: String(value);
						} else if (
							typeof value === "object" &&
							value !== null &&
							"r" in value
						) {
							const c = value as RGBA;
							const r = Math.round(c.r * 255);
							const g = Math.round(c.g * 255);
							const b = Math.round(c.b * 255);
							valuesByMode[modeName] =
								c.a < 1
									? `rgba(${r}, ${g}, ${b}, ${c.a.toFixed(2)})`
									: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
						} else {
							valuesByMode[modeName] = String(value);
						}
					}

					variables.push({
						id: variable.id,
						name: variable.name,
						resolvedType: variable.resolvedType,
						collectionId: collection.id,
						collectionName: collection.name,
						valuesByMode,
						description: variable.description,
					});
				}
			}

			figma.ui.postMessage({
				type: "variables-list",
				data: { variables, collections: collectionsData },
			});
			break;
		}

		case "rename-variables": {
			const { renames } = msg.data;
			let success = 0;
			let failed = 0;
			const previousNames: { id: string; oldName: string }[] = [];
			for (const { id, newName } of renames) {
				try {
					const variable = figma.variables.getVariableById(id);
					if (variable) {
						previousNames.push({ id, oldName: variable.name });
						variable.name = newName;
						success++;
					} else {
						failed++;
					}
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "variables-renamed",
				data: { success, failed, previousNames },
			});
			figma.notify(
				`Renamed ${success} variable${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "delete-variables": {
			const { variableIds } = msg.data;
			let success = 0;
			let failed = 0;
			const snapshots: {
				name: string;
				resolvedType: string;
				collectionId: string;
				description: string;
				valuesByMode: Record<string, any>;
			}[] = [];

			for (const id of variableIds) {
				try {
					const variable = figma.variables.getVariableById(id);
					if (variable) {
						// Snapshot before deleting for undo
						const rawValues: Record<string, any> = {};
						for (const [modeId, value] of Object.entries(
							variable.valuesByMode,
						)) {
							rawValues[modeId] = value;
						}
						snapshots.push({
							name: variable.name,
							resolvedType: variable.resolvedType,
							collectionId: variable.variableCollectionId,
							description: variable.description,
							valuesByMode: rawValues,
						});
						variable.remove();
						success++;
					} else {
						failed++;
					}
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "variables-deleted",
				data: { success, failed, snapshots },
			});
			figma.notify(
				`Deleted ${success} variable${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "restore-variables": {
			const { snapshots } = msg.data;
			let success = 0;
			let failed = 0;
			for (const snap of snapshots) {
				try {
					const collection = figma.variables.getVariableCollectionById(
						snap.collectionId,
					);
					if (!collection) {
						failed++;
						continue;
					}

					const figmaType = snap.resolvedType as
						| "COLOR"
						| "FLOAT"
						| "STRING"
						| "BOOLEAN";
					const variable = figma.variables.createVariable(
						snap.name,
						collection,
						figmaType,
					);
					variable.description = snap.description;

					for (const [modeId, value] of Object.entries(snap.valuesByMode)) {
						try {
							variable.setValueForMode(modeId, value);
						} catch {
							// Mode may no longer exist
						}
					}
					success++;
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "variables-restored",
				data: { success, failed },
			});
			figma.notify(
				`Restored ${success} variable${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "move-variables": {
			const { variableIds, targetCollectionId } = msg.data;
			const targetCollection =
				figma.variables.getVariableCollectionById(targetCollectionId);
			if (!targetCollection) {
				figma.ui.postMessage({
					type: "variables-moved",
					data: {
						success: 0,
						failed: variableIds.length,
						previousCollections: [],
					},
				});
				figma.notify("Target collection not found");
				break;
			}

			let success = 0;
			let failed = 0;
			const previousCollections: { id: string; collectionId: string }[] = [];

			// Build target mode map: match modes by name
			const targetModeMap = new Map(
				targetCollection.modes.map((m) => [m.name, m.modeId]),
			);

			for (const id of variableIds) {
				try {
					const variable = figma.variables.getVariableById(id);
					if (!variable) {
						failed++;
						continue;
					}
					if (variable.variableCollectionId === targetCollectionId) {
						continue;
					} // Already there

					const sourceCollection = figma.variables.getVariableCollectionById(
						variable.variableCollectionId,
					);
					if (!sourceCollection) {
						failed++;
						continue;
					}

					const sourceModeMap = new Map(
						sourceCollection.modes.map((m) => [m.modeId, m.name]),
					);

					previousCollections.push({
						id,
						collectionId: variable.variableCollectionId,
					});

					// Create new variable in target collection
					const newVar = figma.variables.createVariable(
						variable.name,
						targetCollection,
						variable.resolvedType as "COLOR" | "FLOAT" | "STRING" | "BOOLEAN",
					);
					newVar.description = variable.description;

					// Copy values, matching modes by name
					for (const [sourceModeId, value] of Object.entries(
						variable.valuesByMode,
					)) {
						const modeName = sourceModeMap.get(sourceModeId);
						if (!modeName) continue;
						const targetModeId = targetModeMap.get(modeName);
						if (targetModeId) {
							try {
								newVar.setValueForMode(targetModeId, value);
							} catch {}
						}
					}

					// Remove original
					variable.remove();
					success++;
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "variables-moved",
				data: { success, failed, previousCollections },
			});
			figma.notify(
				`Moved ${success} variable${success !== 1 ? "s" : ""} to "${targetCollection.name}"${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "duplicate-variables": {
			const { variableIds } = msg.data;
			let success = 0;
			let failed = 0;
			const newVariableIds: string[] = [];

			for (const id of variableIds) {
				try {
					const variable = figma.variables.getVariableById(id);
					if (!variable) {
						failed++;
						continue;
					}

					const collection = figma.variables.getVariableCollectionById(
						variable.variableCollectionId,
					);
					if (!collection) {
						failed++;
						continue;
					}

					const newVar = figma.variables.createVariable(
						`${variable.name} copy`,
						collection,
						variable.resolvedType as "COLOR" | "FLOAT" | "STRING" | "BOOLEAN",
					);
					newVar.description = variable.description;

					for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
						try {
							newVar.setValueForMode(modeId, value);
						} catch {}
					}

					newVariableIds.push(newVar.id);
					success++;
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "variables-duplicated",
				data: { success, failed, newVariableIds },
			});
			figma.notify(
				`Duplicated ${success} variable${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "update-variable-values": {
			const { updates } = msg.data;
			let success = 0;
			let failed = 0;
			const previousValues: {
				id: string;
				valuesByMode: Record<string, any>;
			}[] = [];

			for (const { id, valuesByMode } of updates) {
				try {
					const variable = figma.variables.getVariableById(id);
					if (!variable) {
						failed++;
						continue;
					}

					const collection = figma.variables.getVariableCollectionById(
						variable.variableCollectionId,
					);
					if (!collection) {
						failed++;
						continue;
					}

					// Build mode name → mode ID map for resolving UI keys
					const modeNameToId = new Map(
						collection.modes.map((m) => [m.name, m.modeId]),
					);

					// Snapshot previous values (using mode names as keys for undo roundtrip)
					const prevValues: Record<string, any> = {};
					const modeIdToName = new Map(
						collection.modes.map((m) => [m.modeId, m.name]),
					);
					for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
						const modeName = modeIdToName.get(modeId) || modeId;
						prevValues[modeName] = value;
					}
					previousValues.push({ id, valuesByMode: prevValues });

					// Apply new values — keys may be mode names (from UI) or mode IDs
					for (const [key, rawValue] of Object.entries(valuesByMode)) {
						const modeId = modeNameToId.get(key) || key;
						try {
							let value: any = rawValue;

							// Handle alias references: {variable/name} → VARIABLE_ALIAS
							if (
								typeof rawValue === "string" &&
								rawValue.startsWith("{") &&
								rawValue.endsWith("}")
							) {
								const refName = rawValue.slice(1, -1);
								const allVars = figma.variables.getLocalVariables();
								const refVar = allVars.find((v) => v.name === refName);
								if (refVar) {
									value = figma.variables.createVariableAlias(refVar);
								} else {
									continue; // Skip unresolved alias
								}
							} else if (typeof rawValue === "object" && rawValue !== null) {
								// Already a structured value (e.g. from undo snapshot) — pass through
								value = rawValue;
							} else if (
								variable.resolvedType === "FLOAT" &&
								typeof rawValue === "string"
							) {
								value = parseFloat(rawValue);
								if (Number.isNaN(value)) continue;
							} else if (
								variable.resolvedType === "BOOLEAN" &&
								typeof rawValue === "string"
							) {
								value = rawValue.toLowerCase() === "true";
							} else if (
								variable.resolvedType === "COLOR" &&
								typeof rawValue === "string"
							) {
								const hex = rawValue.trim();
								if (
									hex.startsWith("#") &&
									(hex.length === 7 || hex.length === 9)
								) {
									const r = parseInt(hex.slice(1, 3), 16) / 255;
									const g = parseInt(hex.slice(3, 5), 16) / 255;
									const b = parseInt(hex.slice(5, 7), 16) / 255;
									const a =
										hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
									value = { r, g, b, a };
								} else {
									continue;
								}
							}
							variable.setValueForMode(modeId, value);
						} catch {}
					}
					success++;
				} catch {
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "variable-values-updated",
				data: { success, failed, previousValues },
			});
			figma.notify(
				`Updated ${success} variable${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "create-variables": {
			const { tokens, collectionName, importMode = "import" } = msg.data;
			// Note: tokens are already filtered by selected collections in the UI
			const results = await createVariablesFromTokens(
				tokens,
				collectionName,
				importMode,
			);

			figma.ui.postMessage({
				type: "variables-created",
				data: results,
			});

			const actionVerb = importMode === "override" ? "Updated" : "Created";
			const skipMsg =
				results.skipped > 0 ? ` (${results.skipped} skipped)` : "";
			const failMsg = results.failed > 0 ? ` (${results.failed} failed)` : "";
			figma.notify(
				`✅ ${actionVerb} ${results.success} variables${skipMsg}${failMsg}`,
			);
			break;
		}

		case "undo-import": {
			const { entries } = msg.data;
			let success = 0;
			let failed = 0;

			// Process in reverse order: undo updates first, then delete created variables
			// This handles reference dependencies correctly
			const updates = entries.filter((e: any) => e.action === "updated");
			const created = entries.filter((e: any) => e.action === "created");

			// Restore updated variables to their previous values
			for (const entry of updates) {
				try {
					const variable = figma.variables.getVariableById(entry.variableId);
					if (variable && entry.previousValues) {
						for (const [modeId, value] of Object.entries(
							entry.previousValues,
						)) {
							try {
								variable.setValueForMode(modeId, value);
							} catch {
								// Mode may no longer exist
							}
						}
						if (entry.previousDescription !== undefined) {
							variable.description = entry.previousDescription;
						}
						success++;
					} else {
						failed++;
					}
				} catch {
					failed++;
				}
			}

			// Delete created variables
			for (const entry of created) {
				try {
					const variable = figma.variables.getVariableById(entry.variableId);
					if (variable) {
						variable.remove();
						success++;
					} else {
						failed++;
					}
				} catch {
					failed++;
				}
			}

			figma.ui.postMessage({
				type: "import-undone",
				data: { success, failed },
			});
			figma.notify(
				`Undo: reverted ${success} variable${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "resize-window": {
			const { mode } = msg.data;
			if (mode === "compact") {
				figma.ui.resize(500, 700);
			} else {
				figma.ui.resize(800, 700);
			}
			break;
		}

		case "export-variables": {
			const { collectionIds, colorFormat } = msg.data;
			await exportVariablesAsTokens(collectionIds, colorFormat || "oklch");
			break;
		}

		case "export-css": {
			try {
				const {
					collectionIds,
					colorFormat,
					includeThemeInline,
					includeColorMix,
				} = msg.data;
				const result = generateCSS({
					collectionIds,
					colorFormat: colorFormat || "oklch",
					includeThemeInline: includeThemeInline ?? false,
					includeColorMix: includeColorMix ?? false,
				});
				figma.ui.postMessage({
					type: "css-export-complete",
					data: result,
				});
			} catch (error) {
				figma.ui.postMessage({
					type: "export-error",
					data: {
						message:
							error instanceof Error ? error.message : "CSS export failed",
					},
				});
			}
			break;
		}

		case "export-styles": {
			console.log("🎨 Export styles message received, data:", msg.data);
			const { selectedGroups, colorFormat } = msg.data;
			console.log(
				"📦 Extracted colorFormat:",
				colorFormat,
				"selectedGroups count:",
				selectedGroups?.length,
			);
			await exportStylesAsTokens(selectedGroups || [], colorFormat || "oklch");
			break;
		}

		case "import-styles": {
			console.log("📥 Import styles message received");
			const { stylesData, selectedGroups, importMode } = msg.data;
			const results = await importStylesFromTokens(
				stylesData,
				selectedGroups || [],
				importMode || "import",
			);

			figma.ui.postMessage({
				type: "import-complete",
				data: results,
			});
			break;
		}

		case "load-settings": {
			const settings = await loadSettings();
			figma.ui.postMessage({
				type: "settings-loaded",
				data: settings,
			});
			break;
		}

		case "save-settings": {
			await saveSettings(msg.data);
			break;
		}

		case "close": {
			figma.closePlugin();
			break;
		}

		default:
			break;
	}
};
