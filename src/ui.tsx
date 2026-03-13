/**
 * Cipher - Figma Design System Plugin
 * Author: You Zhang (ATOM63)
 */

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
	AppHeader,
	type PageId,
	Sidebar,
	type ViewMode,
} from "./components/layout";
import {
	ErrorBoundary,
	PageErrorBoundary,
	ToastProvider,
} from "./components/ui";
import { TooltipPortal } from "./components/ui/Tooltip";
import { useDebugMode } from "./hooks/useDebugMode";
import { useFigmaMessage, usePostMessage } from "./hooks/useFigmaMessage";
import { AboutPage } from "./pages/AboutPage";
import { ExportPage } from "./pages/ExportPage";
import { GeneratePage } from "./pages/GeneratePage";
import { ImportPage } from "./pages/ImportPage";
import { ManageTabsPage } from "./pages/ManageTabsPage";
import type { PluginSettings } from "./types/messages";
import { applyTheme } from "./utils/theme";

function App() {
	const [activePage, setActivePage] = useState<PageId>("manage");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("default");
	const [isDark, setIsDark] = useState(false);
	const postMessage = usePostMessage();
	useDebugMode();

	// Load theme on startup
	useEffect(() => {
		postMessage({ type: "load-settings" });
	}, [postMessage]);

	useFigmaMessage((msg) => {
		if (msg.type === "settings-loaded" && msg.data?.theme) {
			const t = msg.data.theme as PluginSettings["theme"];
			setIsDark(t === "dark");
			applyTheme(t);
		}
	});

	const toggleViewMode = () => {
		const newMode = viewMode === "default" ? "compact" : "default";
		setViewMode(newMode);
		postMessage({ type: "resize-window", data: { mode: newMode } });
	};

	const toggleTheme = () => {
		const next = isDark ? "light" : "dark";
		setIsDark(!isDark);
		applyTheme(next);
		postMessage({ type: "save-settings", data: { theme: next } });
	};

	const renderPage = () => {
		switch (activePage) {
			case "manage":
				return (
					<PageErrorBoundary pageName="Manage">
						<ManageTabsPage onNavigate={(page) => setActivePage(page as PageId)} />
					</PageErrorBoundary>
				);
			case "generate":
				return (
					<PageErrorBoundary pageName="Generate">
						<GeneratePage />
					</PageErrorBoundary>
				);
			case "import":
				return (
					<PageErrorBoundary pageName="Import">
						<ImportPage />
					</PageErrorBoundary>
				);
			case "export":
				return (
					<PageErrorBoundary pageName="Export">
						<ExportPage />
					</PageErrorBoundary>
				);
			case "about":
				return (
					<PageErrorBoundary pageName="About">
						<AboutPage />
					</PageErrorBoundary>
				);
			default:
				return (
					<PageErrorBoundary pageName="Manage">
						<ManageTabsPage onNavigate={(page) => setActivePage(page as PageId)} />
					</PageErrorBoundary>
				);
		}
	};

	return (
		<div className="plugin-container">
			<AppHeader
				isDark={isDark}
				onToggleTheme={toggleTheme}
				onToggleViewMode={toggleViewMode}
				viewMode={viewMode}
			/>

			{/* Main Layout with Sidebar */}
			<div className="plugin-layout">
				<Sidebar
					activePage={activePage}
					collapsed={sidebarCollapsed}
					onPageChange={setActivePage}
					onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
				/>

				{/* Page Content */}
				<div className="plugin-main-clip">
					<div className="plugin-main">{renderPage()}</div>
				</div>
			</div>
		</div>
	);
}

const container = document.getElementById("root");

if (container) {
	try {
		const root = createRoot(container);
		root.render(
			<ErrorBoundary>
				<ToastProvider>
					<App />
					<TooltipPortal />
				</ToastProvider>
			</ErrorBoundary>,
		);
	} catch (error) {
		console.error("[Cipher] Failed to mount UI:", error);
	}
}
