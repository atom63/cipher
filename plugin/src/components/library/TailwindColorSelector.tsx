/**
 * Tailwind Color Selector Component
 * Select individual Tailwind color palettes to import
 */

import { ArrowRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import {
	generateTailwindColorTokens,
	getTailwindColorTokenCount,
	getTailwindPalettePreview,
	getTailwindPalettesByCategory,
	type TailwindColorPalette,
} from "../../libraries/tailwind-data";
import type { DesignToken } from "../../types/tokens";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CheckboxWithLabel,
	SectionHeader,
} from "../ui";
import styles from "./TailwindColorSelector.module.css";

interface TailwindColorSelectorProps {
	onBack: () => void;
	onGenerate: (tokens: DesignToken[]) => void;
}

export function TailwindColorSelector({
	onGenerate,
	onBack,
}: TailwindColorSelectorProps) {
	const [selectedPalettes, setSelectedPalettes] = useState<string[]>([]);

	const palettesByCategory = getTailwindPalettesByCategory();
	const tokenCount = getTailwindColorTokenCount(selectedPalettes);

	const togglePalette = (paletteName: string) => {
		setSelectedPalettes((prev) =>
			prev.includes(paletteName)
				? prev.filter((p) => p !== paletteName)
				: [...prev, paletteName],
		);
	};

	const selectAllInCategory = (palettes: TailwindColorPalette[]) => {
		const paletteNames = palettes.map((p) => p.name);
		setSelectedPalettes((prev) => {
			const newSet = new Set([...prev, ...paletteNames]);
			return Array.from(newSet);
		});
	};

	const deselectAllInCategory = (palettes: TailwindColorPalette[]) => {
		const paletteNames = palettes.map((p) => p.name);
		setSelectedPalettes((prev) =>
			prev.filter((p) => !paletteNames.includes(p)),
		);
	};

	const handleGenerate = () => {
		if (selectedPalettes.length === 0) return;

		const tokens = generateTailwindColorTokens(selectedPalettes, {
			namePrefix: "tw",
		});

		onGenerate(tokens);
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Button
					className={styles.backButton}
					onClick={onBack}
					size="sm"
					variant="ghost"
				>
					<ChevronLeft size={14} /> Back
				</Button>
				<div>
					<h2 className={styles.title}>Tailwind Colors</h2>
					<p className={styles.subtitle}>
						Select color palettes to import (11 shades each: 50-950)
					</p>
				</div>
			</div>

			<div className={styles.content}>
				{/* Gray Scales */}
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<SectionHeader title="Gray Scales" />
						<div className={styles.sectionActions}>
							<Button
								onClick={() => selectAllInCategory(palettesByCategory.gray)}
								size="sm"
								variant="ghost"
							>
								Select all
							</Button>
							<Button
								onClick={() => deselectAllInCategory(palettesByCategory.gray)}
								size="sm"
								variant="ghost"
							>
								Clear
							</Button>
						</div>
					</div>

					<div className={styles.paletteGrid}>
						{palettesByCategory.gray.map((palette) => (
							<Card
								className={
									selectedPalettes.includes(palette.name) ? styles.selected : ""
								}
								hover={!selectedPalettes.includes(palette.name)}
								key={palette.name}
								onClick={() => togglePalette(palette.name)}
								padding="sm"
								variant={
									selectedPalettes.includes(palette.name) ? "muted" : "bordered"
								}
							>
								<CardHeader>
									<CheckboxWithLabel
										checked={selectedPalettes.includes(palette.name)}
										id={`palette-${palette.name}`}
										label={palette.displayName}
										onChange={() => togglePalette(palette.name)}
									/>
								</CardHeader>
								<CardContent>
									<div className={styles.colorSwatches}>
										{getTailwindPalettePreview(palette.name).map(
											(color, idx) => (
												<div
													className={styles.colorSwatch}
													key={idx}
													style={{ backgroundColor: color }}
													title={`Shade ${["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"][idx]}`}
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
								onClick={() => selectAllInCategory(palettesByCategory.color)}
								size="sm"
								variant="ghost"
							>
								Select all
							</Button>
							<Button
								onClick={() => deselectAllInCategory(palettesByCategory.color)}
								size="sm"
								variant="ghost"
							>
								Clear
							</Button>
						</div>
					</div>

					<div className={styles.paletteGrid}>
						{palettesByCategory.color.map((palette) => (
							<Card
								className={
									selectedPalettes.includes(palette.name) ? styles.selected : ""
								}
								hover={!selectedPalettes.includes(palette.name)}
								key={palette.name}
								onClick={() => togglePalette(palette.name)}
								padding="sm"
								variant={
									selectedPalettes.includes(palette.name) ? "muted" : "bordered"
								}
							>
								<CardHeader>
									<CheckboxWithLabel
										checked={selectedPalettes.includes(palette.name)}
										id={`palette-${palette.name}`}
										label={palette.displayName}
										onChange={() => togglePalette(palette.name)}
									/>
								</CardHeader>
								<CardContent>
									<div className={styles.colorSwatches}>
										{getTailwindPalettePreview(palette.name).map(
											(color, idx) => (
												<div
													className={styles.colorSwatch}
													key={idx}
													style={{ backgroundColor: color }}
													title={`Shade ${["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"][idx]}`}
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
					<Button onClick={onBack}variant="secondary" >
						Cancel
					</Button>
					<Button
						disabled={selectedPalettes.length === 0}
						onClick={handleGenerate}
						variant="primary"
					>
						Preview {tokenCount} Tokens <ArrowRight size={14} />
					</Button>
				</div>
			</div>
		</div>
	);
}
