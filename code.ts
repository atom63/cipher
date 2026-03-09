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
import { debug } from "./utils/debug";

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
	lastExportTab: "json",
	theme: "system",
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
				if (!(alias?.id)) return undefined;
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
				for (const field of [
					"fontSize",
					"lineHeight",
					"letterSpacing",
					"paragraphSpacing",
					"fontFamily",
					"fontWeight",
				]) {
					if (bv[field]) {
						const n = resolveVarName(bv[field]);
						if (n) variables[field] = n;
					}
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

		case "duplicate-styles": {
			const { styleIds } = msg.data;
			let success = 0;
			let failed = 0;
			const newStyleIds: string[] = [];
			for (const id of styleIds) {
				try {
					const style = figma.getStyleById(id);
					if (!style) {
						failed++;
						continue;
					}

					if (style.type === "PAINT") {
						const src = style as PaintStyle;
						const dup = figma.createPaintStyle();
						dup.name = `${src.name} copy`;
						dup.description = src.description;
						dup.paints = src.paints;
						newStyleIds.push(dup.id);
						success++;
					} else if (style.type === "TEXT") {
						const src = style as TextStyle;
						const dup = figma.createTextStyle();
						dup.name = `${src.name} copy`;
						dup.description = src.description;
						dup.fontSize = src.fontSize;
						dup.letterSpacing = src.letterSpacing;
						dup.lineHeight = src.lineHeight;
						dup.paragraphSpacing = src.paragraphSpacing;
						dup.textCase = src.textCase;
						dup.textDecoration = src.textDecoration;
						await figma.loadFontAsync(src.fontName);
						dup.fontName = src.fontName;
						newStyleIds.push(dup.id);
						success++;
					} else if (style.type === "EFFECT") {
						const src = style as EffectStyle;
						const dup = figma.createEffectStyle();
						dup.name = `${src.name} copy`;
						dup.description = src.description;
						dup.effects = src.effects;
						newStyleIds.push(dup.id);
						success++;
					} else if (style.type === "GRID") {
						const src = style as GridStyle;
						const dup = figma.createGridStyle();
						dup.name = `${src.name} copy`;
						dup.description = src.description;
						dup.layoutGrids = src.layoutGrids;
						newStyleIds.push(dup.id);
						success++;
					} else {
						failed++;
					}
				} catch (err) {
					console.error("[Cipher] duplicate style error:", err);
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "styles-duplicated",
				data: { success, failed, newStyleIds },
			});
			figma.notify(
				`Duplicated ${success} style${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "edit-styles": {
			const { edits } = msg.data;
			let success = 0;
			let failed = 0;
			for (const edit of edits) {
				try {
					const style = figma.getStyleById(edit.styleId);
					if (!style) {
						failed++;
						continue;
					}

					// Description — applies to all types
					if (edit.description != null) {
						style.description = edit.description;
					}

					if (style.type === "PAINT") {
						const paintStyle = style as PaintStyle;
						if (edit.color != null || edit.opacity != null) {
							const paints = [...paintStyle.paints];
							if (paints.length > 0 && paints[0].type === "SOLID") {
								const solid = paints[0] as SolidPaint;
								let newColor = solid.color;
								if (edit.color) {
									const hex = edit.color.replace("#", "");
									newColor = {
										r: Number.parseInt(hex.slice(0, 2), 16) / 255,
										g: Number.parseInt(hex.slice(2, 4), 16) / 255,
										b: Number.parseInt(hex.slice(4, 6), 16) / 255,
									};
								}
								paints[0] = {
									type: "SOLID",
									color: newColor,
									opacity: edit.opacity ?? solid.opacity ?? 1,
									visible: solid.visible,
									blendMode: solid.blendMode,
								} as SolidPaint;
								paintStyle.paints = paints;
							}
						}
					} else if (style.type === "TEXT") {
						const textStyle = style as TextStyle;
						if (edit.fontFamily || edit.fontStyle) {
							const newFont = {
								family: edit.fontFamily || textStyle.fontName.family,
								style: edit.fontStyle || textStyle.fontName.style,
							};
							await figma.loadFontAsync(newFont);
							textStyle.fontName = newFont;
						}
						if (edit.fontSize != null) textStyle.fontSize = edit.fontSize;
						if (edit.lineHeight != null) {
							if (edit.lineHeight === "AUTO") {
								textStyle.lineHeight = { unit: "AUTO" };
							} else {
								textStyle.lineHeight = edit.lineHeight;
							}
						}
						if (edit.letterSpacing != null) {
							textStyle.letterSpacing = {
								value: edit.letterSpacing,
								unit: "PIXELS",
							};
						}
						if (edit.paragraphSpacing != null) {
							textStyle.paragraphSpacing = edit.paragraphSpacing;
						}
					}
					success++;
				} catch (err) {
					console.error("[Cipher] edit style error:", err);
					failed++;
				}
			}
			figma.ui.postMessage({
				type: "styles-edited",
				data: { success, failed },
			});
			figma.notify(
				`Updated ${success} style${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "scan-rebind": {
			const { styleIds } = msg.data;

			// --- Build variable lookup maps ---

			// Color variables: keyed by RGBA (including alpha)
			const colorVars = figma.variables.getLocalVariables("COLOR");
			const varColorMap: { id: string; name: string; keys: string[] }[] = [];

			const colorKey = (r: number, g: number, b: number, a: number) => {
				return `${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${Math.round(a * 100)}`;
			};

			const rgbToHex = (c: RGB | RGBA, alpha?: number) => {
				const r = Math.round(c.r * 255);
				const g = Math.round(c.g * 255);
				const b = Math.round(c.b * 255);
				const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
				const a = alpha ?? ("a" in c ? c.a : 1);
				return a < 1 ? `${hex} ${Math.round(a * 100)}%` : hex;
			};

			for (const v of colorVars) {
				const collection = figma.variables.getVariableCollectionById(
					v.variableCollectionId,
				);
				if (!collection) continue;
				const keys: string[] = [];
				for (const modeId of collection.modes.map((m) => m.modeId)) {
					const val = v.valuesByMode[modeId];
					if (val && typeof val === "object" && "r" in val) {
						const c = val as RGBA;
						keys.push(colorKey(c.r, c.g, c.b, "a" in c ? c.a : 1));
					}
				}
				varColorMap.push({ id: v.id, name: v.name, keys });
			}

			// Float variables: keyed by numeric value (for fontSize, lineHeight)
			const floatVars = figma.variables.getLocalVariables("FLOAT");
			const varFloatMap: { id: string; name: string; values: number[] }[] = [];
			const resolveFloat = (val: any, depth = 0): number | undefined => {
				if (typeof val === "number") return val;
				if (depth > 3) return undefined;
				if (
					val &&
					typeof val === "object" &&
					"type" in val &&
					val.type === "VARIABLE_ALIAS"
				) {
					const ref = figma.variables.getVariableById(val.id);
					if (ref) {
						const refCol = figma.variables.getVariableCollectionById(
							ref.variableCollectionId,
						);
						if (refCol) {
							const firstMode = refCol.modes[0]?.modeId;
							if (firstMode)
								return resolveFloat(ref.valuesByMode[firstMode], depth + 1);
						}
					}
				}
				return undefined;
			};
			for (const v of floatVars) {
				const collection = figma.variables.getVariableCollectionById(
					v.variableCollectionId,
				);
				if (!collection) continue;
				const values: number[] = [];
				for (const modeId of collection.modes.map((m) => m.modeId)) {
					const val = v.valuesByMode[modeId];
					const resolved = resolveFloat(val);
					if (resolved != null) values.push(resolved);
				}
				varFloatMap.push({ id: v.id, name: v.name, values });
			}

			// String variables: keyed by string value (for fontFamily, fontWeight)
			const stringVars = figma.variables.getLocalVariables("STRING");
			const varStringMap: { id: string; name: string; values: string[] }[] = [];
			const resolveString = (val: any, depth = 0): string | undefined => {
				if (typeof val === "string") return val;
				if (depth > 3) return undefined;
				if (
					val &&
					typeof val === "object" &&
					"type" in val &&
					val.type === "VARIABLE_ALIAS"
				) {
					const ref = figma.variables.getVariableById(val.id);
					if (ref) {
						const refCol = figma.variables.getVariableCollectionById(
							ref.variableCollectionId,
						);
						if (refCol) {
							const firstMode = refCol.modes[0]?.modeId;
							if (firstMode)
								return resolveString(ref.valuesByMode[firstMode], depth + 1);
						}
					}
				}
				return undefined;
			};
			for (const v of stringVars) {
				const collection = figma.variables.getVariableCollectionById(
					v.variableCollectionId,
				);
				if (!collection) continue;
				const values: string[] = [];
				for (const modeId of collection.modes.map((m) => m.modeId)) {
					const val = v.valuesByMode[modeId];
					const resolved = resolveString(val);
					if (resolved != null) values.push(resolved);
				}
				varStringMap.push({ id: v.id, name: v.name, values });
			}

			const suggestions: any[] = [];

			// --- Helpers ---

			const findByColor = (key: string) => {
				return varColorMap.find((v) => v.keys.some((k) => k === key));
			};

			const findColorByName = (styleName: string) => {
				const parts = styleName.split("/");
				const leaf = parts.at(-1)
					.toLowerCase()
					.replace(/[\s-_]/g, "");
				return varColorMap.find((v) => {
					const vParts = v.name.split("/");
					const vLeaf = vParts.at(-1)
						.toLowerCase()
						.replace(/[\s-_]/g, "");
					return (
						vLeaf === leaf ||
						v.name.toLowerCase().replace(/[\s-_/]/g, "") ===
							styleName.toLowerCase().replace(/[\s-_/]/g, "")
					);
				});
			};

			// Normalize a path for comparison: lowercase, strip separators
			const normalizePath = (p: string) =>
				p.toLowerCase().replace(/[\s-_]/g, "");

			// Find a float variable by style path + property suffix, then fall back to value + name hints
			// e.g. styleName="typography/large-title", suffix="font-size" → looks for "typography/large-title/font-size"
			const findFloatVar = (
				value: number,
				styleName: string,
				suffix: string,
				...fallbackHints: string[]
			) => {
				const styleNorm = normalizePath(styleName);
				const suffixNorm = normalizePath(suffix);
				// 1. Path-based: variable name ends with stylePath/suffix pattern
				const pathMatch = varFloatMap.find((v) => {
					const vNorm = normalizePath(v.name);
					return (
						v.values.some((val) => val === value) &&
						(vNorm.endsWith(`${styleNorm}/${suffixNorm}`) ||
							vNorm.includes(`${styleNorm}/${suffixNorm}`))
					);
				});
				if (pathMatch) return { var: pathMatch, type: "exact" as const };
				// 2. Fallback: value match + name must contain one of the hints
				for (const hint of [suffix, ...fallbackHints]) {
					const hintNorm = normalizePath(hint);
					const match = varFloatMap.find(
						(v) =>
							v.values.some((val) => val === value) &&
							normalizePath(v.name).includes(hintNorm),
					);
					if (match) return { var: match, type: "name" as const };
				}
				return undefined;
			};

			// Find a string variable by style path + property suffix, then fall back to value + name hints
			const findStringVar = (
				value: string,
				styleName: string,
				suffix: string,
				...fallbackHints: string[]
			) => {
				const lower = value.toLowerCase();
				const styleNorm = normalizePath(styleName);
				const suffixNorm = normalizePath(suffix);
				// 1. Path-based
				const pathMatch = varStringMap.find((v) => {
					const vNorm = normalizePath(v.name);
					return (
						v.values.some((val) => val.toLowerCase() === lower) &&
						(vNorm.endsWith(`${styleNorm}/${suffixNorm}`) ||
							vNorm.includes(`${styleNorm}/${suffixNorm}`))
					);
				});
				if (pathMatch) return { var: pathMatch, type: "exact" as const };
				// 2. Fallback: value match + name must contain one of the hints
				for (const hint of [suffix, ...fallbackHints]) {
					const hintNorm = normalizePath(hint);
					const match = varStringMap.find(
						(v) =>
							v.values.some((val) => val.toLowerCase() === lower) &&
							normalizePath(v.name).includes(hintNorm),
					);
					if (match) return { var: match, type: "name" as const };
				}
				return undefined;
			};

			// --- Scan styles ---

			for (const styleId of styleIds) {
				const style = figma.getStyleById(styleId);
				if (!style) continue;

				if (style.type === "PAINT") {
					const paintStyle = style as PaintStyle;
					paintStyle.paints.forEach((paint, pi) => {
						if (paint.type === "SOLID") {
							const bv = (paint as any).boundVariables || {};
							if (!bv.color) {
								const solid = paint as SolidPaint;
								const alpha = solid.opacity ?? 1;
								const key = colorKey(
									solid.color.r,
									solid.color.g,
									solid.color.b,
									alpha,
								);
								const match =
									findByColor(key) || findColorByName(paintStyle.name);
								if (match) {
									suggestions.push({
										styleId,
										styleName: paintStyle.name,
										field: `solid:${pi}`,
										currentColor: rgbToHex(solid.color, alpha),
										suggestedVariableId: match.id,
										suggestedVariableName: match.name,
										matchType: findByColor(key) ? "exact" : "name",
									});
								}
							}
						} else if (paint.type.startsWith("GRADIENT_")) {
							const grad = paint as GradientPaint;
							grad.gradientStops.forEach((stop, si) => {
								const stopBv = (stop as any).boundVariables || {};
								if (!stopBv.color) {
									const a = "a" in stop.color ? stop.color.a : 1;
									const key = colorKey(
										stop.color.r,
										stop.color.g,
										stop.color.b,
										a,
									);
									const match = findByColor(key);
									if (match) {
										suggestions.push({
											styleId,
											styleName: paintStyle.name,
											field: `stop:${pi}:${si}`,
											currentColor: rgbToHex(stop.color),
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
								const shadow = e as DropShadowEffect;
								const a = "a" in shadow.color ? shadow.color.a : 1;
								const key = colorKey(
									shadow.color.r,
									shadow.color.g,
									shadow.color.b,
									a,
								);
								const match = findByColor(key);
								if (match) {
									suggestions.push({
										styleId,
										styleName: effectStyle.name,
										field: `effect:${ei}`,
										currentColor: rgbToHex(shadow.color),
										suggestedVariableId: match.id,
										suggestedVariableName: match.name,
										matchType: "exact",
									});
								}
							}
						}
					});
				} else if (style.type === "TEXT") {
					const textStyle = style as TextStyle;
					const bv = (textStyle as any).boundVariables || {};
					const styleName = textStyle.name;

					// fontSize — path-based: e.g. "typography/large-title" → "typography/large-title/font-size"
					if (!bv.fontSize) {
						const size = textStyle.fontSize as number;
						const result = findFloatVar(size, styleName, "font-size");
						if (result) {
							suggestions.push({
								styleId,
								styleName,
								field: "fontSize",
								currentValue: `${size}px`,
								suggestedVariableId: result.var.id,
								suggestedVariableName: result.var.name,
								matchType: result.type,
							});
						}
					}

					// lineHeight — path-based: e.g. "typography/large-title" → "typography/large-title/line-height"
					if (!bv.lineHeight) {
						const lh = textStyle.lineHeight as any;
						if (
							lh &&
							typeof lh === "object" &&
							lh.unit === "PIXELS" &&
							typeof lh.value === "number"
						) {
							const result = findFloatVar(lh.value, styleName, "line-height");
							if (result) {
								suggestions.push({
									styleId,
									styleName,
									field: "lineHeight",
									currentValue: `${lh.value}px`,
									suggestedVariableId: result.var.id,
									suggestedVariableName: result.var.name,
									matchType: result.type,
								});
							}
						}
					}

					// fontFamily — path-based, then fallback to any "family" variable
					if (!bv.fontFamily) {
						const family = textStyle.fontName.family;
						const result = findStringVar(
							family,
							styleName,
							"font-family",
							"family",
						);
						if (result) {
							suggestions.push({
								styleId,
								styleName,
								field: "fontFamily",
								currentValue: family,
								suggestedVariableId: result.var.id,
								suggestedVariableName: result.var.name,
								matchType: result.type,
							});
						}
					}

					// fontWeight — match numeric weight against FLOAT variables
					if (!bv.fontWeight) {
						const fontStyleName = textStyle.fontName.style;
						const weightMap: Record<string, number> = {
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
						const numWeight = weightMap[fontStyleName.toLowerCase()];
						if (numWeight != null) {
							const result = findFloatVar(
								numWeight,
								styleName,
								"font-weight",
								"weight",
							);
							if (result) {
								suggestions.push({
									styleId,
									styleName,
									field: "fontWeight",
									currentValue: `${fontStyleName} (${numWeight})`,
									suggestedVariableId: result.var.id,
									suggestedVariableName: result.var.name,
									matchType: result.type,
								});
							}
						}
					}
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
					if (!(style && variable)) {
						failed++;
						continue;
					}

					if (style.type === "PAINT") {
						const paintStyle = style as PaintStyle;
						const paints = [...paintStyle.paints];

						if (field.startsWith("solid:")) {
							const pi = Number.parseInt(field.split(":")[1], 10);
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
							const pi = Number.parseInt(piStr, 10);
							const si = Number.parseInt(siStr, 10);
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
							const ei = Number.parseInt(field.split(":")[1], 10);
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
					} else if (style.type === "TEXT") {
						const textStyle = style as TextStyle;
						const fieldMap: Record<string, string> = {
							fontSize: "fontSize",
							lineHeight: "lineHeight",
							fontFamily: "fontFamily",
							fontStyle: "fontStyle",
							fontWeight: "fontWeight",
						};
						const bindField = fieldMap[field];
						if (bindField) {
							textStyle.setBoundVariable(bindField as any, variable);
							success++;
							applied.push({ styleId, field });
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
				`Rebound ${success} propert${success !== 1 ? "ies" : "y"} to variables${failed > 0 ? ` (${failed} failed)` : ""}`,
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
							const pi = Number.parseInt(field.split(":")[1], 10);
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
							const pi = Number.parseInt(piStr, 10);
							const si = Number.parseInt(siStr, 10);
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
							const ei = Number.parseInt(field.split(":")[1], 10);
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
					} else if (style.type === "TEXT") {
						const textStyle = style as TextStyle;
						const textFields = [
							"fontSize",
							"lineHeight",
							"fontFamily",
							"fontWeight",
							"fontStyle",
						];
						if (textFields.includes(field)) {
							textStyle.setBoundVariable(field as any, null);
							success++;
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

		case "check-dependencies": {
			const { variableIds } = msg.data;
			const targetIds = new Set(variableIds);
			const dependencies: Record<
				string,
				{
					name: string;
					referencedBy: { id: string; name: string; collectionName: string }[];
				}
			> = {};

			// Initialize entries for each target variable
			for (const id of variableIds) {
				const variable = figma.variables.getVariableById(id);
				if (variable) {
					dependencies[id] = {
						name: variable.name,
						referencedBy: [],
					};
				}
			}

			// Scan all variables to find references
			const allCollections = figma.variables.getLocalVariableCollections();
			for (const collection of allCollections) {
				for (const varId of collection.variableIds) {
					const variable = figma.variables.getVariableById(varId);
					if (!variable) continue;
					for (const [, value] of Object.entries(variable.valuesByMode)) {
						if (
							value &&
							typeof value === "object" &&
							"type" in value &&
							(value as any).type === "VARIABLE_ALIAS" &&
							targetIds.has((value as any).id)
						) {
							const refId = (value as any).id as string;
							if (dependencies[refId]) {
								// Avoid duplicate entries
								const already = dependencies[refId].referencedBy.some(
									(r) => r.id === varId,
								);
								if (!already) {
									dependencies[refId].referencedBy.push({
										id: varId,
										name: variable.name,
										collectionName: collection.name,
									});
								}
							}
						}
					}
				}
			}

			figma.ui.postMessage({
				type: "dependency-check-result",
				data: { dependencies },
			});
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
			const previousCollections: {
				newId: string;
				id: string;
				collectionId: string;
			}[] = [];

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

					previousCollections.push({
						newId: newVar.id,
						id,
						collectionId: variable.variableCollectionId,
					});

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
								value = Number.parseFloat(rawValue);
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
									const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
									const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
									const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
									const a =
										hex.length === 9 ? Number.parseInt(hex.slice(7, 9), 16) / 255 : 1;
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

		case "check-import-conflicts": {
			const { tokens, collectionName, selectedCollections } = msg.data;
			const conflicts: {
				tokenId: string;
				existingValues: Record<string, string>;
				existingId: string;
			}[] = [];

			// Find the target collection(s)
			const allCollections = figma.variables.getLocalVariableCollections();
			const targetCollections = allCollections.filter((c) => {
				if (selectedCollections && selectedCollections.length > 0) {
					return selectedCollections.includes(c.name);
				}
				return c.name === collectionName;
			});

			if (targetCollections.length > 0) {
				// Build a map of existing variable names to their info
				const existingVarMap = new Map<
					string,
					{ id: string; valuesByMode: Record<string, string> }
				>();

				for (const collection of targetCollections) {
					const modeNames = new Map(
						collection.modes.map((m) => [m.modeId, m.name]),
					);
					for (const varId of collection.variableIds) {
						const variable = figma.variables.getVariableById(varId);
						if (!variable) continue;

						const valuesByMode: Record<string, string> = {};
						for (const [modeId, value] of Object.entries(
							variable.valuesByMode,
						)) {
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

						existingVarMap.set(variable.name, {
							id: variable.id,
							valuesByMode,
						});
					}
				}

				// Check each token for conflicts
				for (const token of tokens) {
					const existing = existingVarMap.get(token.figmaName);
					if (existing) {
						conflicts.push({
							tokenId: token.id,
							existingValues: existing.valuesByMode,
							existingId: existing.id,
						});
					}
				}
			}

			figma.ui.postMessage({
				type: "import-conflicts-result",
				data: { conflicts },
			});
			break;
		}

		case "create-variables": {
			const {
				tokens,
				collectionName,
				importMode = "import",
				stylesData,
			} = msg.data;
			// Note: tokens are already filtered by selected collections in the UI
			const results = await createVariablesFromTokens(
				tokens,
				collectionName,
				importMode,
			);

			// If combined JSON included styles, import them after variables are created
			// This ensures variable bindings can be resolved
			let stylesImported = 0;
			if (stylesData) {
				try {
					const styleResults = await importStylesFromTokens(
						{ styles: stylesData },
						[], // import all styles — no cherry-picking
						importMode,
					);
					stylesImported = styleResults.success;
					// Merge style results into variable results
					results.success += styleResults.success;
					results.failed += styleResults.failed;
					results.errors.push(...styleResults.errors);
					if (styleResults.changes) {
						results.changes.push(...styleResults.changes);
					}
				} catch (e) {
					console.warn("Style import failed:", e);
				}
			}

			figma.ui.postMessage({
				type: "variables-created",
				data: results,
			});

			const actionVerb = importMode === "override" ? "Updated" : "Created";
			const varCount = results.success - stylesImported;
			const styleMsg = stylesImported > 0 ? ` + ${stylesImported} styles` : "";
			const skipMsg =
				results.skipped > 0 ? ` (${results.skipped} skipped)` : "";
			const failMsg = results.failed > 0 ? ` (${results.failed} failed)` : "";
			figma.notify(
				`✅ ${actionVerb} ${varCount} variables${styleMsg}${skipMsg}${failMsg}`,
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

		case "swap-references": {
			const { sourceId, targetId } = msg.data;
			let success = 0;
			let failed = 0;

			const allCollections = figma.variables.getLocalVariableCollections();
			for (const collection of allCollections) {
				for (const varId of collection.variableIds) {
					const variable = figma.variables.getVariableById(varId);
					if (!variable) continue;
					for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
						if (
							value &&
							typeof value === "object" &&
							"type" in value &&
							(value as any).type === "VARIABLE_ALIAS" &&
							(value as any).id === sourceId
						) {
							try {
								const targetVar = figma.variables.getVariableById(targetId);
								if (targetVar) {
									const alias = figma.variables.createVariableAlias(targetVar);
									variable.setValueForMode(modeId, alias);
									success++;
								} else {
									failed++;
								}
							} catch {
								failed++;
							}
						}
					}
				}
			}

			figma.ui.postMessage({
				type: "references-swapped",
				data: { success, failed },
			});
			figma.notify(
				`Swapped ${success} reference${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
			);
			break;
		}

		case "scale-variable-values": {
			const { variableIds, factor, operation } = msg.data;
			let success = 0;
			let failed = 0;
			const previousValues: {
				id: string;
				valuesByMode: Record<string, any>;
			}[] = [];

			for (const id of variableIds) {
				try {
					const variable = figma.variables.getVariableById(id);
					if (!variable || variable.resolvedType !== "FLOAT") {
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

					// Snapshot previous values (using mode names for undo roundtrip)
					const modeIdToName = new Map(
						collection.modes.map((m) => [m.modeId, m.name]),
					);
					const prevValues: Record<string, any> = {};
					for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
						const modeName = modeIdToName.get(modeId) || modeId;
						prevValues[modeName] = value;
					}
					previousValues.push({ id, valuesByMode: prevValues });

					// Apply scale
					for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
						if (typeof value === "number") {
							const newValue =
								operation === "multiply" ? value * factor : value / factor;
							variable.setValueForMode(modeId, newValue);
						}
					}
					success++;
				} catch {
					failed++;
				}
			}

			figma.ui.postMessage({
				type: "variable-values-scaled",
				data: { success, failed, previousValues },
			});
			figma.notify(
				`Scaled ${success} variable${success !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}`,
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
			debug("🎨 Export styles message received, data:", msg.data);
			const { selectedGroups, colorFormat } = msg.data;
			await exportStylesAsTokens(selectedGroups || [], colorFormat || "oklch");
			break;
		}

		case "import-styles": {
			debug("📥 Import styles message received");
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
