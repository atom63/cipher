import { ArrowLeft, Sparkles, Wand2 } from "lucide-react";
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

export function GeneratePage() {
	const [view, setView] = useState<ViewState>("config");
	const postMessage = usePostMessage();
	const { showError } = useToast();

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

	// Result state
	const [result, setResult] = useState<ImportResults | null>(null);

	// Generate preview
	const generated: GeneratedSystem | null = useMemo(() => {
		if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) return null;
		if (hasSecondary && !/^#[0-9a-fA-F]{6}$/.test(secondaryColor)) return null;

		const config: BrandConfig = {
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
		};

		return generateDesignSystem(config);
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
	]);

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
				collectionName: "generated",
				importMode: "import",
			},
		});
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
								<label>Surface palette</label>
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
								</div>
							</div>

							{/* Radius config */}
							{includeRadius && (
								<div className={styles.optionsRow}>
									<div className={styles.optionGroup}>
										<label>Radius anchor (px)</label>
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
										<label>Radius multiplier</label>
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
							)}

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
							title="Preview"
							description={`${generated.stats.totalCount} tokens across ${generated.primitives.length} color scales`}
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
							</div>

							{/* Token list */}
							<TokenPreviewList generated={generated} />

							{/* Actions */}
							<div className={styles.actions}>
								<Button variant="ghost" onClick={() => setView("config")}>
									<ArrowLeft size={14} />
									Back
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
				<ProgressView message="Creating variables in Figma..." />
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

// --- Token preview list component ---

function TokenPreviewList({ generated }: { generated: GeneratedSystem }) {
	const [expanded, setExpanded] = useState(false);
	const limit = expanded ? generated.tokens.length : 30;

	// Group tokens by category — deduplicate by figmaName (modes create duplicates)
	const categories = ["primitives", "abstractions", "semantics"] as const;

	return (
		<div className={styles.tokenPreviewList}>
			{categories.map((cat) => {
				const catTokens = generated.tokens.filter((t) => t.category === cat);
				if (catTokens.length === 0) return null;

				// Deduplicate by figmaName (show unique names, not per-mode entries)
				const seen = new Set<string>();
				const unique = catTokens.filter((t) => {
					if (seen.has(t.figmaName)) return false;
					seen.add(t.figmaName);
					return true;
				});

				const displayed = unique.slice(0, limit);

				return (
					<div key={cat}>
						<div className={styles.tokenCategoryHeader}>
							{cat} ({unique.length})
						</div>
						{displayed.map((token) => (
							<div key={token.id} className={styles.tokenRow}>
								{token.type === "color" &&
									typeof token.value === "object" &&
									"r" in token.value && (
										<div
											className={styles.tokenColorDot}
											style={{
												backgroundColor: `rgb(${Math.round(token.value.r * 255)}, ${Math.round(token.value.g * 255)}, ${Math.round(token.value.b * 255)})`,
											}}
										/>
									)}
								{typeof token.value === "number" && (
									<div
										className={styles.tokenColorDot}
										style={{
											backgroundColor: "transparent",
											border: "1px dashed var(--border)",
										}}
									/>
								)}
								{typeof token.value === "string" && (
									<div
										className={styles.tokenColorDot}
										style={{
											backgroundColor: "transparent",
											border: "1px dashed var(--border)",
										}}
									/>
								)}
								<span className={styles.tokenName}>{token.figmaName}</span>
								<span className={styles.tokenValue}>{token.originalValue}</span>
							</div>
						))}
					</div>
				);
			})}

			{generated.tokens.length > 30 && (
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
