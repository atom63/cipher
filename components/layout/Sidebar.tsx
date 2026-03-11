import {
	ChevronLeft,
	ChevronRight,
	Download,
	Info,
	LayoutGrid,
	Sparkles,
	Upload,
} from "lucide-react";
import { Separator } from "../ui";
import styles from "./Sidebar.module.css";

export type PageId =
	| "manage"
	| "generate"
	| "import"
	| "export"
	| "about";

interface MenuItem {
	enabled: boolean;
	icon: React.ComponentType<{ size?: number | string; className?: string }>;
	id: PageId;
	label: string;
	section?: "features" | "config";
}

interface SidebarProps {
	activePage: PageId;
	collapsed: boolean;
	onPageChange: (pageId: PageId) => void;
	onToggleCollapse: () => void;
}

const menuItems: MenuItem[] = [
	{
		id: "generate",
		label: "Customize",
		icon: Sparkles,
		enabled: true,
		section: "features",
	},
	{
		id: "manage",
		label: "Manage",
		icon: LayoutGrid,
		enabled: true,
		section: "features",
	},
	{
		id: "import",
		label: "Import",
		icon: Download,
		enabled: true,
		section: "features",
	},
	{
		id: "export",
		label: "Export",
		icon: Upload,
		enabled: true,
		section: "features",
	},
	{
		id: "about",
		label: "About",
		icon: Info,
		enabled: true,
		section: "config",
	},
];

export function Sidebar({
	activePage,
	onPageChange,
	collapsed,
	onToggleCollapse,
}: SidebarProps) {
	const featureItems = menuItems.filter((item) => item.section === "features");
	const configItems = menuItems.filter((item) => item.section === "config");

	const renderMenuItem = (item: MenuItem) => {
		const Icon = item.icon;
		return (
			<button
				className={`${styles.sidebarItem} ${activePage === item.id ? styles.active : ""} ${!item.enabled ? styles.disabled : ""}`}
				disabled={!item.enabled}
				key={item.id}
				onClick={() => item.enabled && onPageChange(item.id)}
				title={collapsed ? item.label : !item.enabled ? "Coming soon" : ""}
				type="button"
			>
				<span aria-hidden="true"className={styles.sidebarIcon} >
					<Icon size={16} />
				</span>
				{!collapsed && (
					<>
						<span className={styles.sidebarLabel}>{item.label}</span>
						{!item.enabled && <span className={styles.sidebarBadge}>Soon</span>}
					</>
				)}
			</button>
		);
	};

	return (
		<aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
			<div className={styles.sidebarContent}>
				{/* Features Section */}
				<div className={styles.sidebarSection}>
					{featureItems.map(renderMenuItem)}
				</div>

				<Separator className={styles.sidebarSeparator} />

				{/* Config Section */}
				<div className={styles.sidebarSection}>
					{configItems.map(renderMenuItem)}
				</div>
			</div>

			{/* Collapse Toggle */}
			<button
				aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				className={styles.sidebarCollapseToggle}
				onClick={onToggleCollapse}
				title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				type="button"
			>
				{collapsed ? (
					<ChevronRight aria-hidden="true" size={18} />
				) : (
					<ChevronLeft aria-hidden="true" size={18} />
				)}
			</button>
		</aside>
	);
}
