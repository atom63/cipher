import {
	ChevronLeft,
	ChevronRight,
	Download,
	LayoutGrid,
	Paintbrush,
	Palette,
	Settings,
	Sparkles,
	Upload,
} from "lucide-react";
import styles from "./Sidebar.module.css";

export type PageId =
	| "manage"
	| "styles"
	| "generate"
	| "import"
	| "export"
	| "settings"
	| "styleguide";

interface MenuItem {
	id: PageId;
	label: string;
	icon: React.ComponentType<{ size?: number | string; className?: string }>;
	enabled: boolean;
	section?: "features" | "config";
}

interface SidebarProps {
	activePage: PageId;
	onPageChange: (pageId: PageId) => void;
	collapsed: boolean;
	onToggleCollapse: () => void;
}

const menuItems: MenuItem[] = [
	{
		id: "manage",
		label: "Variables",
		icon: LayoutGrid,
		enabled: true,
		section: "features",
	},
	{
		id: "styles",
		label: "Styles",
		icon: Paintbrush,
		enabled: true,
		section: "features",
	},
	{
		id: "generate",
		label: "Generate",
		icon: Sparkles,
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
		id: "settings",
		label: "Settings",
		icon: Settings,
		enabled: true,
		section: "config",
	},
	{
		id: "styleguide",
		label: "Styleguide",
		icon: Palette,
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
				<span className={styles.sidebarIcon}>
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

				{/* Separator */}
				<div className={styles.sidebarSeparator} />

				{/* Config Section */}
				<div className={styles.sidebarSection}>
					{configItems.map(renderMenuItem)}
				</div>
			</div>

			{/* Collapse Toggle */}
			<button
				className={styles.sidebarCollapseToggle}
				onClick={onToggleCollapse}
				title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				type="button"
			>
				{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
			</button>
		</aside>
	);
}
