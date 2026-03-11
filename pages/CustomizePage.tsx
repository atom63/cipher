import { ArrowLeft, ClipboardCopy, RefreshCw, Wand2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ProgressView, SuccessView } from "../components/import";
import {
	EmptyState,
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
import type { ImportResults } from "../types/tokens";
import styles from "./GeneratePage.module.css";

type ViewState = "loading" | "empty" | "config" | "preview" | "progress" | "success";

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
	// Parse "r: 0.23, g: 0.51, b: 0.96" or "{r: 0.23, g: 0.51, b: 0.96}" format
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
	// Find variables by collection and name
	const find = (collectionPrefix: string, name: string): VariableInfo | undefined =>
		variables.find(
			(v) =>
				v.collectionName.toLowerCase().startsWith(collectionPrefix) &&
				v.name === name,
		);

	// Extract primary color from color/brand/500 in primitives
	const primaryVar = find("primitives", "color/brand/500");
	let primaryColor = "#3B82F6";
	if (primaryVar) {
		const firstMode = Object.keys(primaryVar.valuesByMode)[0];
		if (firstMode) {
			const hex = rgbStringToHex(primaryVar.valuesByMode[firstMode]);
			if (hex) primaryColor = hex;
		}
	}

	// Extract secondary color
	const secondaryVar = find("primitives", "color/secondary/500");
	let secondaryColor: string | null = null;
	if (secondaryVar) {
		const firstMode = Object.keys(secondaryVar.valuesByMode)[0];
		if (firstMode) {
			secondaryColor = rgbStringToHex(secondaryVar.valuesByMode[firstMode]);
		}
	}

	// Detect gray palette name from primitives
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

	// Detect dark mode — check if any semantics variable has multiple modes
	const semanticVar = variables.find(
		(v) => v.collectionName.toLowerCase() === "semantics",
	);
	const darkMode = semanticVar
		? Object.keys(semanticVar.valuesByMode).length >= 2
		: false;

	// Extract radius from rounded/md primitive
	let radiusAnchor = 10;
	const radiusVar = find("primitives", "rounded/md");
	if (radiusVar) {
		const firstMode = Object.keys(radiusVar.valuesByMode)[0];
		if (firstMode) {
			const val = Number.parseFloat(radiusVar.valuesByMode[firstMode]);
			if (!Number.isNaN(val)) radiusAnchor = val;
		}
	}

	// Extract fonts
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

	// Extract status colors from abstraction status tokens
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
// CustomizePage
// ---------------------------------------------------------------------------

export function CustomizePage() {
	const [view, setView] = useState<ViewState>("loading");
	const postMessage = usePostMessage();
	const { showError, showSuccess } = useToast();

	// Existing variables from Figma
	const [existingVars, setExistingVars] = useState<VariableInfo[]>([]);
	const [existingCollections, setExistingCollections] = useState<CollectionInfo[]>([]);

	// Config state (populated from existing variables)
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

	// Load variables on mount
	useEffect(() => {
		postMessage({ type: "get-variables" });
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
					setExistingVars(data.variables);
					setExistingCollections(data.collections);

					if (data.variables.length === 0) {
						setView("empty");
						return;
					}

					// Extract config from existing variables
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
				if (msg.type === "import-complete" || msg.type === "variables-created") {
					setResult(msg.data as ImportResults);
					setView("success");
				}
				if (msg.type === "error") {
					const errData = msg.data as { message?: string } | undefined;
					showError(errData?.message || "Update failed");
					setView("config");
				}
			},
			[showError],
		),
	);

	// Build config
	const brandConfig: BrandConfig | null = useMemo(() => {
		if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(primaryColor)) return null;
		if (hasSecondary && !/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(secondaryColor))
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
	}, [primaryColor, secondaryColor, hasSecondary, grayName, darkMode, radiusAnchor, typescale, fonts, statusColors]);

	const generated: GeneratedSystem | null = useMemo(() => {
		if (!brandConfig) return null;
		return generateDesignSystem(brandConfig);
	}, [brandConfig]);

	const handleUpdate = useCallback(() => {
		if (!generated) return;
		setView("progress");
		postMessage({
			type: "create-variables",
			data: {
				tokens: generated.tokens,
				collectionName: "generated",
				importMode: "import",
				stylesData: generated.styles,
			},
		});
	}, [generated, postMessage]);

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
				<SectionHeader
					description="Reading existing design system…"
					title="Customize"
					variant="primary"
				/>
				<LoadingState message="Loading variables from Figma…" />
			</div>
		);
	}

	// ---- Empty ----
	if (view === "empty") {
		return (
			<div className={styles.page}>
				<SectionHeader
					description="No design system found to customize"
					title="Customize"
					variant="primary"
				/>
				<EmptyState
					description="Use the Generate page to create a design system first, then come back here to customize it."
					title="No variables found"
				/>
			</div>
		);
	}

	// ---- Progress ----
	if (view === "progress") {
		return (
			<div className={styles.page}>
				<ProgressView message="Updating variables in Figma…" />
			</div>
		);
	}

	// ---- Success ----
	if (view === "success" && result) {
		return (
			<div className={styles.page}>
				<SuccessView
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

	// ---- Config / Preview ----
	return (
		<div className={styles.page}>
			{view === "config" && (
				<>
					<SectionHeader
						action={
							<Button onClick={handleRefresh} size="sm" variant="ghost">
								<RefreshCw size={14} />
								Reload
							</Button>
						}
						description="Modify your design system using visual editors"
						title="Customize"
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
											scale={generated.primitives.find((s) => s.name === "brand")}
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
													scale={generated.primitives.find((s) => s.name === "secondary")}
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
												setRadiusAnchor(Math.min(32, Math.max(0, radiusAnchor || 0)))
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
														base: Math.min(48, Math.max(8, typescale.base || 16)),
													})
												}
												onChange={(v) => setTypescale({ ...typescale, base: v })}
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
														lineHeightBody: Math.min(200, Math.max(100, typescale.lineHeightBody || 150)),
													})
												}
												onChange={(v) => setTypescale({ ...typescale, lineHeightBody: v })}
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
														lineHeightHeading: Math.min(175, Math.max(100, typescale.lineHeightHeading || 125)),
													})
												}
												onChange={(v) => setTypescale({ ...typescale, lineHeightHeading: v })}
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
													onClick={() => setTypescale({ ...typescale, ratio: key })}
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
														stepsUp: Math.min(10, Math.max(0, typescale.stepsUp || 0)),
													})
												}
												onChange={(v) => setTypescale({ ...typescale, stepsUp: v })}
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
														stepsDown: Math.min(2, Math.max(0, typescale.stepsDown || 0)),
													})
												}
												onChange={(v) => setTypescale({ ...typescale, stepsDown: v })}
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
											<Input
												autoComplete="off"
												maxLength={64}
												onChange={(e) => setFonts({ ...fonts, sans: e.target.value })}
												placeholder="System default"
												spellCheck={false}
												value={fonts.sans ?? ""}
											/>
										</div>
										<div className={styles.fontInputRow}>
											<label>Serif</label>
											<Input
												autoComplete="off"
												maxLength={64}
												onChange={(e) => setFonts({ ...fonts, serif: e.target.value })}
												placeholder="System default"
												spellCheck={false}
												value={fonts.serif ?? ""}
											/>
										</div>
										<div className={styles.fontInputRow}>
											<label>Mono</label>
											<Input
												autoComplete="off"
												maxLength={64}
												onChange={(e) => setFonts({ ...fonts, mono: e.target.value })}
												placeholder="System default"
												spellCheck={false}
												value={fonts.mono ?? ""}
											/>
										</div>
									</div>
								</div>
							</FramePanel>
						</Frame>

						{/* Update button */}
						<div className={styles.actions}>
							<Button
								disabled={!generated}
								onClick={() => setView("preview")}
								variant="primary"
							>
								<Wand2 size={14} />
								Preview Changes
							</Button>
						</div>
					</div>
				</>
			)}

			{view === "preview" && generated && (
				<>
					<SectionHeader
						description={`${generated.stats.totalCount} tokens will be updated`}
						title="Preview Changes"
						variant="primary"
					/>

					<div className={styles.previewSection}>
						{/* Stats bar */}
						<div className={styles.statsBar}>
							<div className={styles.statItem}>
								<strong>{generated.stats.primitiveCount}</strong> primitives
							</div>
							<div className={styles.statItem}>
								<strong>{generated.stats.abstractionCount}</strong> abstractions
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
												style={{ backgroundColor: scale.hexValues[step] }}
												title={`${step}: ${scale.hexValues[step]}`}
											/>
										))}
									</div>
								</div>
							))}

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

						{/* Actions */}
						<div className={styles.actions}>
							<Button onClick={() => setView("config")} variant="ghost">
								<ArrowLeft size={14} />
								Back
							</Button>
							<Button onClick={handleCopyCss} variant="ghost">
								<ClipboardCopy size={14} />
								Copy CSS
							</Button>
							<Button onClick={handleUpdate} variant="primary">
								<Wand2 size={14} />
								Update in Figma
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

// --- Shared sub-components (same as GeneratePage) ---

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
