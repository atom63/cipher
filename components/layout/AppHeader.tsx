import { Columns2, Moon, Square, Sun } from "lucide-react";
import type { PluginSettings } from "../../types/messages";
import { AnimatedLogo } from "../common/icon/cipher/app-logo";
import { Button } from "../ui";
import styles from "./AppHeader.module.css";

export type ViewMode = "default" | "compact";

interface AppHeaderProps {
	viewMode: ViewMode;
	onToggleViewMode: () => void;
	isDark: boolean;
	onToggleTheme: () => void;
}

export function AppHeader({
	viewMode,
	onToggleViewMode,
	isDark,
	onToggleTheme,
}: AppHeaderProps) {
	return (
		<header className={styles.header}>
			<AnimatedLogo height={16} colored />
			<div className={styles.actions}>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onToggleTheme}
					title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
				>
					{isDark ? <Sun size={14} /> : <Moon size={14} />}
				</Button>
				<Button
					variant="soft"
					size="sm"
					onClick={onToggleViewMode}
					title={
						viewMode === "default"
							? "Switch to Compact Mode"
							: "Switch to Default Mode"
					}
				>
					{viewMode === "default" ? (
						<Columns2 size={14} />
					) : (
						<Square size={14} />
					)}
					{viewMode === "default" ? "Compact" : "Expand"}
				</Button>
			</div>
		</header>
	);
}
