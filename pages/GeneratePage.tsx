import { Check, ChevronDown, ClipboardCopy, RefreshCw, Wand2 } from "lucide-react";
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
import { CheckboxWithLabel } from "../components/ui/Checkbox";
import { Input } from "../components/ui/Input";
import { NumberField } from "../components/ui/NumberField";
import { SHADE_STEPS } from "../generators/color-scale";
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
	grayName: string;
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
		find("primitives", "color/brand-primary/500") ?? find("primitives", "color/brand/500");
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
		find("primitives", "color/brand-secondary/500") ?? find("primitives", "color/secondary/500");
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

	let grayName = "slate";
	for (const gray of RADIX_GRAYS) {
		const grayVar = variables.find(
			(v) =>
				v.collectionName.toLowerCase().startsWith("primitives") &&
				v.name === `color/${gray.name}/1`,
		);
		if (grayVar) {
			grayName = gray.name;
			break;
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

		// Derive line heights
		const baseLhVar = find("primitives", "font/typescale/base/line-height/md");
		let lineHeightBody = 150;
		if (baseLhVar && base > 0) {
			const lhMode = Object.keys(baseLhVar.valuesByMode)[0];
			if (lhMode) {
				const lh = Number.parseFloat(baseLhVar.valuesByMode[lhMode]);
				lineHeightBody = Math.round((lh / base) * 100);
			}
		}

		let lineHeightHeading = 125;
		if (lgSizeVar) {
			const lgLhVar = find("primitives", "font/typescale/lg/line-height/md");
			if (lgLhVar) {
				const lgMode = Object.keys(lgSizeVar.valuesByMode)[0];
				const lhMode = Object.keys(lgLhVar.valuesByMode)[0];
				if (lgMode && lhMode) {
					const lgSize = Number.parseFloat(lgSizeVar.valuesByMode[lgMode]);
					const lgLh = Number.parseFloat(lgLhVar.valuesByMode[lhMode]);
					if (lgSize > 0) lineHeightHeading = Math.round((lgLh / lgSize) * 100);
				}
			}
		}

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
		grayName,
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
	const { showError, showSuccess } = useToast();

	// Config state
	const [primaryColor, setPrimaryColor] = useState("#3B82F6");
	const [secondaryColor, setSecondaryColor] = useState("#10B981");
	const [hasSecondary, setHasSecondary] = useState(false);
	const [grayName, setGrayName] = useState("slate");
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

	// Result state
	const [result, setResult] = useState<ImportResults | null>(null);

	// Available fonts from Figma
	const [availableFonts, setAvailableFonts] = useState<string[]>([]);

	// Load existing variables and available fonts on mount
	useEffect(() => {
		postMessage({ type: "get-variables" });
		postMessage({ type: "get-available-fonts" });
	}, [postMessage]);

	// Handle messages
	useFigmaMessage(
		useCallback(
			(msg) => {
				if (msg.type === "variables-list") {
					const data = msg.data as {
						variables: VariableInfo[];
						collections: CollectionInfo[];
					};

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
						setGrayName(extracted.grayName);
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
				if (msg.type === "available-fonts") {
					const data = msg.data as { fonts: string[] };
					setAvailableFonts(data.fonts);
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

		return {
			primary: primaryColor,
			secondary: hasSecondary ? secondaryColor : undefined,
			grayName,
			darkMode: true,
			radius: radiusAnchor,
			typescale,
			fonts,
			statusColors: hasStatusOverrides ? statusColors : undefined,
		};
	}, [
		primaryColor,
		secondaryColor,
		hasSecondary,
		grayName,
		radiusAnchor,
		typescale,
		fonts,
		statusColors,
	]);

	// Generate preview
	const generated: GeneratedSystem | null = useMemo(() => {
		if (!brandConfig) return null;
		return generateDesignSystem(brandConfig);
	}, [brandConfig]);

	const handleSubmit = useCallback(() => {
		if (!generated) return;
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
	}, [generated, isUpdate, postMessage]);

	const handleCopyCss = useCallback(() => {
		if (!brandConfig) return;
		const css = generateCss(brandConfig);
		navigator.clipboard.writeText(css).then(
			() => showSuccess("CSS copied to clipboard"),
			() => showError("Failed to copy CSS"),
		);
	}, [brandConfig, showSuccess, showError]);

	const handleRefresh = useCallback(() => {
		setView("loading");
		postMessage({ type: "get-variables" });
	}, [postMessage]);

	const handleReset = useCallback(() => {
		setView("config");
		setResult(null);
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
					onImportMore={handleReset}
					success={result.success}
				/>
			</PageLayout>
		);
	}

	// ---- Config ----
	if (view === "config") {
		return (
			<PageLayout>
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
									<label>Primary color</label>
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
										label="Include secondary color"
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
										</>
									)}
								</div>

								<Separator />

								<div className={styles.fieldGroup}>
									<label>Neutral palette</label>
									<div className={styles.graySelector}>
										{RADIX_GRAYS.map((g) => (
											<button
												aria-label={`${g.label} neutral palette`}
												aria-pressed={grayName === g.name}
												className={styles.grayOption}
												data-selected={grayName === g.name}
												key={g.name}
												onClick={() => setGrayName(g.name)}
												title={g.label}
												type="button"
											>
												<div className={styles.grayScalePreview}>
													<div className={styles.grayPreview}>
														{g.light.map((hex, i) => (
															<div
																className={styles.grayStep}
																key={i}
																style={{ backgroundColor: hex }}
															/>
														))}
													</div>
													<div className={styles.grayPreview}>
														{g.dark.map((hex, i) => (
															<div
																className={styles.grayStep}
																key={i}
																style={{ backgroundColor: hex }}
															/>
														))}
													</div>
												</div>
												<span className={styles.grayName}>{g.name}</span>
											</button>
										))}
									</div>
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
					<Button disabled={!generated} onClick={handleCopyCss} variant="ghost">
						<ClipboardCopy size={14} />
						Copy CSS
					</Button>
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

