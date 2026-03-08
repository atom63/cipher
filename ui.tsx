/**
 * Cipher - Figma Design System Plugin
 * Author: You Zhang (ATOM63)
 */

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { type PageId, Sidebar } from "./components/layout";
import {
	ErrorBoundary,
	PageErrorBoundary,
	ToastProvider,
} from "./components/ui";
import { TooltipPortal } from "./components/ui/Tooltip";
import { useFigmaMessage, usePostMessage } from "./hooks/useFigmaMessage";
import { ExportPage } from "./pages/ExportPage";
import { GeneratePage } from "./pages/GeneratePage";
import { ImportPage } from "./pages/ImportPage";
import { ManagePage } from "./pages/ManagePage";
import { SettingsPage } from "./pages/SettingsPage";
import { StyleguidePage } from "./pages/StyleguidePage";
import { StylesPage } from "./pages/StylesPage";
import type { PluginSettings } from "./types/messages";
import { applyTheme } from "./utils/theme";

function App() {
	const [activePage, setActivePage] = useState<PageId>("manage");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [viewMode, setViewMode] = useState<"default" | "compact">("default");
	const postMessage = usePostMessage();

	// Load theme on startup
	useEffect(() => {
		postMessage({ type: "load-settings" });
	}, [postMessage]);

	useFigmaMessage((msg) => {
		if (msg.type === "settings-loaded" && msg.data?.theme) {
			applyTheme(msg.data.theme as PluginSettings["theme"]);
		}
	});

	const toggleViewMode = () => {
		const newMode = viewMode === "default" ? "compact" : "default";
		setViewMode(newMode);
		postMessage({ type: "resize-window", data: { mode: newMode } });
	};

	const renderPage = () => {
		switch (activePage) {
			case "manage":
				return (
					<PageErrorBoundary pageName="Variables">
						<ManagePage onNavigate={(page) => setActivePage(page as PageId)} />
					</PageErrorBoundary>
				);
			case "styles":
				return (
					<PageErrorBoundary pageName="Styles">
						<StylesPage />
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
			case "settings":
				return (
					<PageErrorBoundary pageName="Settings">
						<SettingsPage />
					</PageErrorBoundary>
				);
			case "styleguide":
				return (
					<PageErrorBoundary pageName="Styleguide">
						<StyleguidePage />
					</PageErrorBoundary>
				);
			default:
				return (
					<PageErrorBoundary pageName="Manage">
						<ManagePage onNavigate={(page) => setActivePage(page as PageId)} />
					</PageErrorBoundary>
				);
		}
	};

	return (
		<div className="plugin-container">
			{/* Header with View Mode Toggle */}
			<div className="view-mode-header">
				<h1>Cipher</h1>
				<button
					className="view-mode-toggle"
					onClick={toggleViewMode}
					title={
						viewMode === "default"
							? "Switch to Compact Mode"
							: "Switch to Default Mode"
					}
					type="button"
				>
					{viewMode === "default" ? "◧" : "◨"}{" "}
					{viewMode === "default" ? "Compact" : "Expand"}
				</button>
			</div>

			{/* Main Layout with Sidebar */}
			<div className="plugin-layout">
				<Sidebar
					activePage={activePage}
					collapsed={sidebarCollapsed}
					onPageChange={setActivePage}
					onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
				/>

				{/* Page Content */}
				<div className="plugin-main">{renderPage()}</div>
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
	} catch (_error) {}
}
