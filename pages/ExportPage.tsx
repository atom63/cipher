import {
	Archive,
	Check,
	ChevronDown,
	ChevronRight,
	CircleOff,
	Code,
	Copy,
	Database,
	Download,
	FileDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	EmptyState,
	LoadingState,
	SectionHeader,
	TabPanel,
	Tabs,
	useToast,
} from "../components/ui";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import type { CSSFileInfo } from "../types/messages";
import { downloadAsZip } from "../utils/zip-download";
import styles from "./ExportPage.module.css";

interface Collection {
	id: string;
	name: string;
	variableCount: number;
	modes: string[];
}

type ExportViewState = "selection" | "exporting" | "success" | "css-preview";
type ColorFormat = "oklch" | "hex" | "rgba";

export function ExportPage() {
	const [view, setView] = useState<ExportViewState>("selection");
	const [activeTab, setActiveTab] = useState<"json" | "css">("json");
	const [collections, setCollections] = useState<Collection[]>([]);
	const [colorFormat, setColorFormat] = useState<ColorFormat>("oklch");
	const [loading, setLoading] = useState(true);
	const [exportResult, setExportResult] = useState<{
		tokens: any;
		collectionCount: number;
		variableCount: number;
		format: ColorFormat;
	} | null>(null);
	const [cssFiles, setCssFiles] = useState<CSSFileInfo[]>([]);
	const [cssStats, setCssStats] = useState<{
		totalVariables: number;
		totalCollections: number;
	} | null>(null);
	const [expandedCssFile, setExpandedCssFile] = useState<string | null>(null);

	const postMessage = usePostMessage();
	const { showSuccess, showError } = useToast();

	useEffect(() => {
		postMessage({ type: "get-collections" });
		postMessage({ type: "load-settings" });
	}, [postMessage]);

	useFigmaMessage((msg) => {
		if (msg.type === "settings-loaded") {
			if (msg.data.colorFormat) {
				setColorFormat(msg.data.colorFormat as ColorFormat);
			}
			if (msg.data.lastExportTab) {
				setActiveTab(msg.data.lastExportTab === "css" ? "css" : "json");
			}
		}

		if (msg.type === "collections-list") {
			const cols = msg.data.collections.map((c) => ({
				id: c.id,
				name: c.name,
				variableCount: c.variableCount,
				modes: (c as any).modes || ["Default"],
			}));
			setCollections(cols);
			setLoading(false);
		}

		if (msg.type === "export-complete") {
			setExportResult({ ...msg.data, format: msg.data.format as ColorFormat });
			setView("success");
			downloadJSON(msg.data.tokens, "design-tokens");
		}

		if (msg.type === "css-export-complete") {
			setCssFiles(msg.data.files);
			setCssStats({
				totalVariables: msg.data.totalVariables,
				totalCollections: msg.data.totalCollections,
			});
			setView("css-preview");
			if (msg.data.files.length > 0) {
				setExpandedCssFile(msg.data.files[0].name);
			}
		}

		if (msg.type === "export-error") {
			showError(`Export error: ${msg.data.message}`);
			setView("selection");
		}
	});

	const handleColorFormatChange = (format: ColorFormat) => {
		setColorFormat(format);
		postMessage({ type: "save-settings", data: { colorFormat: format } });
	};

	const handleTabChange = (tabId: string) => {
		const tab = tabId as "json" | "css";
		setActiveTab(tab);
	};

	const totalVariables = collections.reduce((sum, c) => sum + c.variableCount, 0);

	const handleExportJSON = () => {
		setView("exporting");
		postMessage({
			type: "export-variables",
			data: {
				collectionIds: collections.map((c) => c.id),
				colorFormat,
			},
		});
	};

	const handleExportCSS = () => {
		setView("exporting");
		postMessage({
			type: "export-css",
			data: {
				collectionIds: collections.map((c) => c.id),
				colorFormat,
				includeThemeInline: true,
				includeColorMix: true,
			},
		});
	};

	const downloadJSON = (data: any, prefix: string = "export") => {
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${prefix}-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => showSuccess(`Copied ${label}`))
			.catch(() => showError("Failed to copy"));
	};

	const copyAllCSS = () => {
		const all = cssFiles
			.filter((f) => f.name !== "index.css")
			.map((f) => `/* === ${f.name} === */\n${f.content}`)
			.join("\n\n");
		copyToClipboard(all, "all CSS");
	};

	const downloadCSS = (file: CSSFileInfo) => {
		const blob = new Blob([file.content], { type: "text/css" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = file.name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleExportAgain = () => {
		setView("selection");
		setExportResult(null);
		setCssFiles([]);
		setCssStats(null);
	};

	// Loading
	if (loading) {
		return (
			<div className="page-content">
				<LoadingState message="Loading collections…" />
			</div>
		);
	}

	// Exporting
	if (view === "exporting") {
		return (
			<div className="page-content">
				<LoadingState message="Exporting…" />
			</div>
		);
	}

	// CSS Preview
	if (view === "css-preview" && cssFiles.length > 0) {
		return (
			<div className="page-content">
				<SectionHeader
					variant="primary"
					title="CSS Export"
					description={`${cssStats?.totalVariables ?? 0} variables from ${cssStats?.totalCollections ?? 0} collection${(cssStats?.totalCollections ?? 0) !== 1 ? "s" : ""}`}
				/>

				<div className={styles.cssPreviewActions}>
					<Button variant="ghost" onClick={copyAllCSS}>
						<Copy size={14} />
						Copy All
					</Button>
					<Button
						variant="ghost"
						onClick={() =>
							downloadAsZip(
								cssFiles.map((f) => ({ name: f.name, content: f.content })),
								"design-tokens-css",
							)
						}
					>
						<Archive size={14} />
						Download ZIP
					</Button>
					<Button variant="ghost" onClick={handleExportAgain}>
						<FileDown size={14} />
						Export Again
					</Button>
				</div>

				<div className={styles.cssFileList}>
					{cssFiles
						.filter((f) => f.name !== "index.css")
						.map((file) => {
							const isExpanded = expandedCssFile === file.name;
							return (
								<div key={file.name} className={styles.cssFileItem}>
									<div
										className={styles.cssFileHeader}
										onClick={() =>
											setExpandedCssFile(isExpanded ? null : file.name)
										}
									>
										{isExpanded ? (
											<ChevronDown size={14} />
										) : (
											<ChevronRight size={14} />
										)}
										<span className={styles.cssFileName}>{file.name}</span>
										<span className={styles.cssFileCount}>
											{file.variableCount} vars
										</span>
										<Button
											variant="ghost"
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												copyToClipboard(file.content, file.name);
											}}
											data-tooltip="Copy"
										>
											<Copy size={12} />
										</Button>
										<Button
											variant="ghost"
											onClick={(e: React.MouseEvent) => {
												e.stopPropagation();
												downloadCSS(file);
											}}
											data-tooltip="Download"
										>
											<Download size={12} />
										</Button>
									</div>
									{isExpanded && (
										<pre className={styles.cssPreviewCode}>
											<code>{file.content}</code>
										</pre>
									)}
								</div>
							);
						})}
				</div>
			</div>
		);
	}

	// Success (JSON export)
	if (view === "success" && exportResult) {
		return (
			<div className="page-content">
				<div className={styles.successView}>
					<div className={styles.successIcon}>
						<Check size={40} />
					</div>

					<div className={styles.successContent}>
						<h2>Export Complete</h2>
						<p>Your design tokens have been downloaded</p>
					</div>

					<div className={styles.successStats}>
						<div className={styles.successStatsContent}>
							<div className={styles.successStatRow}>
								<span className={styles.successStatLabel}>Collections</span>
								<strong className={styles.successStatValue}>
									{exportResult.collectionCount}
								</strong>
							</div>
							<div className={styles.successStatRow}>
								<span className={styles.successStatLabel}>Variables</span>
								<strong className={styles.successStatValue}>
									{exportResult.variableCount}
								</strong>
							</div>
							<div className={styles.successStatRow}>
								<span className={styles.successStatLabel}>Color Format</span>
								<strong className={styles.successStatValue}>
									{exportResult.format.toUpperCase()}
								</strong>
							</div>
						</div>
					</div>

					<div className={styles.successActions}>
						<Button variant="default" onClick={handleExportAgain}>
							<FileDown size={14} />
							Export Again
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// No collections
	if (collections.length === 0) {
		return (
			<div className="page-content">
				<SectionHeader
					variant="primary"
					title="Export"
					description="Export your design tokens as JSON or CSS"
				/>
				<EmptyState
					icon={<CircleOff size={32} />}
					title="No Variable Collections"
					description="This file has no variable collections to export."
				/>
			</div>
		);
	}

	// Main selection view
	return (
		<div className="page-content">
			<SectionHeader
				variant="primary"
				title="Export"
				description={`${totalVariables} variables across ${collections.length} collection${collections.length !== 1 ? "s" : ""}`}
			/>

			{/* Color Format */}
			<div className={styles.formatRow}>
				<span className={styles.formatLabel}>Color format</span>
				<div className={styles.formatOptions}>
					{(["oklch", "hex", "rgba"] as const).map((fmt) => (
						<button
							key={fmt}
							type="button"
							className={styles.formatOption}
							data-selected={colorFormat === fmt}
							onClick={() => handleColorFormatChange(fmt)}
						>
							{fmt.toUpperCase()}
						</button>
					))}
				</div>
			</div>

			<Tabs
				tabs={[
					{ id: "json", label: "JSON", icon: <Database size={14} /> },
					{ id: "css", label: "CSS", icon: <Code size={14} /> },
				]}
				activeTab={activeTab}
				onTabChange={handleTabChange}
			>
				<TabPanel id="json" activeTab={activeTab}>
					<div className={styles.tabContent}>
						<p className={styles.tabDescription}>
							Structured token file for cross-platform use, Style Dictionary
							pipelines, or re-importing into Figma.
						</p>

						<div className={styles.collectionSummary}>
							{collections.map((c) => (
								<div key={c.id} className={styles.collectionRow}>
									<span className={styles.collectionName}>{c.name}</span>
									<span className={styles.collectionMeta}>
										{c.variableCount} var{c.variableCount !== 1 ? "s" : ""}
										{c.modes.length > 1 && ` · ${c.modes.join(", ")}`}
									</span>
								</div>
							))}
						</div>

						<div className={styles.exportActions}>
							<Button variant="primary" onClick={handleExportJSON}>
								<Download size={14} />
								Export JSON
							</Button>
						</div>
					</div>
				</TabPanel>

				<TabPanel id="css" activeTab={activeTab}>
					<div className={styles.tabContent}>
						<p className={styles.tabDescription}>
							Production-ready CSS custom properties with{" "}
							<code>color-mix()</code> opacity and <code>@theme inline</code>{" "}
							for Tailwind. Import <code>index.css</code> and go.
						</p>

						<div className={styles.collectionSummary}>
							{collections.map((c) => (
								<div key={c.id} className={styles.collectionRow}>
									<span className={styles.collectionName}>{c.name}</span>
									<span className={styles.collectionMeta}>
										{c.variableCount} var{c.variableCount !== 1 ? "s" : ""}
										{c.modes.length > 1 && ` · ${c.modes.join(", ")}`}
									</span>
								</div>
							))}
						</div>

						<div className={styles.exportActions}>
							<Button variant="primary" onClick={handleExportCSS}>
								<Code size={14} />
								Export CSS
							</Button>
						</div>
					</div>
				</TabPanel>
			</Tabs>
		</div>
	);
}
