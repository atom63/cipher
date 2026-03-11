import {
	Archive,
	Check,
	ChevronDown,
	ChevronRight,
	CircleOff,
	Code,
	Copy,
	Download,
	FileDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Alert,
	Button,
	EmptyState,
	Frame,
	FrameFooter,
	FramePanel,
	LoadingState,
	ScrollArea,
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
	modes: string[];
	name: string;
	variableCount: number;
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

	const totalVariables = collections.reduce(
		(sum, c) => sum + c.variableCount,
		0,
	);

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
					description={`${cssStats?.totalVariables ?? 0} variables from ${cssStats?.totalCollections ?? 0} collection${(cssStats?.totalCollections ?? 0) !== 1 ? "s" : ""}`}
					title="CSS Export"
					variant="primary"
				/>

				<Frame>
					<FrameFooter>
						<Button onClick={copyAllCSS} variant="ghost">
							<Copy size={14} />
							Copy All
						</Button>
						<Button
							onClick={() =>
								downloadAsZip(
									cssFiles.map((f) => ({ name: f.name, content: f.content })),
									"design-tokens-css",
								)
							}
							variant="ghost"
						>
							<Archive size={14} />
							Download ZIP
						</Button>
						<Button onClick={handleExportAgain} variant="ghost">
							<FileDown size={14} />
							Export Again
						</Button>
					</FrameFooter>
					<FramePanel>
						<div className={styles.cssFileList}>
							{cssFiles
								.filter((f) => f.name !== "index.css")
								.map((file) => {
									const isExpanded = expandedCssFile === file.name;
									return (
										<div className={styles.cssFileItem} key={file.name}>
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
													data-tooltip="Copy"
													onClick={(e: React.MouseEvent) => {
														e.stopPropagation();
														copyToClipboard(file.content, file.name);
													}}
													size="icon-sm"
													variant="ghost"
												>
													<Copy size={12} />
												</Button>
												<Button
													data-tooltip="Download"
													onClick={(e: React.MouseEvent) => {
														e.stopPropagation();
														downloadCSS(file);
													}}
													size="icon-sm"
													variant="ghost"
												>
													<Download size={12} />
												</Button>
											</div>
											{isExpanded && (
												<ScrollArea className={styles.cssPreviewCode} orientation="both">
													<pre className={styles.cssPreviewPre}>
														<code>{file.content}</code>
													</pre>
												</ScrollArea>
											)}
										</div>
									);
								})}
						</div>
					</FramePanel>
				</Frame>
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
						<Button onClick={handleExportAgain}variant="default" >
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
					description="Export your design tokens as JSON or CSS"
					title="Export"
					variant="primary"
				/>
				<EmptyState
					description="This file has no variable collections to export."
					icon={<CircleOff size={32} />}
					title="No Variable Collections"
				/>
			</div>
		);
	}

	// Main selection view
	return (
		<div className="page-content">
			<SectionHeader
				description={`${totalVariables} variables across ${collections.length} collection${collections.length !== 1 ? "s" : ""}`}
				title="Export"
				variant="primary"
			/>

			<Frame>
				<FrameFooter>
					<span className={styles.formatLabel}>Color format</span>
					<div className={styles.formatOptions}>
						{(["oklch", "hex", "rgba"] as const).map((fmt) => (
							<button
								className={styles.formatOption}
								data-selected={colorFormat === fmt}
								key={fmt}
								onClick={() => handleColorFormatChange(fmt)}
								type="button"
							>
								{fmt.toUpperCase()}
							</button>
						))}
					</div>
				</FrameFooter>
				{colorFormat !== "rgba" && (
					<div style={{ padding: "var(--spacing-sm)" }}>
						<Alert variant="info">
							Variables with opacity values will only export correctly in RGBA format.
						</Alert>
					</div>
				)}
				<FramePanel>
					<Tabs
						activeTab={activeTab}
						onTabChange={handleTabChange}
						size="sm"
						tabs={[
							{ id: "json", label: "JSON" },
							{ id: "css", label: "CSS" },
						]}
					>
						<TabPanel activeTab={activeTab} id="json">
							<div className={styles.tabContent}>
								<p className={styles.tabDescription}>
									Structured token file for cross-platform use, Style Dictionary
									pipelines, or re-importing into Figma.
								</p>

								<div className={styles.collectionSummary}>
									{collections.map((c) => (
										<div className={styles.collectionRow} key={c.id}>
											<span className={styles.collectionName}>{c.name}</span>
											<span className={styles.collectionMeta}>
												{c.variableCount} var{c.variableCount !== 1 ? "s" : ""}
												{c.modes.length > 1 && ` · ${c.modes.join(", ")}`}
											</span>
										</div>
									))}
								</div>

								<div className={styles.exportActions}>
									<Button onClick={handleExportJSON} variant="primary">
										<Download size={14} />
										Export JSON
									</Button>
								</div>
							</div>
						</TabPanel>

						<TabPanel activeTab={activeTab} id="css">
							<div className={styles.tabContent}>
								<p className={styles.tabDescription}>
									Production-ready CSS custom properties with{" "}
									<code>color-mix()</code> opacity and <code>@theme inline</code>{" "}
									for Tailwind. Import <code>index.css</code> and go.
								</p>

								<div className={styles.collectionSummary}>
									{collections.map((c) => (
										<div className={styles.collectionRow} key={c.id}>
											<span className={styles.collectionName}>{c.name}</span>
											<span className={styles.collectionMeta}>
												{c.variableCount} var{c.variableCount !== 1 ? "s" : ""}
												{c.modes.length > 1 && ` · ${c.modes.join(", ")}`}
											</span>
										</div>
									))}
								</div>

								<div className={styles.exportActions}>
									<Button onClick={handleExportCSS} variant="primary">
										<Code size={14} />
										Export CSS
									</Button>
								</div>
							</div>
						</TabPanel>
					</Tabs>
				</FramePanel>
			</Frame>
		</div>
	);
}
