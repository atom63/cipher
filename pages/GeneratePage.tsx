import { ArrowLeft, ClipboardCopy, Sparkles, Wand2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { ProgressView, SuccessView } from "../components/import";
import { SectionHeader, useToast } from "../components/ui";
import { Button } from "../components/ui/Button";
import { CheckboxWithLabel } from "../components/ui/Checkbox";
import { Input } from "../components/ui/Input";
import { NumberField } from "../components/ui/NumberField";
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
	type FontOverrides,
	TYPESCALE_RATIOS,
	type TypescaleConfig,
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
	const [typescale, setTypescale] = useState<TypescaleConfig>({
		...DEFAULT_TYPESCALE,
	});
	const [fonts, setFonts] = useState<FontOverrides>({});
	const [collectionName, setCollectionName] = useState("generated");

	// Result state
	const [result, setResult] = useState<ImportResults | null>(null);

	// Build config object (shared between preview and CSS export)
	const brandConfig: BrandConfig | null = useMemo(() => {
		if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(primaryColor)) return null;
		if (
			hasSecondary &&
			!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(secondaryColor)
		)
			return null;

		return {
			primary: primaryColor,
			secondary: hasSecondary ? secondaryColor : undefined,
			grayName,
			layers,
			darkMode,
			radius: radiusAnchor,
			typescale,
			fonts: fonts.sans || fonts.serif || fonts.mono ? fonts : undefined,
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
		useCallback(
			(msg) => {
				if (
					msg.type === "import-complete" ||
					msg.type === "variables-created"
				) {
					setResult(msg.data as ImportResults);
					setView("success");
				}
				if (msg.type === "error") {
					const errData = msg.data as { message?: string } | undefined;
					showError(errData?.message || "Generation failed");
					setView("preview");
				}
			},
			[showError],
		),
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
							description="Create a complete token system from your brand colors"
							title="Generate Design System"
							variant="primary"
						/>

						<div className={styles.configSection}>
							{/* ── Brand Colors ── */}
							<section className={styles.section}>
								<h3 className={styles.sectionTitle}>Brand Colors</h3>
								<div className={styles.sectionContent}>
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
								</div>
							</section>

							{/* ── Appearance ── */}
							<section className={styles.section}>
								<h3 className={styles.sectionTitle}>Appearance</h3>
								<div className={styles.sectionContent}>
									<CheckboxWithLabel
										checked={darkMode}
										id="dark-mode"
										label="Generate Light + Dark modes"
										onChange={setDarkMode}
									/>

									<div className={styles.fieldGroup}>
										<label>Structure</label>
										<div className={styles.layerOptions}>
											{LAYER_OPTIONS.map((opt) => (
												<RadioCard
													checked={layers === opt.value}
													description={opt.desc}
													id={`layer-${opt.value}`}
													key={opt.value}
													name="layers"
													onChange={(v) => setLayers(v as LayerMode)}
													title={opt.title}
													value={opt.value}
												/>
											))}
										</div>
									</div>

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
								</div>
							</section>

							{/* ── Typography ── */}
							<section className={styles.section}>
								<h3 className={styles.sectionTitle}>Typography</h3>
								<div className={styles.sectionContent}>
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
													max={7}
													min={0}
													onBlur={() =>
														setTypescale({
															...typescale,
															stepsUp: Math.min(
																7,
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
													max={4}
													min={0}
													onBlur={() =>
														setTypescale({
															...typescale,
															stepsDown: Math.min(
																4,
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

									<TypescalePreview config={typescale} />

									<div className={styles.fieldGroup}>
										<label>Font families</label>
										<div className={styles.fontInputs}>
											<div className={styles.fontInputRow}>
												<label>Sans</label>
												<Input
													autoComplete="off"
													maxLength={64}
													onChange={(e) =>
														setFonts({ ...fonts, sans: e.target.value })
													}
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
													onChange={(e) =>
														setFonts({ ...fonts, serif: e.target.value })
													}
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
													onChange={(e) =>
														setFonts({ ...fonts, mono: e.target.value })
													}
													placeholder="System default"
													spellCheck={false}
													value={fonts.mono ?? ""}
												/>
											</div>
										</div>
									</div>
								</div>
							</section>

							{/* ── Output ── */}
							<section className={styles.section}>
								<h3 className={styles.sectionTitle}>Output</h3>
								<div className={styles.sectionContent}>
									<div className={styles.fieldGroup}>
										<label>Collection name</label>
										<Input
											maxLength={64}
											onBlur={() => {
												if (!collectionName.trim())
													setCollectionName("generated");
											}}
											onChange={(e) => setCollectionName(e.target.value)}
											placeholder="generated"
											spellCheck={false}
											value={collectionName}
										/>
									</div>
								</div>
							</section>

							{/* Preview button */}
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
					</>
				)}

				{view === "preview" && generated && (
					<>
						<SectionHeader
							description={`${generated.stats.totalCount} tokens in "${collectionName}"`}
							title="Preview"
							variant="primary"
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
									<div className={styles.scaleRow}key={scale.name} >
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

							{/* Radius preview in preview step */}
							<RadiusPreview scale={generated.radiusScale} />

							{/* Token list */}
							<TokenPreviewList generated={generated} />

							{/* Actions */}
							<div className={styles.actions}>
								<Button onClick={() => setView("config")}variant="ghost" >
									<ArrowLeft size={14} />
									Back
								</Button>
								<Button onClick={handleCopyCss}variant="ghost" >
									<ClipboardCopy size={14} />
									Copy CSS
								</Button>
								<Button onClick={handleGenerate}variant="primary" >
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
				<div className={styles.radiusItem}key={name} >
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
				<div className={styles.typescalePreviewRow}key={step.name} >
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

	// Memoize the expensive grouping/sorting work
	const groupedCategories = useMemo(() => {
		const categories = ["primitives", "abstractions", "semantics"] as const;
		return categories
			.map((cat) => {
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
			})
			.filter(Boolean) as {
			cat: string;
			unique: DesignToken[];
			sortedGroups: { group: string; tokens: DesignToken[] }[];
		}[];
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
									<div className={styles.tokenRow}key={token.id} >
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
				<Button onClick={toggleExpanded}size="sm" variant="ghost" >
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
