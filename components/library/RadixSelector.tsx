/**
 * Radix Colors Selector Component
 * Select Radix color palettes to import
 */

import { useState } from "react";
import {
	generateRadixTokens,
	getRadixPalettePreview,
	getRadixPalettesByCategory,
	getRadixTokenCount,
	type RadixPalette,
} from "../../libraries/radix-data";
import type { DesignToken } from "../../types/tokens";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CheckboxWithLabel,
	SectionHeader,
} from "../ui";
import styles from "./RadixSelector.module.css";

interface RadixSelectorProps {
	onGenerate: (tokens: DesignToken[]) => void;
	onBack: () => void;
}

export function RadixSelector({ onGenerate, onBack }: RadixSelectorProps) {
	const [selectedPalettes, setSelectedPalettes] = useState<string[]>([
		"blue",
		"slate",
	]);
	const [includeDarkMode, setIncludeDarkMode] = useState(true);

	const palettesByCategory = getRadixPalettesByCategory();
	const tokenCount = getRadixTokenCount(selectedPalettes, includeDarkMode);

	const togglePalette = (paletteName: string) => {
		setSelectedPalettes((prev) =>
			prev.includes(paletteName)
				? prev.filter((p) => p !== paletteName)
				: [...prev, paletteName],
		);
	};

	const selectAllInCategory = (palettes: RadixPalette[]) => {
		const names = palettes.map((p) => p.name);
		setSelectedPalettes((prev) => [...new Set([...prev, ...names])]);
	};

	const deselectAllInCategory = (palettes: RadixPalette[]) => {
		const names = palettes.map((p) => p.name);
		setSelectedPalettes((prev) => prev.filter((p) => !names.includes(p)));
	};

	const handleGenerate = () => {
		if (selectedPalettes.length === 0) return;

		const tokens = generateRadixTokens(selectedPalettes, {
			includeDarkMode,
			namePrefix: "radix",
		});

		onGenerate(tokens);
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Button
					variant="ghost"
					size="sm"
					onClick={onBack}
					className={styles.backButton}
				>
					← Back
				</Button>
				<div>
					<h2 className={styles.title}>Radix Colors</h2>
					<p className={styles.subtitle}>Select color palettes to import</p>
				</div>
			</div>

			<div className={styles.content}>
				{/* Options */}
				<div className={styles.options}>
					<CheckboxWithLabel
						id="dark-mode"
						label="Include dark mode palettes"
						checked={includeDarkMode}
						onChange={(checked: boolean) => setIncludeDarkMode(checked)}
					/>
				</div>

				{/* Gray Scales */}
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<SectionHeader title="Gray Scales" />
						<div className={styles.sectionActions}>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => selectAllInCategory(palettesByCategory.gray)}
							>
								Select all
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => deselectAllInCategory(palettesByCategory.gray)}
							>
								Clear
							</Button>
						</div>
					</div>

					<div className={styles.paletteGrid}>
						{palettesByCategory.gray.map((palette) => (
							<Card
								key={palette.name}
								variant={
									selectedPalettes.includes(palette.name) ? "muted" : "bordered"
								}
								padding="sm"
								hover={!selectedPalettes.includes(palette.name)}
								onClick={() => togglePalette(palette.name)}
								className={
									selectedPalettes.includes(palette.name) ? styles.selected : ""
								}
							>
								<CardHeader>
									<CheckboxWithLabel
										id={`palette-${palette.name}`}
										label={palette.displayName}
										checked={selectedPalettes.includes(palette.name)}
										onChange={() => togglePalette(palette.name)}
									/>
								</CardHeader>
								<CardContent>
									<div className={styles.colorSwatches}>
										{getRadixPalettePreview(palette.name, "light").map(
											(color, idx) => (
												<div
													key={idx}
													className={styles.colorSwatch}
													style={{ backgroundColor: color }}
													title={`Shade ${idx + 1}`}
												/>
											),
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				{/* Colors */}
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<SectionHeader title="Colors" />
						<div className={styles.sectionActions}>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => selectAllInCategory(palettesByCategory.color)}
							>
								Select all
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => deselectAllInCategory(palettesByCategory.color)}
							>
								Clear
							</Button>
						</div>
					</div>

					<div className={styles.paletteGrid}>
						{palettesByCategory.color.map((palette) => (
							<Card
								key={palette.name}
								variant={
									selectedPalettes.includes(palette.name) ? "muted" : "bordered"
								}
								padding="sm"
								hover={!selectedPalettes.includes(palette.name)}
								onClick={() => togglePalette(palette.name)}
								className={
									selectedPalettes.includes(palette.name) ? styles.selected : ""
								}
							>
								<CardHeader>
									<CheckboxWithLabel
										id={`palette-${palette.name}`}
										label={palette.displayName}
										checked={selectedPalettes.includes(palette.name)}
										onChange={() => togglePalette(palette.name)}
									/>
								</CardHeader>
								<CardContent>
									<div className={styles.colorSwatches}>
										{getRadixPalettePreview(palette.name, "light").map(
											(color, idx) => (
												<div
													key={idx}
													className={styles.colorSwatch}
													style={{ backgroundColor: color }}
													title={`Shade ${idx + 1}`}
												/>
											),
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className={styles.footer}>
				<div className={styles.tokenInfo}>
					<span className={styles.tokenCount}>{tokenCount} tokens ready</span>
					<span className={styles.selectedCount}>
						{selectedPalettes.length} palette
						{selectedPalettes.length !== 1 ? "s" : ""} selected
					</span>
				</div>

				<div className={styles.actions}>
					<Button variant="secondary" onClick={onBack}>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={handleGenerate}
						disabled={selectedPalettes.length === 0}
					>
						Preview {tokenCount} Tokens →
					</Button>
				</div>
			</div>
		</div>
	);
}
