/**
 * Library Selector Component
 * Main screen for choosing a design library to import
 */

import { useState } from "react";
import {
	Badge,
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui";
import styles from "./LibrarySelector.module.css";

export type LibraryType = "radix" | "tailwind" | "custom" | "json";

interface LibraryOption {
	id: LibraryType;
	icon: string;
	title: string;
	description: string;
	tokenCount: string;
	badge?: string;
	disabled?: boolean;
}

interface LibrarySelectorProps {
	onSelect: (library: LibraryType) => void;
}

const LIBRARY_OPTIONS: LibraryOption[] = [
	{
		id: "radix",
		icon: "🎨",
		title: "Radix Colors",
		description: "Modern, accessible color palettes",
		tokenCount: "300+ tokens",
		badge: "Popular",
	},
	{
		id: "tailwind",
		icon: "🎨",
		title: "Tailwind CSS",
		description: "Popular utility-first framework",
		tokenCount: "335+ tokens",
		badge: "Popular",
	},
	{
		id: "custom",
		icon: "✨",
		title: "Custom Palette",
		description: "Generate from your colors",
		tokenCount: "Smart algorithm",
		badge: "Phase 2",
		disabled: true,
	},
];

export function LibrarySelector({ onSelect }: LibrarySelectorProps) {
	const [_hoveredCard, _setHoveredCard] = useState<LibraryType | null>(null);

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>Cipher</h1>
				<p className={styles.subtitle}>
					Generate your design system in minutes
				</p>
			</div>

			<div className={styles.grid}>
				{LIBRARY_OPTIONS.map((option) => (
					<Card
						key={option.id}
						variant="default"
						padding="md"
						hover={!option.disabled}
						onClick={() => !option.disabled && onSelect(option.id)}
						className={`${styles.libraryCard} ${option.disabled ? styles.disabled : ""}`}
					>
						<div className={styles.iconWrapper}>
							<span className={styles.icon}>{option.icon}</span>
						</div>

						<CardHeader>
							<div className={styles.titleRow}>
								<CardTitle>{option.title}</CardTitle>
								{option.badge && (
									<Badge variant={option.disabled ? "secondary" : "default"}>
										{option.badge}
									</Badge>
								)}
							</div>
							<CardDescription>{option.description}</CardDescription>
						</CardHeader>

						<CardFooter className={styles.footer}>
							<span className={styles.tokenCount}>{option.tokenCount}</span>
							{!option.disabled && <span className={styles.arrow}>→</span>}
						</CardFooter>
					</Card>
				))}
			</div>

			<div className={styles.footer}>
				<p className={styles.footerText}>
					💡 <strong>Tip:</strong> Use the <strong>Import</strong> tab in the
					sidebar to upload JSON token files.
				</p>
			</div>
		</div>
	);
}
