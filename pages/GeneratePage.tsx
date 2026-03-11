import { ArrowLeft, Check, ChevronDown, ClipboardCopy, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProgressView, SuccessView } from "../components/import";
import {
	Frame,
	FrameHeader,
	FramePanel,
	LoadingState,
	ScrollArea,
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
	type StatusColorOverrides,
	generateCss,
	generateDesignSystem,
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
import type { DesignToken, ImportResults } from "../types/tokens";
import styles from "./GeneratePage.module.css";

type ViewState = "loading" | "config" | "preview" | "progress" | "success";

// ---------------------------------------------------------------------------
// Extract BrandConfig from existing Figma variables
// ---------------------------------------------------------------------------

interface ExtractedConfig {
	primaryColor: string;
	secondaryColor: string | null;
	grayName: string;
	darkMode: boolean;
	radiusAnchor: number;
	fonts: FontOverrides;
	statusColors: StatusColorOverrides;
}

function rgbStringToHex(rgb: string): string | null {
	const match = rgb.match(/r:\s*([\d.]+).*?g:\s*([\d.]+).*?b:\s*([\d.]+)/);
	if (!match) return null;
	const r = Math.round(Number.parseFloat(match[1]) * 255);
	const g = Math.round(Number.parseFloat(match[2]) * 255);
	const b = Math.round(Number.parseFloat(match[3]) * 255);
	return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
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

	const primaryVar = find("primitives", "color/brand/500");
	let primaryColor = "#3B82F6";
	if (primaryVar) {
		const firstMode = Object.keys(primaryVar.valuesByMode)[0];
		if (firstMode) {
			const hex = rgbStringToHex(primaryVar.valuesByMode[firstMode]);
			if (hex) primaryColor = hex;
		}
	}

	const secondaryVar = find("primitives", "color/secondary/500");
	let secondaryColor: string | null = null;
	if (secondaryVar) {
		const firstMode = Object.keys(secondaryVar.valuesByMode)[0];
		if (firstMode) {
			secondaryColor = rgbStringToHex(secondaryVar.valuesByMode[firstMode]);
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

	const semanticVar = variables.find(
		(v) => v.collectionName.toLowerCase() === "semantics",
	);
	const darkMode = semanticVar
		? Object.keys(semanticVar.valuesByMode).length >= 2
		: true;

	let radiusAnchor = 10;
	const radiusVar = find("primitives", "rounded/md");
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
			const firstMode = Object.keys(statusVar.valuesByMode)[0];
			if (firstMode) {
				const hex = rgbStringToHex(statusVar.valuesByMode[firstMode]);
				if (hex) statusColors[key] = hex;
			}
		}
	}

	return {
		primaryColor,
		secondaryColor,
		grayName,
		darkMode,
		radiusAnchor,
		fonts,
		statusColors,
	};
}

// ---------------------------------------------------------------------------
// Token type grouping
// ---------------------------------------------------------------------------

function getTokenTypeGroup(type: string): string {
	switch (type) {
		case "color":
			return "Colors";
		case "spacing":
			return "Spacing";
		case "borderRadius":
			return "Radius";
		case "boxShadow":
			return "Shadows";
		case "fontSize":
		case "lineHeight":
			return "Typography";
		case "fontFamily":
		case "fontWeight":
			return "Fonts";
		case "duration":
			return "Durations";
		default:
			if (type === "number") return "Typography";
			return "Other";
	}
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
	const [darkMode, setDarkMode] = useState(true);
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
						}
						setGrayName(extracted.grayName);
						setDarkMode(extracted.darkMode);
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
					showError(errData?.message || "Operation failed");
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
			darkMode,
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
		darkMode,
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
			<div className={styles.page}>
				<LoadingState message="Loading variables from Figma…" />
			</div>
		);
	}

	// ---- Progress ----
	if (view === "progress") {
		return (
			<div className={styles.page}>
				<ProgressView message={isUpdate ? "Updating variables in Figma…" : "Creating variables in Figma…"} />
			</div>
		);
	}

	// ---- Success ----
	if (view === "success" && result) {
		return (
			<div className={styles.page}>
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
			</div>
		);
	}

	// ---- Config ----
	if (view === "config") {
		return (
			<div className={styles.page}>
				<div className={styles.pageBody}>
					<SectionHeader
						action={
							isUpdate ? (
								<Button onClick={handleRefresh} size="sm" variant="ghost">
									<RefreshCw size={14} />
									Reload
								</Button>
							) : undefined
						}
						description={
							isUpdate
								? "Modify your design system and update in Figma"
								: "Create a complete token system from your brand colors"
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
											scale={generated.primitives.find(
												(s) => s.name === "brand",
											)}
										/>
									)}
								</div>

								<Separator />

								<div className={styles.fieldGroup}>
									<CheckboxWithLabel
										checked={hasSecondary}
										id="has-secondary"
										label="Secondary / accent color"
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
													scale={generated.primitives.find(
														(s) => s.name === "secondary",
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
												<div className={styles.grayPreview}>
													{[0, 2, 4, 7, 10, 11].map((i) => (
														<div
															className={styles.grayDot}
															key={i}
															style={{ backgroundColor: g.light[i] }}
														/>
													))}
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
										</div>
									))}
								</div>
							</FramePanel>
						</Frame>

						{/* ── Appearance ── */}
						<Frame>
							<FrameHeader><h3 className={styles.sectionTitle}>Appearance</h3></FrameHeader>
							<FramePanel className={styles.sectionContent}>
								<CheckboxWithLabel
									checked={darkMode}
									id="dark-mode"
									label="Generate Light + Dark modes"
									onChange={setDarkMode}
								/>

								<Separator />

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
											Base "lg" — other sizes derived via offsets
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
											<label>Body line height (%)</label>
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
												step={5}
												value={typescale.lineHeightBody}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Heading line height (%)</label>
											<NumberField
												max={175}
												min={100}
												onBlur={() =>
													setTypescale({
														...typescale,
														lineHeightHeading: Math.min(
															175,
															Math.max(
																100,
																typescale.lineHeightHeading || 125,
															),
														),
													})
												}
												onChange={(v) =>
													setTypescale({ ...typescale, lineHeightHeading: v })
												}
												step={5}
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
										<div className={styles.optionGroup} />
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
				</div>
				<div className={styles.actions}>
					<Button
						disabled={!generated}
						onClick={() => setView("preview")}
						variant="primary"
					>
						<Sparkles size={14} />
						Preview
					</Button>
				</div>
			</div>
		);
	}

	// ---- Preview ----
	if (view === "preview" && generated) {
		return (
			<div className={styles.page}>
				<div className={styles.pageBody}>
					<SectionHeader
						description={
							isUpdate
								? `${generated.stats.totalCount} tokens will be updated`
								: `${generated.stats.totalCount} tokens across 4 collections`
						}
						title="Preview"
						variant="primary"
					/>

					<div className={styles.previewSection}>
						{/* Stats bar */}
						<div className={styles.statsBar}>
							<div className={styles.statItem}>
								<strong>{generated.stats.primitiveCount}</strong> primitives
							</div>
							<div className={styles.statItem}>
								<strong>{generated.stats.abstractionCount}</strong>{" "}
								abstractions
							</div>
							<div className={styles.statItem}>
								<strong>{generated.stats.semanticCount}</strong> semantics
							</div>
						</div>

						{/* Color scale previews */}
						<div className={styles.scalePreview}>
							{generated.primitives.map((scale) => (
								<div className={styles.scaleRow} key={scale.name}>
									<span className={styles.scaleLabel}>{scale.name}</span>
									<div className={styles.scaleSwatches}>
										{SHADE_STEPS.map((step) => (
											<div
												className={styles.scaleSwatch}
												key={step}
												style={{
													backgroundColor: scale.hexValues[step],
												}}
												title={`${step}: ${scale.hexValues[step]}`}
											/>
										))}
									</div>
								</div>
							))}

							{/* Radix gray scale (1-12) */}
							{generated.radixGray && (
								<div className={styles.scaleRow}>
									<span className={styles.scaleLabel}>
										{generated.radixGray.name} (surface)
									</span>
									<div className={styles.scaleSwatches}>
										{generated.radixGray.light.map((hex, i) => (
											<div
												className={styles.scaleSwatch}
												key={i}
												style={{ backgroundColor: hex }}
												title={`${i + 1}: ${hex}`}
											/>
										))}
									</div>
									{darkMode && (
										<div className={styles.scaleSwatches}>
											{generated.radixGray.dark.map((hex, i) => (
												<div
													className={styles.scaleSwatch}
													key={i}
													style={{ backgroundColor: hex }}
													title={`${i + 1}: ${hex} (dark)`}
												/>
											))}
										</div>
									)}
								</div>
							)}
						</div>

						{/* Radius preview */}
						<RadiusPreview scale={generated.radiusScale} />

						{/* Token list */}
						<TokenPreviewList generated={generated} />

					</div>
				</div>
				<div className={styles.actions}>
					<Button onClick={() => setView("config")} variant="ghost">
						<ArrowLeft size={14} />
						Back
					</Button>
					<Button onClick={handleCopyCss} variant="ghost">
						<ClipboardCopy size={14} />
						Copy CSS
					</Button>
					<Button onClick={handleSubmit} variant="primary">
						<Wand2 size={14} />
						{isUpdate ? "Update in Figma" : "Create in Figma"}
					</Button>
				</div>
			</div>
		);
	}

	return null;
}

// --- Inline color ramp preview ---

function ColorRampPreview({
	scale,
}: {
	scale: { hexValues: Record<number, string> } | undefined;
}) {
	if (!scale) return null;
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
				<span>500</span>
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

// --- Token preview list component ---

const TOKEN_TYPE_ORDER = [
	"Colors",
	"Spacing",
	"Radius",
	"Shadows",
	"Typography",
	"Fonts",
	"Durations",
	"Other",
] as const;

function TokenPreviewList({ generated }: { generated: GeneratedSystem }) {
	const [expanded, setExpanded] = useState(false);
	const limit = expanded ? generated.tokens.length : 20;

	const groupedCategories = useMemo(() => {
		const categories = ["primitives", "abstractions", "semantics"] as const;
		return categories
			.map((cat) => {
				const catTokens = generated.tokens.filter((t) => t.category === cat);
				if (catTokens.length === 0) return null;

				const seen = new Set<string>();
				const unique = catTokens.filter((t) => {
					if (seen.has(t.figmaName)) return false;
					seen.add(t.figmaName);
					return true;
				});

				const grouped = new Map<string, typeof unique>();
				for (const token of unique) {
					const group = getTokenTypeGroup(token.type);
					const arr = grouped.get(group) ?? [];
					if (!grouped.has(group)) grouped.set(group, arr);
					arr.push(token);
				}

				const sortedGroups = TOKEN_TYPE_ORDER.filter((g) => grouped.has(g)).map(
					(g) => ({ group: g, tokens: grouped.get(g) ?? [] }),
				);

				return { cat, unique, sortedGroups };
			})
			.filter(Boolean) as {
			cat: string;
			unique: DesignToken[];
			sortedGroups: { group: string; tokens: DesignToken[] }[];
		}[];
	}, [generated.tokens]);

	const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

	return (
		<ScrollArea className={styles.tokenPreviewList}>
			{groupedCategories.map(({ cat, unique, sortedGroups }) => (
				<div key={cat}>
					<div className={styles.tokenCategoryHeader}>
						{cat} ({unique.length})
					</div>
					{sortedGroups.map(({ group, tokens: groupTokens }) => {
						const displayed = groupTokens.slice(0, limit);
						return (
							<div key={group}>
								{sortedGroups.length > 1 && (
									<div className={styles.tokenSubgroupHeader}>
										{group} ({groupTokens.length})
									</div>
								)}
								{displayed.map((token) => (
									<div className={styles.tokenRow} key={token.id}>
										<TokenIndicator token={token} />
										<span className={styles.tokenName}>{token.figmaName}</span>
										<span className={styles.tokenValue}>
											{token.originalValue}
										</span>
									</div>
								))}
							</div>
						);
					})}
				</div>
			))}

			{generated.tokens.length > 40 && (
				<Button onClick={toggleExpanded} size="sm" variant="ghost">
					{expanded
						? "Show less"
						: `Show all ${generated.tokens.length} tokens`}
				</Button>
			)}
		</ScrollArea>
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
							<div className={styles.fontSelectEmpty}>No fonts found</div>
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

// --- Token indicator dot ---

const NON_COLOR_DOT_STYLE = {
	backgroundColor: "transparent",
	border: "1px dashed var(--border)",
} as const;

const TokenIndicator = React.memo(function TokenIndicator({
	token,
}: {
	token: Pick<DesignToken, "type" | "value">;
}) {
	if (
		token.type === "color" &&
		typeof token.value === "object" &&
		"r" in token.value
	) {
		return (
			<div
				className={styles.tokenColorDot}
				style={{
					backgroundColor: `rgb(${Math.round(token.value.r * 255)}, ${Math.round(token.value.g * 255)}, ${Math.round(token.value.b * 255)})`,
				}}
			/>
		);
	}
	return <div className={styles.tokenColorDot} style={NON_COLOR_DOT_STYLE} />;
});
