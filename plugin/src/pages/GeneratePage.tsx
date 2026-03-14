import { Check, ChevronDown, Dices, RefreshCw, Wand2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProgressView, SuccessView } from "../components/import";
import { PageBody, PageFooter, PageLayout } from "../components/layout";
import {
	Frame,
	FrameHeader,
	FramePanel,
	LoadingState,
	SectionHeader,
	Separator,
	useToast,
} from "../components/ui";
import { Button } from "../components/ui/Button";
import { Checkbox, CheckboxWithLabel } from "../components/ui/Checkbox";
import { CopyButton } from "../components/ui/CopyButton";
import { Dialog, DialogActions } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { NumberField } from "../components/ui/NumberField";
import { adjustSaturation, hexToRgb, oklchToRgb, rgbToHex, rgbToOklch, SHADE_STEPS } from "../generators/color-scale";
import { RADIX_GRAYS } from "../generators/radix-grays";
import {
	type BrandConfig,
	type GeneratedSystem,
	generateCss,
	generateDesignSystem,
	type StatusColorOverrides,
} from "../generators/three-tier";
import {
	computeTypescale,
	DEFAULT_TYPESCALE,
	type FontOverrides,
	TYPESCALE_RATIOS,
	type TypescaleConfig,
} from "../generators/token-presets";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import type { CollectionInfo, VariableInfo } from "../types/messages";
import type { ImportResults } from "../types/tokens";
import styles from "./GeneratePage.module.css";

type ViewState = "loading" | "config" | "progress" | "success";

// ---------------------------------------------------------------------------
// Extract BrandConfig from existing Figma variables
// ---------------------------------------------------------------------------

interface ExtractedConfig {
	fonts: FontOverrides;
	grayDark: string;
	grayLight: string;
	primaryColor: string;
	radiusAnchor: number;
	secondaryColor: string | null;
	statusColors: StatusColorOverrides;
	typescale: TypescaleConfig | null;
}

/** Parse a color value string (hex or rgba) into a normalised uppercase hex */
function parseColorValue(value: string): string | null {
	// Already hex — normalise
	const hexMatch = value.match(/^#([0-9a-fA-F]{6})$/);
	if (hexMatch) return `#${hexMatch[1].toUpperCase()}`;

	// rgba(r, g, b, a) — ignore alpha
	const rgbaMatch = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
	if (rgbaMatch) {
		const r = Number.parseInt(rgbaMatch[1], 10);
		const g = Number.parseInt(rgbaMatch[2], 10);
		const b = Number.parseInt(rgbaMatch[3], 10);
		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
	}

	return null;
}

/** Extract original base hex from variable description (e.g. "[base:#3B82F6]") */
function extractBaseHex(variable: VariableInfo | undefined): string | null {
	if (!variable?.description) return null;
	const match = variable.description.match(/\[base:(#[0-9a-fA-F]{6})\]/);
	return match ? match[1].toUpperCase() : null;
}

function extractBrandConfig(
	variables: VariableInfo[],
	_collections: CollectionInfo[],
): ExtractedConfig | null {
	const find = (collectionPrefix: string, name: string): VariableInfo | undefined =>
		variables.find(
			(v) =>
				v.collectionName.toLowerCase().startsWith(collectionPrefix) &&
				v.name === name,
		);

	// Try renamed paths first, fall back to legacy names
	const primaryVar =
		find("primitives", "color/brand/primary/500") ?? find("primitives", "color/brand-primary/500");
	let primaryColor = "#3B82F6";
	// Prefer original base hex from description to avoid OKLCH round-trip drift
	const primaryBase = extractBaseHex(primaryVar);
	if (primaryBase) {
		primaryColor = primaryBase;
	} else if (primaryVar) {
		const firstMode = Object.keys(primaryVar.valuesByMode)[0];
		if (firstMode) {
			const hex = parseColorValue(primaryVar.valuesByMode[firstMode]);
			if (hex) primaryColor = hex;
		}
	}

	const secondaryVar =
		find("primitives", "color/brand/secondary/500") ?? find("primitives", "color/brand-secondary/500");
	let secondaryColor: string | null = null;
	const secondaryBase = extractBaseHex(secondaryVar);
	if (secondaryBase) {
		secondaryColor = secondaryBase;
	} else if (secondaryVar) {
		const firstMode = Object.keys(secondaryVar.valuesByMode)[0];
		if (firstMode) {
			secondaryColor = parseColorValue(secondaryVar.valuesByMode[firstMode]);
		}
	}

	// Detect light/dark surface tones from variable descriptions
	let grayLight = "slate";
	let grayDark = "slate";
	const grayLightVar = find("primitives", "color/gray/light/1");
	const grayDarkVar = find("primitives", "color/gray/dark/1");
	if (grayLightVar?.description) {
		for (const gray of RADIX_GRAYS) {
			if (grayLightVar.description.toLowerCase().startsWith(gray.label.toLowerCase())) {
				grayLight = gray.name;
				break;
			}
		}
	}
	if (grayDarkVar?.description) {
		for (const gray of RADIX_GRAYS) {
			if (grayDarkVar.description.toLowerCase().startsWith(gray.label.toLowerCase())) {
				grayDark = gray.name;
				break;
			}
		}
	}

	let radiusAnchor = 10;
	const radiusVar = find("primitives", "rounded/lg");
	if (radiusVar) {
		const firstMode = Object.keys(radiusVar.valuesByMode)[0];
		if (firstMode) {
			const val = Number.parseFloat(radiusVar.valuesByMode[firstMode]);
			if (!Number.isNaN(val)) radiusAnchor = val;
		}
	}

	const fonts: FontOverrides = {};
	const sansVar = find("primitives", "font/family/sans");
	const serifVar = find("primitives", "font/family/serif");
	const monoVar = find("primitives", "font/family/mono");
	if (sansVar) {
		const firstMode = Object.keys(sansVar.valuesByMode)[0];
		if (firstMode) fonts.sans = sansVar.valuesByMode[firstMode];
	}
	if (serifVar) {
		const firstMode = Object.keys(serifVar.valuesByMode)[0];
		if (firstMode) fonts.serif = serifVar.valuesByMode[firstMode];
	}
	if (monoVar) {
		const firstMode = Object.keys(monoVar.valuesByMode)[0];
		if (firstMode) fonts.mono = monoVar.valuesByMode[firstMode];
	}

	const statusColors: StatusColorOverrides = {};
	for (const key of ["danger", "success", "warning", "info"] as const) {
		const statusVar = variables.find(
			(v) =>
				v.collectionName.toLowerCase().startsWith("primitives") &&
				v.name === `color/${key}/500`,
		);
		if (statusVar) {
			const base = extractBaseHex(statusVar);
			if (base) {
				statusColors[key] = base;
			} else {
				const firstMode = Object.keys(statusVar.valuesByMode)[0];
				if (firstMode) {
					const hex = parseColorValue(statusVar.valuesByMode[firstMode]);
					if (hex) statusColors[key] = hex;
				}
			}
		}
	}

	// --- Extract typescale config ---
	let typescale: TypescaleConfig | null = null;
	const baseSizeVar = find("primitives", "font/typescale/base/size/md");
	if (baseSizeVar) {
		const firstMode = Object.keys(baseSizeVar.valuesByMode)[0];
		const base = firstMode ? Number.parseFloat(baseSizeVar.valuesByMode[firstMode]) : 16;

		// Count steps up/down by probing known step names
		const upNames = ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"];
		const downNames = ["sm", "xs"];
		let stepsUp = 0;
		for (const name of upNames) {
			if (find("primitives", `font/typescale/${name}/size/md`)) stepsUp++;
			else break;
		}
		let stepsDown = 0;
		for (const name of downNames) {
			if (find("primitives", `font/typescale/${name}/size/md`)) stepsDown++;
			else break;
		}

		// Derive ratio from first step up
		let ratio = "major-third";
		const lgSizeVar = find("primitives", "font/typescale/lg/size/md");
		if (lgSizeVar && base > 0) {
			const lgMode = Object.keys(lgSizeVar.valuesByMode)[0];
			if (lgMode) {
				const lgSize = Number.parseFloat(lgSizeVar.valuesByMode[lgMode]);
				const measured = lgSize / base;
				// Find closest matching named ratio
				let bestKey = "major-third";
				let bestDiff = Number.POSITIVE_INFINITY;
				for (const [key, r] of Object.entries(TYPESCALE_RATIOS)) {
					const diff = Math.abs(r.value - measured);
					if (diff < bestDiff) {
						bestDiff = diff;
						bestKey = key;
					}
				}
				ratio = bestKey;
			}
		}

		// Derive line heights using best-fit across all steps.
		// Reading from a single step (e.g. lg) causes rounding drift:
		// round(size * pct) → extract pct from one step → re-apply → 1px offsets.
		// Instead, try each integer pct 100–200 and pick the one that reproduces
		// existing line-height values with minimum total error.

		const bestFitPct = (
			pairs: { size: number; lh: number }[],
			fallback: number,
		): number => {
			if (pairs.length === 0) return fallback;
			let bestPct = fallback;
			let bestError = Number.POSITIVE_INFINITY;
			for (let pct = 100; pct <= 200; pct++) {
				let totalError = 0;
				for (const { size, lh } of pairs) {
					totalError += Math.abs(Math.round(size * (pct / 100)) - lh);
				}
				if (totalError < bestError) {
					bestError = totalError;
					bestPct = pct;
				}
			}
			return bestPct;
		};

		// Collect body step pairs (base + downscales)
		const bodyPairs: { size: number; lh: number }[] = [];
		for (const stepName of ["base", ...downNames.slice(0, stepsDown)]) {
			const sVar = find("primitives", `font/typescale/${stepName}/size/md`);
			const lhVar = find("primitives", `font/typescale/${stepName}/line/height/md`);
			if (sVar && lhVar) {
				const sm = Object.keys(sVar.valuesByMode)[0];
				const lm = Object.keys(lhVar.valuesByMode)[0];
				if (sm && lm) {
					const s = Number.parseFloat(sVar.valuesByMode[sm]);
					const l = Number.parseFloat(lhVar.valuesByMode[lm]);
					if (s > 0 && l > 0) bodyPairs.push({ size: s, lh: l });
				}
			}
		}
		const lineHeightBody = bestFitPct(bodyPairs, 150);

		// Collect heading step pairs (all upscales)
		const headingPairs: { size: number; lh: number }[] = [];
		for (const stepName of upNames.slice(0, stepsUp)) {
			const sVar = find("primitives", `font/typescale/${stepName}/size/md`);
			const lhVar = find("primitives", `font/typescale/${stepName}/line/height/md`);
			if (sVar && lhVar) {
				const sm = Object.keys(sVar.valuesByMode)[0];
				const lm = Object.keys(lhVar.valuesByMode)[0];
				if (sm && lm) {
					const s = Number.parseFloat(sVar.valuesByMode[sm]);
					const l = Number.parseFloat(lhVar.valuesByMode[lm]);
					if (s > 0 && l > 0) headingPairs.push({ size: s, lh: l });
				}
			}
		}
		const lineHeightHeading = bestFitPct(headingPairs, 125);

		typescale = {
			base: Number.isNaN(base) ? 16 : base,
			ratio,
			lineHeightBody,
			lineHeightHeading,
			stepsUp,
			stepsDown,
		};
	}

	return {
		primaryColor,
		secondaryColor,
		grayLight,
		grayDark,
		radiusAnchor,
		fonts,
		statusColors,
		typescale,
	};
}

// ---------------------------------------------------------------------------
// GeneratePage — unified create + update
// ---------------------------------------------------------------------------

export function GeneratePage() {
	const [view, setView] = useState<ViewState>("loading");
	const [isUpdate, setIsUpdate] = useState(false);
	const postMessage = usePostMessage();
	const { showError } = useToast();

	// Config state
	const [primaryColor, setPrimaryColor] = useState("#3B82F6");
	const [secondaryColor, setSecondaryColor] = useState("#10B981");
	const [hasSecondary, setHasSecondary] = useState(false);
	const [secondaryAsDarkPrimary, setSecondaryAsDarkPrimary] = useState(false);
	const [grayLight, setGrayLight] = useState("slate");
	const [grayDark, setGrayDark] = useState("slate");
	const [grayLightHex, setGrayLightHex] = useState("");
	const [grayDarkHex, setGrayDarkHex] = useState("");
	const [radiusAnchor, setRadiusAnchor] = useState(10);
	const [typescale, setTypescale] = useState<TypescaleConfig>({
		...DEFAULT_TYPESCALE,
	});
	const [fonts, setFonts] = useState<FontOverrides>({
		sans: "Inter",
		serif: "PT Serif",
		mono: "Geist Mono",
	});
	const [statusColors, setStatusColors] = useState<StatusColorOverrides>({});
	const [surfaceSaturation, setSurfaceSaturation] = useState(100);
	const [surfaceHueBlend, setSurfaceHueBlend] = useState(0);
	const [surfaceHueShift, setSurfaceHueShift] = useState(0);
	const [surfaceBrightness, setSurfaceBrightness] = useState(0);

	// Result state
	const [result, setResult] = useState<ImportResults | null>(null);

	// Existing variables and styles (for orphan detection during updates)
	const [existingVariables, setExistingVariables] = useState<VariableInfo[]>([]);
	const [existingStyles, setExistingStyles] = useState<{ id: string; name: string; category: string }[]>([]);

	// Orphan cleanup dialog
	const [showOrphanDialog, setShowOrphanDialog] = useState(false);
	const [orphanVarIds, setOrphanVarIds] = useState<Set<string>>(new Set());
	const [orphanStyleIds, setOrphanStyleIds] = useState<Set<string>>(new Set());

	// Available fonts from Figma
	const [availableFonts, setAvailableFonts] = useState<string[]>([]);

	// Load existing variables, styles, and available fonts on mount
	useEffect(() => {
		postMessage({ type: "get-variables" });
		postMessage({ type: "get-style-details" });
		postMessage({ type: "get-available-fonts" });
	}, [postMessage]);

	// Refs for values used in message callback (avoids stale closures)
	const generatedRef = useRef<GeneratedSystem | null>(null);
	const isUpdateRef = useRef(isUpdate);
	const viewRef = useRef(view);
	const proceedWithImportRef = useRef(() => {});
	isUpdateRef.current = isUpdate;
	viewRef.current = view;

	// Handle messages
	useFigmaMessage(
		useCallback(
			(msg) => {
				if (msg.type === "variables-list") {
					const data = msg.data as {
						variables: VariableInfo[];
						collections: CollectionInfo[];
					};

					setExistingVariables(data.variables);

					if (data.variables.length === 0) {
						// Fresh file — generate mode
						setIsUpdate(false);
						setView("config");
						return;
					}

					// Existing variables — update mode
					setIsUpdate(true);
					const extracted = extractBrandConfig(data.variables, data.collections);
					if (extracted) {
						setPrimaryColor(extracted.primaryColor);
						if (extracted.secondaryColor) {
							setSecondaryColor(extracted.secondaryColor);
							setHasSecondary(true);
						} else {
							setHasSecondary(false);
						}
						setGrayLight(extracted.grayLight);
						setGrayDark(extracted.grayDark);
						setRadiusAnchor(extracted.radiusAnchor);
						if (extracted.fonts.sans || extracted.fonts.serif || extracted.fonts.mono) {
							setFonts({
								sans: extracted.fonts.sans ?? "Inter",
								serif: extracted.fonts.serif ?? "PT Serif",
								mono: extracted.fonts.mono ?? "Geist Mono",
							});
						}
						if (Object.values(extracted.statusColors).some(Boolean)) {
							setStatusColors(extracted.statusColors);
						}
						if (extracted.typescale) {
							setTypescale(extracted.typescale);
						}
					}
					setView("config");
				}
				if (msg.type === "style-details-list") {
					const data = msg.data as {
						styles: { id: string; name: string; category: string }[];
					};
					setExistingStyles(data.styles);
				}
				if (msg.type === "available-fonts") {
					const data = msg.data as { fonts: string[] };
					setAvailableFonts(data.fonts);
				}
				if (msg.type === "variables-deleted" && viewRef.current === "progress") {
					// Orphan variables deleted — now proceed with import
					proceedWithImportRef.current();
					return;
				}
				if (msg.type === "import-complete" || msg.type === "variables-created") {
					setResult(msg.data as ImportResults);
					setView("success");
				}
				if (msg.type === "error") {
					const errData = msg.data as { message?: string } | undefined;
					showError(errData?.message || "Failed to generate — check your settings and try again");
					setView("config");
				}
			},
			[showError],
		),
	);

	// Build config object
	const brandConfig: BrandConfig | null = useMemo(() => {
		if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(primaryColor)) return null;
		if (
			hasSecondary &&
			!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(secondaryColor)
		)
			return null;

		const hasStatusOverrides =
			statusColors.danger || statusColors.success || statusColors.warning || statusColors.info;

		const validHex = (h: string) => /^#[0-9a-fA-F]{6}$/.test(h);

		return {
			primary: primaryColor,
			secondary: hasSecondary ? secondaryColor : undefined,
			grayLight,
			grayDark,
			grayLightHex: validHex(grayLightHex) ? grayLightHex : undefined,
			grayDarkHex: validHex(grayDarkHex) ? grayDarkHex : undefined,
			darkMode: true,
			radius: radiusAnchor,
			typescale,
			fonts,
			statusColors: hasStatusOverrides ? statusColors : undefined,
			surfaceSaturation: surfaceSaturation !== 100 ? surfaceSaturation : undefined,
			surfaceHueBlend: surfaceHueBlend !== 0 ? surfaceHueBlend : undefined,
			surfaceHueShift: surfaceHueShift !== 0 ? surfaceHueShift : undefined,
			surfaceBrightness: surfaceBrightness !== 0 ? surfaceBrightness : undefined,
			secondaryAsDarkPrimary: hasSecondary && secondaryAsDarkPrimary ? true : undefined,
		};
	}, [
		primaryColor,
		secondaryColor,
		hasSecondary,
		secondaryAsDarkPrimary,
		grayLight,
		grayDark,
		grayLightHex,
		grayDarkHex,
		radiusAnchor,
		typescale,
		fonts,
		statusColors,
		surfaceSaturation,
		surfaceHueBlend,
		surfaceBrightness,
		surfaceHueShift,
	]);

	// Generate preview
	const generated: GeneratedSystem | null = useMemo(() => {
		if (!brandConfig) return null;
		return generateDesignSystem(brandConfig);
	}, [brandConfig]);
	generatedRef.current = generated;

	// Collect all style names from the nested generated styles object
	const collectGeneratedStyleNames = useCallback((stylesObj: Record<string, any>): Set<string> => {
		const names = new Set<string>();
		const walk = (obj: any, path: string) => {
			for (const [key, value] of Object.entries(obj)) {
				const fullPath = path ? `${path}/${key}` : key;
				if (value && typeof value === "object" && "id" in value && "type" in value) {
					names.add(fullPath);
				} else if (value && typeof value === "object") {
					walk(value, fullPath);
				}
			}
		};
		for (const category of ["paint", "text", "effect"]) {
			if (stylesObj[category]) walk(stylesObj[category], "");
		}
		return names;
	}, []);

	// Compute orphaned variables (exist in Figma but not in generated set)
	const orphanedVariables = useMemo(() => {
		if (!(isUpdate && generated ) || existingVariables.length === 0) return [];

		const MANAGED_COLLECTIONS = new Set(["primitives", "aliases", "semantics", "responsive"]);

		const generatedNames = new Map<string, Set<string>>();
		for (const token of generated.tokens) {
			const collection = token.category;
			if (!generatedNames.has(collection)) {
				generatedNames.set(collection, new Set());
			}
			generatedNames.get(collection)?.add(token.figmaName);
		}

		return existingVariables.filter((v) => {
			const collName = v.collectionName.toLowerCase();
			if (!MANAGED_COLLECTIONS.has(collName)) return false;
			const namesInCollection = generatedNames.get(collName);
			if (!namesInCollection) return true;
			return !namesInCollection.has(v.name);
		});
	}, [isUpdate, generated, existingVariables]);

	// Compute orphaned styles (exist in Figma but not in generated set)
	const orphanedStyles = useMemo(() => {
		if (!(isUpdate && generated ) || existingStyles.length === 0) return [];

		const generatedStyleNames = collectGeneratedStyleNames(generated.styles);

		// Only check styles whose names match generator patterns (group/key format)
		// Generator creates: semantics/*, primary/*, secondary/*, tertiary/*, shadow/*, blur/*, backdrop-blur/*
		const MANAGED_PREFIXES = ["semantics/", "primary/", "secondary/", "tertiary/", "shadow/", "blur/", "backdrop-blur/"];

		return existingStyles.filter((s) => {
			const isManaged = MANAGED_PREFIXES.some((p) => s.name.startsWith(p));
			if (!isManaged) return false;
			return !generatedStyleNames.has(s.name);
		});
	}, [isUpdate, generated, existingStyles, collectGeneratedStyleNames]);

	const totalOrphans = orphanedVariables.length + orphanedStyles.length;

	const handleSubmit = useCallback(() => {
		if (!generated) return;

		if (isUpdate && totalOrphans > 0) {
			setOrphanVarIds(new Set(orphanedVariables.map((v) => v.id)));
			setOrphanStyleIds(new Set(orphanedStyles.map((s) => s.id)));
			setShowOrphanDialog(true);
			return;
		}

		setView("progress");
		postMessage({
			type: "create-variables",
			data: {
				tokens: generated.tokens,
				...(isUpdate ? { collectionName: "generated" } : {}),
				importMode: "import",
				stylesData: generated.styles,
			},
		});
	}, [generated, isUpdate, totalOrphans, orphanedVariables, orphanedStyles, postMessage]);

	const proceedWithImport = useCallback(() => {
		if (!generated) return;
		postMessage({
			type: "create-variables",
			data: {
				tokens: generated.tokens,
				...(isUpdate ? { collectionName: "generated" } : {}),
				importMode: "import",
				stylesData: generated.styles,
			},
		});
	}, [generated, isUpdate, postMessage]);
	proceedWithImportRef.current = proceedWithImport;

	const handleOrphanConfirm = useCallback(() => {
		if (!generated) return;
		setShowOrphanDialog(false);
		setView("progress");

		// Delete orphan styles (fire-and-forget, grouped by category)
		if (orphanStyleIds.size > 0) {
			const byCategory: Record<string, string[]> = {};
			for (const s of orphanedStyles) {
				if (!orphanStyleIds.has(s.id)) continue;
				if (!byCategory[s.category]) byCategory[s.category] = [];
				byCategory[s.category].push(s.id);
			}
			for (const [category, ids] of Object.entries(byCategory)) {
				postMessage({ type: "delete-styles", data: { styleIds: ids, category: category as "paint" | "text" | "effect" } });
			}
		}

		if (orphanVarIds.size > 0) {
			// Delete variables, then import on "variables-deleted" response
			postMessage({
				type: "delete-variables",
				data: { variableIds: [...orphanVarIds] },
			});
		} else {
			// No variable orphans to delete, proceed directly
			proceedWithImport();
		}
	}, [generated, orphanVarIds, orphanStyleIds, orphanedStyles, postMessage, proceedWithImport]);

	const handleOrphanSkip = useCallback(() => {
		if (!generated) return;
		setShowOrphanDialog(false);
		setView("progress");
		proceedWithImport();
	}, [generated, proceedWithImport]);

	const getCssText = useCallback(() => {
		if (!brandConfig) return "";
		return generateCss(brandConfig);
	}, [brandConfig]);

	const handleRefresh = useCallback(() => {
		setView("loading");
		postMessage({ type: "get-variables" });
		postMessage({ type: "get-style-details" });
	}, [postMessage]);

	const handleReset = useCallback(() => {
		setView("config");
		setResult(null);
	}, []);

	const handleShuffle = useCallback(() => {
		const randHex = (l: number, c: number, h: number) =>
			rgbToHex(oklchToRgb({ l, c, h })).toUpperCase();

		// Primary: bright, punchy color (L 0.65–0.78, high chroma)
		const primaryHue = Math.random() * 360;
		setPrimaryColor(randHex(0.65 + Math.random() * 0.13, 0.16 + Math.random() * 0.10, primaryHue));

		// Secondary: offset 60–180° from primary, similarly bright
		const secondaryHue = (primaryHue + 60 + Math.random() * 120) % 360;
		setSecondaryColor(randHex(0.65 + Math.random() * 0.13, 0.14 + Math.random() * 0.10, secondaryHue));
		setHasSecondary(true);

		// Surface: random Radix preset per mode
		setGrayLight(RADIX_GRAYS[Math.floor(Math.random() * RADIX_GRAYS.length)].name);
		setGrayDark(RADIX_GRAYS[Math.floor(Math.random() * RADIX_GRAYS.length)].name);
		setGrayLightHex("");
		setGrayDarkHex("");

		// Status: semantic hue ranges, bright and clean
		const ranges: Record<string, [number, number]> = {
			danger: [15, 35],
			success: [150, 170],
			warning: [65, 85],
			info: [230, 265],
		};
		const newStatus: Record<string, string> = {};
		for (const [key, [lo, hi]] of Object.entries(ranges)) {
			newStatus[key] = randHex(0.65 + Math.random() * 0.12, 0.16 + Math.random() * 0.08, lo + Math.random() * (hi - lo));
		}
		setStatusColors(newStatus);
	}, []);

	// ---- Loading ----
	if (view === "loading") {
		return (
			<PageLayout>
				<LoadingState message="Loading variables from Figma…" />
			</PageLayout>
		);
	}

	// ---- Progress ----
	if (view === "progress") {
		return (
			<PageLayout>
				<ProgressView message={isUpdate ? "Updating variables in Figma…" : "Creating variables in Figma…"} />
			</PageLayout>
		);
	}

	// ---- Success ----
	if (view === "success" && result) {
		return (
			<PageLayout>
				<SuccessView
					actionLabel={isUpdate ? "Update" : "Generate"}
					actionLabelPast={isUpdate ? "updated" : "generated"}
					changes={result.changes}
					errors={result.errors}
					failed={result.failed}
					onClose={handleReset}
					success={result.success}
				/>
			</PageLayout>
		);
	}

	// ---- Config ----
	if (view === "config") {
		// Group orphan variables by collection
		const orphanVarsByCollection = orphanedVariables.reduce<Record<string, VariableInfo[]>>((acc, v) => {
			const key = v.collectionName;
			if (!acc[key]) acc[key] = [];
			acc[key].push(v);
			return acc;
		}, {});

		// Group orphan styles by category
		const orphanStylesByCategory = orphanedStyles.reduce<Record<string, { id: string; name: string; category: string }[]>>((acc, s) => {
			const label = s.category === "paint" ? "Paint styles" : s.category === "text" ? "Text styles" : "Effect styles";
			if (!acc[label]) acc[label] = [];
			acc[label].push(s);
			return acc;
		}, {});

		const selectedOrphanCount = orphanVarIds.size + orphanStyleIds.size;

		return (
			<PageLayout>
				{/* Orphan cleanup dialog */}
				<Dialog
					footer={
						<DialogActions>
							<Button onClick={handleOrphanSkip} variant="outline">
								Skip
							</Button>
							<Button
								onClick={handleOrphanConfirm}
								variant={selectedOrphanCount > 0 ? "destructive" : "primary"}
							>
								{selectedOrphanCount > 0
									? `Remove ${selectedOrphanCount} item${selectedOrphanCount !== 1 ? "s" : ""}`
									: "Continue"}
							</Button>
						</DialogActions>
					}
					isOpen={showOrphanDialog}
					maxWidth="sm"
					onClose={() => setShowOrphanDialog(false)}
					title="Unused items detected"
				>
					<p className={styles.orphanDescription}>
						{totalOrphans} item{totalOrphans !== 1 ? "s" : ""} from
						the previous generation {totalOrphans !== 1 ? "are" : "is"} no longer
						in your config. Uncheck any you want to keep.
					</p>
					<div className={styles.orphanList}>
						{Object.entries(orphanVarsByCollection).map(([collection, vars]) => (
							<div className={styles.orphanGroup} key={`var-${collection}`}>
								<span className={styles.orphanCollectionName}>{collection}</span>
								{vars.map((v) => (
									<div className={styles.orphanItem} key={v.id}>
										<Checkbox
											checked={orphanVarIds.has(v.id)}
											id={`orphan-${v.id}`}
											onChange={() => {
												setOrphanVarIds((prev) => {
													const next = new Set(prev);
													if (next.has(v.id)) next.delete(v.id);
													else next.add(v.id);
													return next;
												});
											}}
											size="sm"
										/>
										<label className={styles.orphanName} htmlFor={`orphan-${v.id}`}>
											{v.name}
										</label>
									</div>
								))}
							</div>
						))}
						{Object.entries(orphanStylesByCategory).map(([label, items]) => (
							<div className={styles.orphanGroup} key={`style-${label}`}>
								<span className={styles.orphanCollectionName}>{label}</span>
								{items.map((s) => (
									<div className={styles.orphanItem} key={s.id}>
										<Checkbox
											checked={orphanStyleIds.has(s.id)}
											id={`orphan-${s.id}`}
											onChange={() => {
												setOrphanStyleIds((prev) => {
													const next = new Set(prev);
													if (next.has(s.id)) next.delete(s.id);
													else next.add(s.id);
													return next;
												});
											}}
											size="sm"
										/>
										<label className={styles.orphanName} htmlFor={`orphan-${s.id}`}>
											{s.name}
										</label>
									</div>
								))}
							</div>
						))}
					</div>
				</Dialog>

				<PageBody>
					<SectionHeader
						action={
							isUpdate ? (
								<Button onClick={handleRefresh} size="sm" variant="ghost">
									<RefreshCw size={14} />
									Sync from Figma
								</Button>
							) : undefined
						}
						description={
							isUpdate
								? "Modify your design system and update variables in Figma"
								: "Create a complete design system from your brand colors"
						}
						title="Design System"
						variant="primary"
					/>

					<div className={styles.configSection}>
						{/* ── Brand Colors ── */}
						<Frame>
							<FrameHeader><h3 className={styles.sectionTitle}>Brand Colors</h3></FrameHeader>
							<FramePanel className={styles.sectionContent}>
								<div className={styles.fieldGroup}>
									<label>Brand primary</label>
									<div className={styles.colorInputRow}>
										<input
											aria-label="Primary color picker"
											className={styles.colorSwatch}
											onChange={(e) => setPrimaryColor(e.target.value)}
											type="color"
											value={primaryColor}
										/>
										<Input
											autoComplete="off"
											className={styles.colorHexInput}
											maxLength={7}
											onChange={(e) => {
												let v = e.target.value;
												if (!v.startsWith("#")) v = `#${v}`;
												if (v.length <= 7 && /^#[0-9a-fA-F]*$/.test(v))
													setPrimaryColor(v.toUpperCase());
											}}
											placeholder="#3B82F6"
											spellCheck={false}
											value={primaryColor}
										/>
									</div>
									{generated && (
										<ColorRampPreview
											inputHex={primaryColor}
											scale={generated.primitives.find(
												(s) => s.name === "brand-primary",
											)}
										/>
									)}
								</div>

								<Separator />

								<div className={styles.fieldGroup}>
									<CheckboxWithLabel
										checked={hasSecondary}
										id="has-secondary"
										label="Include brand secondary"
										onChange={setHasSecondary}
									/>
									{hasSecondary && (
										<>
											<div className={styles.colorInputRow}>
												<input
													aria-label="Secondary color picker"
													className={styles.colorSwatch}
													onChange={(e) => setSecondaryColor(e.target.value)}
													type="color"
													value={secondaryColor}
												/>
												<Input
													autoComplete="off"
													className={styles.colorHexInput}
													maxLength={7}
													onChange={(e) => {
														let v = e.target.value;
														if (!v.startsWith("#")) v = `#${v}`;
														if (v.length <= 7 && /^#[0-9a-fA-F]*$/.test(v))
															setSecondaryColor(v.toUpperCase());
													}}
													placeholder="#10B981"
													spellCheck={false}
													value={secondaryColor}
												/>
											</div>
											{generated && (
												<ColorRampPreview
													inputHex={secondaryColor}
													scale={generated.primitives.find(
														(s) => s.name === "brand-secondary",
													)}
												/>
											)}
											<CheckboxWithLabel
												checked={secondaryAsDarkPrimary}
												id="secondary-dark-primary"
												label="Use as primary in dark mode"
												onChange={setSecondaryAsDarkPrimary}
											/>
											{secondaryAsDarkPrimary && (
												<span className={styles.hint}>
													Semantic --primary will reference brand secondary in dark mode
												</span>
											)}
										</>
									)}
								</div>

							</FramePanel>
						</Frame>

						{/* ── Surface Colors ── */}
						<Frame>
							<FrameHeader className={styles.sectionTitleFrame}>
								<h3 className={styles.sectionTitle}>Surface Colors</h3>
								{(surfaceSaturation !== 100 || surfaceHueBlend !== 0 || surfaceHueShift !== 0 || surfaceBrightness !== 0) && (
									<Button
										onClick={() => {
											setSurfaceSaturation(100);
											setSurfaceHueBlend(0);
											setSurfaceHueShift(0);
											setSurfaceBrightness(0);
										}}
										size="sm"
										variant="secondary"
									>
										<RefreshCw size={12} />
										Reset
									</Button>
								)}
							</FrameHeader>
							<FramePanel className={styles.sectionContent}>
								<div className={styles.surfaceSliderGrid}>
									<div className={styles.fieldGroup}>
										<label>Saturation <span className={styles.sliderValue}>{surfaceSaturation}%</span></label>
										<input
											aria-label="Surface color saturation"
											className={styles.rangeSlider}
											max={500}
											min={0}
											onChange={(e) => setSurfaceSaturation(Number(e.target.value))}
											step={5}
											type="range"
											value={surfaceSaturation}
										/>
									</div>
									<div className={styles.fieldGroup}>
										<label>Brightness <span className={styles.sliderValue}>{surfaceBrightness > 0 ? "+" : ""}{surfaceBrightness}</span></label>
										<input
											aria-label="Surface brightness offset"
											className={styles.rangeSlider}
											max={50}
											min={-50}
											onChange={(e) => setSurfaceBrightness(Number(e.target.value))}
											step={5}
											type="range"
											value={surfaceBrightness}
										/>
									</div>
									<div className={styles.fieldGroup}>
										<label>Brand tint <span className={styles.sliderValue}>{surfaceHueBlend}%</span></label>
										<input
											aria-label="Blend brand primary hue into surfaces"
											className={styles.rangeSlider}
											max={100}
											min={0}
											onChange={(e) => setSurfaceHueBlend(Number(e.target.value))}
											step={5}
											type="range"
											value={surfaceHueBlend}
										/>
									</div>
									<div className={styles.fieldGroup}>
										<label>Hue shift <span className={styles.sliderValue}>{surfaceHueShift > 0 ? "+" : ""}{surfaceHueShift}°</span></label>
										<input
											aria-label="Surface hue rotation across lightness"
											className={styles.rangeSlider}
											max={60}
											min={-60}
											onChange={(e) => setSurfaceHueShift(Number(e.target.value))}
											step={5}
											type="range"
											value={surfaceHueShift}
										/>
									</div>
								</div>
								<Separator />
								<div className={styles.surfaceToneColumns}>
									<SurfaceToneSelector
										brightness={surfaceBrightness}
										customHex={grayLightHex}
										generated={generated}
										hueBlend={surfaceHueBlend}
										hueShift={surfaceHueShift}
										label="Light"
										mode="light"
										onChangeHex={setGrayLightHex}
										onChangePreset={setGrayLight}
										preset={grayLight}
										primaryColor={primaryColor}
										saturation={surfaceSaturation}
									/>
									<SurfaceToneSelector
										brightness={surfaceBrightness}
										customHex={grayDarkHex}
										generated={generated}
										hueBlend={surfaceHueBlend}
										hueShift={surfaceHueShift}
										label="Dark"
										mode="dark"
										onChangeHex={setGrayDarkHex}
										onChangePreset={setGrayDark}
										preset={grayDark}
										primaryColor={hasSecondary && secondaryAsDarkPrimary ? secondaryColor : primaryColor}
										saturation={surfaceSaturation}
									/>
								</div>
							</FramePanel>
						</Frame>

						{/* ── Status Colors ── */}
						<Frame>
							<FrameHeader><h3 className={styles.sectionTitle}>Status Colors</h3></FrameHeader>
							<FramePanel className={styles.sectionContent}>
								<div className={styles.statusColorGrid}>
									{(
										[
											{ key: "danger", label: "Destructive", fallback: "#EF4444" },
											{ key: "success", label: "Success", fallback: "#10B981" },
											{ key: "warning", label: "Warning", fallback: "#F59E0B" },
											{ key: "info", label: "Info", fallback: "#3B82F6" },
										] as const
									).map(({ key, label, fallback }) => (
										<div className={styles.statusColorItem} key={key}>
											<label>{label}</label>
											<div className={styles.colorInputRow}>
												<input
													aria-label={`${label} color picker`}
													className={styles.colorSwatch}
													onChange={(e) =>
														setStatusColors({ ...statusColors, [key]: e.target.value })
													}
													type="color"
													value={statusColors[key] || fallback}
												/>
												<Input
													autoComplete="off"
													className={styles.colorHexInput}
													maxLength={7}
													onChange={(e) => {
														let v = e.target.value;
														if (!v.startsWith("#")) v = `#${v}`;
														if (v.length <= 7 && /^#[0-9a-fA-F]*$/.test(v))
															setStatusColors({ ...statusColors, [key]: v.toUpperCase() });
													}}
													placeholder={fallback}
													spellCheck={false}
													value={statusColors[key] ?? ""}
												/>
											</div>
											{generated && (
												<ColorRampPreview
													inputHex={statusColors[key] || fallback}
													scale={generated.primitives.find(
														(s) => s.name === key,
													)}
												/>
											)}
										</div>
									))}
								</div>
							</FramePanel>
						</Frame>

						{/* ── Radius ── */}
						<Frame>
							<FrameHeader><h3 className={styles.sectionTitle}>Radius</h3></FrameHeader>
							<FramePanel className={styles.sectionContent}>
								<div className={styles.fieldGroup}>
									<label>Radius anchor (px)</label>
									<div className={styles.radiusAnchorRow}>
										<NumberField
											className={styles.radiusAnchorInput}
											max={32}
											min={0}
											onBlur={() =>
												setRadiusAnchor(
													Math.min(32, Math.max(0, radiusAnchor || 0)),
												)
											}
											onChange={setRadiusAnchor}
											value={radiusAnchor}
										/>
										<span className={styles.hint}>
											Base size — smaller and larger steps are generated automatically
										</span>
									</div>
									{generated?.radiusScale && (
										<RadiusPreview scale={generated.radiusScale} />
									)}
								</div>
							</FramePanel>
						</Frame>

						{/* ── Typography ── */}
						<Frame>
							<FrameHeader><h3 className={styles.sectionTitle}>Typography</h3></FrameHeader>
							<FramePanel className={styles.sectionContent}>
								<div className={styles.typescaleConfig}>
									<div className={styles.typescaleRow}>
										<div className={styles.optionGroup}>
											<label>Base (px)</label>
											<NumberField
												max={48}
												min={8}
												onBlur={() =>
													setTypescale({
														...typescale,
														base: Math.min(
															48,
															Math.max(8, typescale.base || 16),
														),
													})
												}
												onChange={(v) =>
													setTypescale({ ...typescale, base: v })
												}
												value={typescale.base}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Body LH (%)</label>
											<NumberField
												max={200}
												min={100}
												onBlur={() =>
													setTypescale({
														...typescale,
														lineHeightBody: Math.min(
															200,
															Math.max(100, typescale.lineHeightBody || 150),
														),
													})
												}
												onChange={(v) =>
													setTypescale({ ...typescale, lineHeightBody: v })
												}
												value={typescale.lineHeightBody}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Heading LH (%)</label>
											<NumberField
												max={200}
												min={100}
												onBlur={() =>
													setTypescale({
														...typescale,
														lineHeightHeading: Math.min(
															200,
															Math.max(100, typescale.lineHeightHeading || 125),
														),
													})
												}
												onChange={(v) =>
													setTypescale({ ...typescale, lineHeightHeading: v })
												}
												value={typescale.lineHeightHeading}
											/>
										</div>
									</div>

									<div className={styles.optionGroup}>
										<label>Scale ratio</label>
										<div className={styles.ratioSelector}>
											{Object.entries(TYPESCALE_RATIOS).map(([key, r]) => (
												<button
													aria-pressed={typescale.ratio === key}
													className={styles.ratioOption}
													data-selected={typescale.ratio === key}
													key={key}
													onClick={() =>
														setTypescale({ ...typescale, ratio: key })
													}
													title={`${r.label} (${r.value})`}
													type="button"
												>
													<span className={styles.ratioLabel}>{r.label}</span>
													<span className={styles.ratioValue}>{r.value}</span>
												</button>
											))}
										</div>
									</div>

									<div className={styles.typescaleRow}>
										<div className={styles.optionGroup}>
											<label>Steps up</label>
											<NumberField
												max={10}
												min={0}
												onBlur={() =>
													setTypescale({
														...typescale,
														stepsUp: Math.min(
															10,
															Math.max(0, typescale.stepsUp || 0),
														),
													})
												}
												onChange={(v) =>
													setTypescale({ ...typescale, stepsUp: v })
												}
												value={typescale.stepsUp}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Steps down</label>
											<NumberField
												max={2}
												min={0}
												onBlur={() =>
													setTypescale({
														...typescale,
														stepsDown: Math.min(
															2,
															Math.max(0, typescale.stepsDown || 0),
														),
													})
												}
												onChange={(v) =>
													setTypescale({ ...typescale, stepsDown: v })
												}
												value={typescale.stepsDown}
											/>
										</div>
									</div>
								</div>

								<Separator />

								<TypescalePreview config={typescale} />

								<Separator />

								<div className={styles.fieldGroup}>
									<label>Font families</label>
									<div className={styles.fontInputs}>
										<div className={styles.fontInputRow}>
											<label>Sans</label>
											<FontSelect
												fonts={availableFonts}
												onChange={(v) => setFonts({ ...fonts, sans: v })}
												value={fonts.sans ?? ""}
											/>
										</div>
										<div className={styles.fontInputRow}>
											<label>Serif</label>
											<FontSelect
												fonts={availableFonts}
												onChange={(v) => setFonts({ ...fonts, serif: v })}
												value={fonts.serif ?? ""}
											/>
										</div>
										<div className={styles.fontInputRow}>
											<label>Mono</label>
											<FontSelect
												fonts={availableFonts}
												onChange={(v) => setFonts({ ...fonts, mono: v })}
												value={fonts.mono ?? ""}
											/>
										</div>
									</div>
								</div>
							</FramePanel>
						</Frame>

					</div>

				</PageBody>
				<PageFooter>
					<Button onClick={handleShuffle} variant="ghost">
						<Dices size={14} />
						Shuffle Colors
					</Button>
					<CopyButton disabled={!generated} label="CSS" text={getCssText}>
						Copy CSS
					</CopyButton>
					<Button disabled={!generated} onClick={handleSubmit} variant="primary">
						<Wand2 size={14} />
						{isUpdate ? "Update in Figma" : "Create in Figma"}
					</Button>
				</PageFooter>
			</PageLayout>
		);
	}

	return null;
}

// --- Inline color ramp preview ---

function ColorRampPreview({
	scale,
	inputHex,
}: {
	scale: { hexValues: Record<number, string> } | undefined;
	inputHex?: string;
}) {
	if (!scale) return null;
	const mapped500 = scale.hexValues[500];
	const differs = inputHex && mapped500 && inputHex.toUpperCase() !== mapped500.toUpperCase();
	return (
		<div className={styles.colorRamp}>
			<div className={styles.colorRampSwatches}>
				{SHADE_STEPS.map((step) => (
					<div
						className={styles.colorRampSwatch}
						key={step}
						style={{ backgroundColor: scale.hexValues[step] }}
						title={`${step}: ${scale.hexValues[step]}`}
					/>
				))}
			</div>
			<div className={styles.colorRampLabels}>
				<span>50</span>
				<span>{differs ? `500: ${mapped500}` : "500"}</span>
				<span>950</span>
			</div>
		</div>
	);
}

// --- Radius visual preview ---

function RadiusPreview({ scale }: { scale: Record<string, number> }) {
	const entries = Object.entries(scale).filter(
		([name]) => name !== "none" && name !== "full",
	);

	return (
		<div className={styles.radiusPreview}>
			{entries.map(([name, px]) => (
				<div className={styles.radiusItem} key={name}>
					<div
						className={styles.radiusSample}
						style={{ borderRadius: `${Math.min(px, 24)}px` }}
					/>
					<span className={styles.radiusLabel}>{name}</span>
					<span className={styles.radiusValue}>{px}px</span>
				</div>
			))}
		</div>
	);
}

// --- Typescale live preview ---

function TypescalePreview({ config }: { config: TypescaleConfig }) {
	const steps = useMemo(() => computeTypescale(config), [config]);

	return (
		<div className={styles.typescalePreview}>
			{steps.map((step) => (
				<div className={styles.typescalePreviewRow} key={step.name}>
					<div className={styles.typescaleMeta}>
						<span className={styles.typescaleName}>{step.name}</span>
						<span className={styles.typescaleSize}>
							{step.size}/{step.lineHeight}
						</span>
					</div>
					<span
						className={styles.typescaleSample}
						style={{
							fontSize: `${step.size}px`,
							lineHeight: `${step.lineHeight}px`,
						}}
					>
						Aa
					</span>
				</div>
			))}
		</div>
	);
}

// --- Surface tone selector (light or dark) ---

function SurfaceToneSelector({
	label,
	mode,
	preset,
	customHex,
	generated,
	onChangePreset,
	onChangeHex,
	saturation = 100,
	brightness = 0,
	hueBlend = 0,
	hueShift = 0,
	primaryColor,
}: {
	label: string;
	mode: "light" | "dark";
	preset: string;
	customHex: string;
	generated: GeneratedSystem | null;
	onChangePreset: (name: string) => void;
	onChangeHex: (hex: string) => void;
	saturation?: number;
	brightness?: number;
	hueBlend?: number;
	hueShift?: number;
	primaryColor?: string;
}) {
	const satMul = saturation / 100;
	const primaryRgb = primaryColor ? hexToRgb(primaryColor) : null;
	const primaryHue = primaryRgb ? rgbToOklch(primaryRgb.r, primaryRgb.g, primaryRgb.b).h : 0;
	const adjustOpts = { hueShift, primaryBlend: hueBlend / 100, primaryHue, brightness: brightness / 100 };
	const isCustom = /^#[0-9a-fA-F]{6}$/.test(customHex);

	// Preview colors: use generated neutral scale when available
	// (custom hex always, or Radix presets when saturation is adjusted)
	const generatedColors = generated
		? (mode === "light"
			? generated.neutralScaleLight?.light
			: generated.neutralScaleDark?.dark)
		: undefined;
	const previewColors = (isCustom || generatedColors) ? generatedColors : undefined;

	return (
		<div className={styles.fieldGroup}>
			<label>{label}</label>
			<div className={styles.colorInputRow}>
				<input
					aria-label={`${label} custom surface color`}
					className={styles.colorSwatch}
					onChange={(e) => onChangeHex(e.target.value)}
					type="color"
					value={isCustom ? customHex : "#888888"}
				/>
				<Input
					autoComplete="off"
					className={styles.colorHexInput}
					maxLength={7}
					onChange={(e) => {
						let v = e.target.value;
						if (!v.startsWith("#")) v = `#${v}`;
						if (v.length <= 7 && /^#[0-9a-fA-F]*$/.test(v))
							onChangeHex(v.toUpperCase());
					}}
					placeholder="Custom hex or pick preset"
					spellCheck={false}
					value={customHex}
				/>
				{isCustom && (
					<Button
						onClick={() => onChangeHex("")}
						size="sm"
						variant="ghost"
					>
						Clear
					</Button>
				)}
			</div>
			{isCustom && (
				<span className={styles.hint}>
					Your color's hue will be used to tint a neutral surface ramp
				</span>
			)}
			{isCustom && previewColors && (
				<div className={styles.grayPreview}>
					{previewColors.map((hex, i) => (
						<div
							className={styles.grayStep}
							key={i}
							style={{ backgroundColor: hex }}
							title={`Step ${i + 1}: ${hex}`}
						/>
					))}
				</div>
			)}
			<div className={styles.graySelector}>
				{RADIX_GRAYS.map((g) => (
					<button
						aria-label={`${g.label} surface tone`}
						aria-pressed={!isCustom && preset === g.name}
						className={styles.grayOption}
						data-selected={!isCustom && preset === g.name}
						key={g.name}
						onClick={() => {
							onChangeHex("");
							onChangePreset(g.name);
						}}
						title={g.label}
						type="button"
					>
						<div className={styles.grayPreview}>
							{adjustSaturation(mode === "light" ? g.light : g.dark, satMul, adjustOpts).map((hex, i) => (
								<div
									className={styles.grayStep}
									key={i}
									style={{ backgroundColor: hex }}
								/>
							))}
						</div>
						<span className={styles.grayName}>{g.name}</span>
					</button>
				))}
			</div>
		</div>
	);
}

// --- Searchable font picker ---

function FontSelect({
	fonts,
	value,
	onChange,
}: {
	fonts: string[];
	value: string;
	onChange: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const filtered = useMemo(() => {
		if (!search) return fonts.slice(0, 80);
		const lower = search.toLowerCase();
		return fonts.filter((f) => f.toLowerCase().includes(lower)).slice(0, 80);
	}, [fonts, search]);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
				setSearch("");
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	const handleSelect = (font: string) => {
		onChange(font);
		setOpen(false);
		setSearch("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setOpen(false);
			setSearch("");
		}
	};

	return (
		<div className={styles.fontSelect} ref={containerRef}>
			<button
				className={styles.fontSelectTrigger}
				onClick={() => {
					setOpen(!open);
					if (!open) setTimeout(() => inputRef.current?.focus(), 0);
				}}
				type="button"
			>
				<span className={styles.fontSelectValue} style={value ? { fontFamily: value } : undefined}>
					{value || "Select font…"}
				</span>
				<ChevronDown className={styles.fontSelectChevron} size={14} />
			</button>
			{open && (
				<div className={styles.fontSelectDropdown}>
					<div className={styles.fontSelectSearch}>
						<input
							autoComplete="off"
							className={styles.fontSelectInput}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Search fonts…"
							ref={inputRef}
							spellCheck={false}
							type="text"
							value={search}
						/>
					</div>
					<div className={styles.fontSelectList} ref={listRef}>
						{filtered.length === 0 && (
							<div className={styles.fontSelectEmpty}>No matching fonts — try a different search</div>
						)}
						{filtered.map((font) => (
							<button
								className={styles.fontSelectItem}
								data-selected={font === value}
								key={font}
								onClick={() => handleSelect(font)}
								type="button"
							>
								<span style={{ fontFamily: font }}>{font}</span>
								{font === value && <Check size={14} />}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

