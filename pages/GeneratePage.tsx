import { ArrowLeft, ClipboardCopy, Sparkles, Wand2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { ProgressView, SuccessView } from "../components/import";
import { SectionHeader, useToast } from "../components/ui";
import { Button } from "../components/ui/Button";
import { CheckboxWithLabel } from "../components/ui/Checkbox";
import { Input } from "../components/ui/Input";
import { RadioCard } from "../components/ui/Radio";
import { SHADE_STEPS } from "../generators/color-scale";
import { RADIX_GRAYS } from "../generators/radix-grays";
import {
	type BrandConfig,
	type GeneratedSystem,
	generateCss,
	generateDesignSystem,
	type LayerMode,
} from "../generators/three-tier";
import {
	computeTypescale,
	DEFAULT_TYPESCALE,
	TYPESCALE_RATIOS,
	type TypescaleConfig,
	type FontOverrides,
} from "../generators/token-presets";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import type { DesignToken, ImportResults } from "../types/tokens";
import styles from "./GeneratePage.module.css";

type ViewState = "config" | "preview" | "progress" | "success";

const LAYER_OPTIONS: {
	value: LayerMode;
	title: string;
	desc: string;
}[] = [
	{
		value: "primitives",
		title: "Primitives only",
		desc: "Raw color scales — use when you already have your own semantic layer",
	},
	{
		value: "semantic",
		title: "Primitives + Semantics",
		desc: "Color scales plus contextual tokens (background, text, border). Good default.",
	},
	{
		value: "three-tier",
		title: "Three-tier (with abstractions)",
		desc: "Adds an indirection layer between primitives and semantics for easy rebranding",
	},
];

/** Map token types to readable group labels */
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

export function GeneratePage() {
	const [view, setView] = useState<ViewState>("config");
	const postMessage = usePostMessage();
	const { showError, showSuccess } = useToast();

	// Config state
	const [primaryColor, setPrimaryColor] = useState("#3B82F6");
	const [secondaryColor, setSecondaryColor] = useState("#10B981");
	const [hasSecondary, setHasSecondary] = useState(false);
	const [grayName, setGrayName] = useState("slate");
	const [layers, setLayers] = useState<LayerMode>("semantic");
	const [darkMode, setDarkMode] = useState(true);
	const [radiusAnchor, setRadiusAnchor] = useState(10);
	const [typescale, setTypescale] = useState<TypescaleConfig>({ ...DEFAULT_TYPESCALE });
	const [fonts, setFonts] = useState<FontOverrides>({});
	const [collectionName, setCollectionName] = useState("generated");

	// Result state
	const [result, setResult] = useState<ImportResults | null>(null);

	// Build config object (shared between preview and CSS export)
	const brandConfig: BrandConfig | null = useMemo(() => {
		if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(primaryColor)) return null;
		if (hasSecondary && !/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(secondaryColor)) return null;

		return {
			primary: primaryColor,
			secondary: hasSecondary ? secondaryColor : undefined,
			grayName,
			layers,
			darkMode,
			radius: radiusAnchor,
			typescale,
			fonts: (fonts.sans || fonts.serif || fonts.mono) ? fonts : undefined,
		};
	}, [
		primaryColor,
		secondaryColor,
		hasSecondary,
		grayName,
		layers,
		darkMode,
		radiusAnchor,
		typescale,
		fonts,
	]);

	// Generate preview
	const generated: GeneratedSystem | null = useMemo(() => {
		if (!brandConfig) return null;
		return generateDesignSystem(brandConfig);
	}, [brandConfig]);

	// Listen for import result
	useFigmaMessage(
		useCallback((msg) => {
			if (msg.type === "import-complete" || msg.type === "variables-created") {
				setResult(msg.data as ImportResults);
				setView("success");
			}
			if (msg.type === "error") {
				const errData = msg.data as { message?: string } | undefined;
				showError(errData?.message || "Generation failed");
				setView("preview");
			}
		}, [showError]),
	);

	const handleGenerate = useCallback(() => {
		if (!generated) return;
		setView("progress");
		postMessage({
			type: "create-variables",
			data: {
				tokens: generated.tokens,
				collectionName,
				importMode: "import",
			},
		});
	}, [generated, collectionName, postMessage]);

	const handleCopyCss = useCallback(() => {
		if (!brandConfig) return;
		const css = generateCss(brandConfig);
		navigator.clipboard.writeText(css).then(
			() => showSuccess("CSS copied to clipboard"),
			() => showError("Failed to copy CSS"),
		);
	}, [brandConfig, showSuccess, showError]);

	const handleReset = useCallback(() => {
		setView("config");
		setResult(null);
	}, []);

	// ---- Config View ----
	if (view === "config" || view === "preview") {
		return (
			<div className={styles.page}>
				{view === "config" && (
					<>
						<SectionHeader
							variant="primary"
							title="Generate Design System"
							description="Create a complete token system from your brand colors"
						/>

						<div className={styles.configSection}>
							{/* Primary color */}
							<div className={styles.colorInputGroup}>
								<label>Primary color</label>
								<div className={styles.colorInputRow}>
									<input
										type="color"
										className={styles.colorSwatch}
										value={primaryColor}
										onChange={(e) => setPrimaryColor(e.target.value)}
										aria-label="Primary color picker"
									/>
									<Input
										className={styles.colorHexInput}
										value={primaryColor}
										onChange={(e) => {
											let v = e.target.value;
											if (!v.startsWith("#")) v = `#${v}`;
											if (v.length <= 7 && /^#[0-9a-fA-F]*$/.test(v))
												setPrimaryColor(v.toUpperCase());
										}}
										placeholder="#3B82F6"
										maxLength={7}
										spellCheck={false}
										autoComplete="off"
									/>
								</div>
								{generated && (
									<ColorRampPreview
										scale={generated.primitives.find((s) => s.name === "brand")}
									/>
								)}
							</div>

							{/* Secondary color */}
							<div className={styles.colorInputGroup}>
								<CheckboxWithLabel
									id="has-secondary"
									checked={hasSecondary}
									onChange={setHasSecondary}
									label="Secondary / accent color"
								/>
								{hasSecondary && (
									<>
										<div className={styles.colorInputRow}>
											<input
												type="color"
												className={styles.colorSwatch}
												value={secondaryColor}
												onChange={(e) => setSecondaryColor(e.target.value)}
												aria-label="Secondary color picker"
											/>
											<Input
												className={styles.colorHexInput}
												value={secondaryColor}
												onChange={(e) => {
													let v = e.target.value;
													if (!v.startsWith("#")) v = `#${v}`;
													if (v.length <= 7 && /^#[0-9a-fA-F]*$/.test(v))
														setSecondaryColor(v.toUpperCase());
												}}
												placeholder="#10B981"
												maxLength={7}
												spellCheck={false}
												autoComplete="off"
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

							{/* Gray palette selector */}
							<div className={styles.colorInputGroup}>
								<label>Neutral palette</label>
								<div className={styles.graySelector}>
									{RADIX_GRAYS.map((g) => (
										<button
											key={g.name}
											type="button"
											className={styles.grayOption}
											data-selected={grayName === g.name}
											onClick={() => setGrayName(g.name)}
											title={g.label}
											aria-pressed={grayName === g.name}
											aria-label={`${g.label} neutral palette`}
										>
											<div className={styles.grayPreview}>
												{[0, 2, 4, 7, 10, 11].map((i) => (
													<div
														key={i}
														className={styles.grayDot}
														style={{ backgroundColor: g.light[i] }}
													/>
												))}
											</div>
											<span className={styles.grayName}>{g.name}</span>
										</button>
									))}
								</div>
							</div>

							{/* Dark mode toggle */}
							<CheckboxWithLabel
								id="dark-mode"
								checked={darkMode}
								onChange={setDarkMode}
								label="Generate Light + Dark modes"
							/>

							{/* Layer mode */}
							<div className={styles.colorInputGroup}>
								<label>Structure</label>
								<div className={styles.layerOptions}>
									{LAYER_OPTIONS.map((opt) => (
										<RadioCard
											key={opt.value}
											id={`layer-${opt.value}`}
											name="layers"
											value={opt.value}
											checked={layers === opt.value}
											onChange={(v) => setLayers(v as LayerMode)}
											title={opt.title}
											description={opt.desc}
										/>
									))}
								</div>
							</div>

							{/* Radius */}
							<div className={styles.colorInputGroup}>
								<label>Radius anchor (px)</label>
								<div className={styles.radiusAnchorRow}>
									<Input
										type="number"
										value={radiusAnchor}
										onChange={(e) => {
											const v = Number(e.target.value);
											if (e.target.value !== "" && !Number.isNaN(v)) {
												setRadiusAnchor(v);
											}
										}}
										onBlur={() =>
											setRadiusAnchor(Math.min(32, Math.max(0, radiusAnchor || 0)))
										}
										min={0}
										max={32}
										className={styles.radiusAnchorInput}
									/>
									<span className={styles.hint}>
										Base "lg" — other sizes derived via offsets
									</span>
								</div>
								{generated?.radiusScale && (
									<RadiusPreview scale={generated.radiusScale} />
								)}
							</div>

							{/* Typescale */}
							<div className={styles.colorInputGroup}>
								<label>Typescale</label>
								<div className={styles.typescaleConfig}>
									<div className={styles.typescaleRow}>
										<div className={styles.optionGroup}>
											<label>Base (px)</label>
											<Input
												type="number"
												value={typescale.base}
												onChange={(e) => {
													const v = Number(e.target.value);
													if (e.target.value !== "" && !Number.isNaN(v)) {
														setTypescale({ ...typescale, base: v });
													}
												}}
												onBlur={() =>
													setTypescale({
														...typescale,
														base: Math.min(48, Math.max(8, typescale.base || 16)),
													})
												}
												min={8}
												max={48}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Body line height (%)</label>
											<Input
												type="number"
												value={typescale.lineHeightBody}
												onChange={(e) => {
													const v = Number(e.target.value);
													if (e.target.value !== "" && !Number.isNaN(v)) {
														setTypescale({ ...typescale, lineHeightBody: v });
													}
												}}
												onBlur={() =>
													setTypescale({
														...typescale,
														lineHeightBody: Math.min(200, Math.max(100, typescale.lineHeightBody || 150)),
													})
												}
												min={100}
												max={200}
												step={5}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Heading line height (%)</label>
											<Input
												type="number"
												value={typescale.lineHeightHeading}
												onChange={(e) => {
													const v = Number(e.target.value);
													if (e.target.value !== "" && !Number.isNaN(v)) {
														setTypescale({ ...typescale, lineHeightHeading: v });
													}
												}}
												onBlur={() =>
													setTypescale({
														...typescale,
														lineHeightHeading: Math.min(175, Math.max(100, typescale.lineHeightHeading || 125)),
													})
												}
												min={100}
												max={175}
												step={5}
											/>
										</div>
									</div>

									<div className={styles.optionGroup}>
										<label>Scale ratio</label>
										<div className={styles.ratioSelector}>
											{Object.entries(TYPESCALE_RATIOS).map(([key, r]) => (
												<button
													key={key}
													type="button"
													className={styles.ratioOption}
													data-selected={typescale.ratio === key}
													aria-pressed={typescale.ratio === key}
													onClick={() =>
														setTypescale({ ...typescale, ratio: key })
													}
													title={`${r.label} (${r.value})`}
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
											<Input
												type="number"
												value={typescale.stepsUp}
												onChange={(e) => {
													const v = Number(e.target.value);
													if (e.target.value !== "" && !Number.isNaN(v)) {
														setTypescale({ ...typescale, stepsUp: v });
													}
												}}
												onBlur={() =>
													setTypescale({
														...typescale,
														stepsUp: Math.min(7, Math.max(0, typescale.stepsUp || 0)),
													})
												}
												min={0}
												max={7}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Steps down</label>
											<Input
												type="number"
												value={typescale.stepsDown}
												onChange={(e) => {
													const v = Number(e.target.value);
													if (e.target.value !== "" && !Number.isNaN(v)) {
														setTypescale({ ...typescale, stepsDown: v });
													}
												}}
												onBlur={() =>
													setTypescale({
														...typescale,
														stepsDown: Math.min(4, Math.max(0, typescale.stepsDown || 0)),
													})
												}
												min={0}
												max={4}
											/>
										</div>
										<div className={styles.optionGroup}>
											<CheckboxWithLabel
												id="round-values"
												checked={typescale.round}
												onChange={(checked) =>
													setTypescale({ ...typescale, round: checked })
												}
												label="Round values"
											/>
										</div>
									</div>
								</div>
								<TypescalePreview config={typescale} />
							</div>

							{/* Font names */}
							<div className={styles.colorInputGroup}>
								<label>Fonts</label>
								<div className={styles.fontInputs}>
									<div className={styles.fontInputRow}>
										<label>Sans</label>
										<Input
											value={fonts.sans ?? ""}
											onChange={(e) =>
												setFonts({ ...fonts, sans: e.target.value })
											}
											placeholder="System default"
											maxLength={64}
											spellCheck={false}
											autoComplete="off"
										/>
									</div>
									<div className={styles.fontInputRow}>
										<label>Serif</label>
										<Input
											value={fonts.serif ?? ""}
											onChange={(e) =>
												setFonts({ ...fonts, serif: e.target.value })
											}
											placeholder="System default"
											maxLength={64}
											spellCheck={false}
											autoComplete="off"
										/>
									</div>
									<div className={styles.fontInputRow}>
										<label>Mono</label>
										<Input
											value={fonts.mono ?? ""}
											onChange={(e) =>
												setFonts({ ...fonts, mono: e.target.value })
											}
											placeholder="System default"
											maxLength={64}
											spellCheck={false}
											autoComplete="off"
										/>
									</div>
								</div>
							</div>

							{/* Collection name */}
							<div className={styles.colorInputGroup}>
								<label>Collection name</label>
								<Input
									value={collectionName}
									onChange={(e) => setCollectionName(e.target.value)}
									onBlur={() => {
										if (!collectionName.trim()) setCollectionName("generated");
									}}
									placeholder="generated"
									maxLength={64}
									spellCheck={false}
								/>
							</div>

							{/* Preview button */}
							<div className={styles.actions}>
								<Button
									variant="primary"
									onClick={() => setView("preview")}
									disabled={!generated}
								>
									<Sparkles size={14} />
									Preview
								</Button>
							</div>
						</div>
					</>
				)}

				{view === "preview" && generated && (
					<>
						<SectionHeader
							variant="primary"
							title="Preview"
							description={`${generated.stats.totalCount} tokens in "${collectionName}"`}
						/>

						<div className={styles.previewSection}>
							{/* Stats bar */}
							<div className={styles.statsBar}>
								<div className={styles.statItem}>
									<strong>{generated.stats.primitiveCount}</strong> primitives
								</div>
								{generated.stats.abstractionCount > 0 && (
									<div className={styles.statItem}>
										<strong>{generated.stats.abstractionCount}</strong>{" "}
										abstractions
									</div>
								)}
								{generated.stats.semanticCount > 0 && (
									<div className={styles.statItem}>
										<strong>{generated.stats.semanticCount}</strong> semantics
									</div>
								)}
							</div>

							{/* Color scale previews */}
							<div className={styles.scalePreview}>
								{/* Brand/secondary scales (50-950) */}
								{generated.primitives.map((scale) => (
									<div key={scale.name} className={styles.scaleRow}>
										<span className={styles.scaleLabel}>{scale.name}</span>
										<div className={styles.scaleSwatches}>
											{SHADE_STEPS.map((step) => (
												<div
													key={step}
													className={styles.scaleSwatch}
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
													key={i}
													className={styles.scaleSwatch}
													style={{ backgroundColor: hex }}
													title={`${i + 1}: ${hex}`}
												/>
											))}
										</div>
										{darkMode && (
											<div className={styles.scaleSwatches}>
												{generated.radixGray.dark.map((hex, i) => (
													<div
														key={i}
														className={styles.scaleSwatch}
														style={{ backgroundColor: hex }}
														title={`${i + 1}: ${hex} (dark)`}
													/>
												))}
											</div>
										)}
									</div>
								)}
							</div>

							{/* Radius preview in preview step */}
							<RadiusPreview scale={generated.radiusScale} />

							{/* Token list */}
							<TokenPreviewList generated={generated} />

							{/* Actions */}
							<div className={styles.actions}>
								<Button variant="ghost" onClick={() => setView("config")}>
									<ArrowLeft size={14} />
									Back
								</Button>
								<Button variant="ghost" onClick={handleCopyCss}>
									<ClipboardCopy size={14} />
									Copy CSS
								</Button>
								<Button variant="primary" onClick={handleGenerate}>
									<Wand2 size={14} />
									Create in Figma
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		);
	}

	// ---- Progress View ----
	if (view === "progress") {
		return (
			<div className={styles.page}>
				<ProgressView message="Creating variables in Figma…" />
			</div>
		);
	}

	// ---- Success View ----
	if (view === "success" && result) {
		return (
			<div className={styles.page}>
				<SuccessView
					success={result.success}
					failed={result.failed}
					errors={result.errors}
					changes={result.changes}
					onClose={handleReset}
					onImportMore={handleReset}
				/>
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
						key={step}
						className={styles.colorRampSwatch}
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
				<div key={name} className={styles.radiusItem}>
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
				<div key={step.name} className={styles.typescalePreviewRow}>
					<span
						className={styles.typescaleSample}
						style={{
							fontSize: `${step.size}px`,
							lineHeight: `${step.lineHeight}px`,
						}}
					>
						Aa
					</span>
					<div className={styles.typescaleMeta}>
						<span className={styles.typescaleName}>{step.name}</span>
						<span className={styles.typescaleSize}>
							{step.size}/{step.lineHeight}
						</span>
					</div>
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

	// Memoize the expensive grouping/sorting work
	const groupedCategories = useMemo(() => {
		const categories = ["primitives", "abstractions", "semantics"] as const;
		return categories.map((cat) => {
			const catTokens = generated.tokens.filter((t) => t.category === cat);
			if (catTokens.length === 0) return null;

			// Deduplicate by figmaName (modes create duplicates)
			const seen = new Set<string>();
			const unique = catTokens.filter((t) => {
				if (seen.has(t.figmaName)) return false;
				seen.add(t.figmaName);
				return true;
			});

			// Sub-group by token type
			const grouped = new Map<string, typeof unique>();
			for (const token of unique) {
				const group = getTokenTypeGroup(token.type);
				const arr = grouped.get(group) ?? [];
				if (!grouped.has(group)) grouped.set(group, arr);
				arr.push(token);
			}

			// Sort groups by defined order
			const sortedGroups = TOKEN_TYPE_ORDER.filter((g) => grouped.has(g)).map(
				(g) => ({ group: g, tokens: grouped.get(g) ?? [] }),
			);

			return { cat, unique, sortedGroups };
		}).filter(Boolean) as { cat: string; unique: DesignToken[]; sortedGroups: { group: string; tokens: DesignToken[] }[] }[];
	}, [generated.tokens]);

	const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

	return (
		<div className={styles.tokenPreviewList}>
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
									<div key={token.id} className={styles.tokenRow}>
										<TokenIndicator token={token} />
										<span className={styles.tokenName}>
											{token.figmaName}
										</span>
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
				<Button
					variant="ghost"
					size="sm"
					onClick={toggleExpanded}
				>
					{expanded
						? "Show less"
						: `Show all ${generated.tokens.length} tokens`}
				</Button>
			)}
		</div>
	);
}

// --- Token indicator dot ---

const NON_COLOR_DOT_STYLE = {
	backgroundColor: "transparent",
	border: "1px dashed var(--border)",
} as const;

const TokenIndicator = React.memo(function TokenIndicator({ token }: { token: Pick<DesignToken, "type" | "value"> }) {
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
	return (
		<div
			className={styles.tokenColorDot}
			style={NON_COLOR_DOT_STYLE}
		/>
	);
});
