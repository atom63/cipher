import { ArrowLeft, ClipboardCopy, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ProgressView, SuccessView } from "../components/import";
import { SectionHeader, useToast } from "../components/ui";
import { Button } from "../components/ui/Button";
import { CheckboxWithLabel } from "../components/ui/Checkbox";
import { Input } from "../components/ui/Input";
import { SHADE_STEPS } from "../generators/color-scale";
import { RADIX_GRAYS } from "../generators/radix-grays";
import {
	type BrandConfig,
	type GeneratedSystem,
	generateCss,
	generateDesignSystem,
	type LayerMode,
} from "../generators/three-tier";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import type { ImportResults } from "../types/tokens";
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
	const [radiusMultiplier, setRadiusMultiplier] = useState(1);
	const [includeSpacing, setIncludeSpacing] = useState(true);
	const [includeRadius, setIncludeRadius] = useState(true);
	const [includeShadows, setIncludeShadows] = useState(true);
	const [includeTypography, setIncludeTypography] = useState(true);
	const [includeDurations, setIncludeDurations] = useState(true);
	const [includeFonts, setIncludeFonts] = useState(true);
	const [collectionName, setCollectionName] = useState("generated");

	// Result state
	const [result, setResult] = useState<ImportResults | null>(null);

	// Build config object (shared between preview and CSS export)
	const brandConfig: BrandConfig | null = useMemo(() => {
		if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) return null;
		if (hasSecondary && !/^#[0-9a-fA-F]{6}$/.test(secondaryColor)) return null;

		return {
			primary: primaryColor,
			secondary: hasSecondary ? secondaryColor : undefined,
			grayName,
			layers,
			darkMode,
			radius: { anchor: radiusAnchor, multiplier: radiusMultiplier },
			includeSpacing,
			includeRadius,
			includeShadows,
			includeTypography,
			includeDurations,
			includeFonts,
		};
	}, [
		primaryColor,
		secondaryColor,
		hasSecondary,
		grayName,
		layers,
		darkMode,
		radiusAnchor,
		radiusMultiplier,
		includeSpacing,
		includeRadius,
		includeShadows,
		includeTypography,
		includeDurations,
		includeFonts,
	]);

	// Generate preview
	const generated: GeneratedSystem | null = useMemo(() => {
		if (!brandConfig) return null;
		return generateDesignSystem(brandConfig);
	}, [brandConfig]);

	// Listen for import result
	useFigmaMessage((msg: any) => {
		if (msg.type === "import-complete" || msg.type === "variables-created") {
			setResult(msg.data);
			setView("success");
		}
		if (msg.type === "error") {
			showError(msg.data?.message || "Generation failed");
			setView("preview");
		}
		if (msg.type === "progress-update") {
			// Progress is handled by ProgressView
		}
	});

	const handleGenerate = () => {
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
	};

	const handleCopyCss = () => {
		if (!brandConfig) return;
		const css = generateCss(brandConfig);
		navigator.clipboard.writeText(css).then(
			() => showSuccess("CSS copied to clipboard"),
			() => showError("Failed to copy CSS"),
		);
	};

	const handleReset = () => {
		setView("config");
		setResult(null);
	};

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
									/>
									<Input
										className={styles.colorHexInput}
										value={primaryColor}
										onChange={(e) => {
											const v = e.target.value;
											if (v.startsWith("#") && v.length <= 7)
												setPrimaryColor(v);
										}}
										placeholder="#3B82F6"
									/>
								</div>
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
									<div className={styles.colorInputRow}>
										<input
											type="color"
											className={styles.colorSwatch}
											value={secondaryColor}
											onChange={(e) => setSecondaryColor(e.target.value)}
										/>
										<Input
											className={styles.colorHexInput}
											value={secondaryColor}
											onChange={(e) => {
												const v = e.target.value;
												if (v.startsWith("#") && v.length <= 7)
													setSecondaryColor(v);
											}}
											placeholder="#10B981"
										/>
									</div>
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
										<label
											key={opt.value}
											className={styles.layerOption}
											data-selected={layers === opt.value}
										>
											<input
												type="radio"
												name="layers"
												checked={layers === opt.value}
												onChange={() => setLayers(opt.value)}
											/>
											<div className={styles.layerOptionText}>
												<span className={styles.layerOptionTitle}>
													{opt.title}
												</span>
												<span className={styles.layerOptionDesc}>
													{opt.desc}
												</span>
											</div>
										</label>
									))}
								</div>
							</div>

							{/* Token types */}
							<div className={styles.colorInputGroup}>
								<label>Token types</label>
								<div className={styles.tokenTypeGrid}>
									<CheckboxWithLabel
										id="include-spacing"
										checked={includeSpacing}
										onChange={setIncludeSpacing}
										label="Spacing"
									/>
									<CheckboxWithLabel
										id="include-radius"
										checked={includeRadius}
										onChange={setIncludeRadius}
										label="Radius"
									/>
									<CheckboxWithLabel
										id="include-shadows"
										checked={includeShadows}
										onChange={setIncludeShadows}
										label="Shadows"
									/>
									<CheckboxWithLabel
										id="include-typography"
										checked={includeTypography}
										onChange={setIncludeTypography}
										label="Typography"
									/>
									<CheckboxWithLabel
										id="include-durations"
										checked={includeDurations}
										onChange={setIncludeDurations}
										label="Durations"
									/>
									<CheckboxWithLabel
										id="include-fonts"
										checked={includeFonts}
										onChange={setIncludeFonts}
										label="Fonts"
									/>
								</div>
							</div>

							{/* Radius config */}
							{includeRadius && (
								<div className={styles.colorInputGroup}>
									<label>Radius</label>
									<div className={styles.optionsRow}>
										<div className={styles.optionGroup}>
											<label>Anchor (px)</label>
											<Input
												type="number"
												value={radiusAnchor}
												onChange={(e) =>
													setRadiusAnchor(
														Math.max(0, Number(e.target.value) || 0),
													)
												}
												min={0}
												max={32}
											/>
										</div>
										<div className={styles.optionGroup}>
											<label>Multiplier</label>
											<Input
												type="number"
												value={radiusMultiplier}
												onChange={(e) =>
													setRadiusMultiplier(
														Math.max(0, Number(e.target.value) || 0),
													)
												}
												min={0}
												max={3}
												step={0.1}
											/>
										</div>
									</div>
									{/* Radius live preview */}
									{generated?.radiusScale && (
										<RadiusPreview scale={generated.radiusScale} />
									)}
								</div>
							)}

							{/* Collection name */}
							<div className={styles.colorInputGroup}>
								<label>Collection name</label>
								<Input
									value={collectionName}
									onChange={(e) =>
										setCollectionName(e.target.value || "generated")
									}
									placeholder="generated"
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
							{generated.radiusScale && (
								<RadiusPreview scale={generated.radiusScale} />
							)}

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

// --- Radius visual preview ---

function RadiusPreview({ scale }: { scale: Record<string, number> }) {
	// Filter out 'none' and 'full' for the visual
	const entries = Object.entries(scale).filter(
		([name]) => name !== "none" && name !== "full",
	);

	return (
		<div className={styles.radiusPreview}>
			{entries.map(([name, px]) => (
				<div key={name} className={styles.radiusItem}>
					<div
						className={styles.radiusSample}
						style={{ borderRadius: `${Math.min(px, 20)}px` }}
					/>
					<span className={styles.radiusLabel}>
						{name}
						<span className={styles.radiusValue}>{px}px</span>
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

	const categories = ["primitives", "abstractions", "semantics"] as const;

	return (
		<div className={styles.tokenPreviewList}>
			{categories.map((cat) => {
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

				return (
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
				);
			})}

			{generated.tokens.length > 40 && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setExpanded(!expanded)}
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

function TokenIndicator({ token }: { token: { type: string; value: any } }) {
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
			style={{
				backgroundColor: "transparent",
				border: "1px dashed var(--border)",
			}}
		/>
	);
}
