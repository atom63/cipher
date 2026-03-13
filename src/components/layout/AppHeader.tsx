import { Columns2, Moon, Square, Sun } from "lucide-react";
import { AnimatedLogo } from "../common/icon/cipher/app-logo";
import { Button } from "../ui";
import styles from "./AppHeader.module.css";

export type ViewMode = "default" | "compact";

interface AppHeaderProps {
	isDark: boolean;
	onToggleTheme: () => void;
	onToggleViewMode: () => void;
	viewMode: ViewMode;
}

export function AppHeader({
	viewMode,
	onToggleViewMode,
	isDark,
	onToggleTheme,
}: AppHeaderProps) {
	return (
		<header className={styles.header}>
			<div className={styles.brand}>
				<AnimatedLogo colored height={18} />
				<span className={styles.beta}>BETA</span>
			</div>
			<div className={styles.actions}>
				<Button
					onClick={onToggleTheme}
					size="icon-sm"
					title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
					variant="ghost"
				>
					{isDark ? <Sun size={14} /> : <Moon size={14} />}
				</Button>
				<Button
					onClick={onToggleViewMode}
					size="icon-sm"
					title={
						viewMode === "default"
							? "Switch to Compact Mode"
							: "Switch to Default Mode"
					}
					variant="ghost"
				>
					{viewMode === "default" ? (
						<Columns2 size={14} />
					) : (
						<Square size={14} />
					)}
				</Button>
			</div>
		</header>
	);
}
