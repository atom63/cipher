import {
	Archive,
	Check,
	CircleOff,
	Code,
	Download,
	FileDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageBody, PageFooter, PageLayout } from "../components/layout";
import {
	Accordion,
	AccordionItem,
	AccordionPanel,
	AccordionTrigger,
	Alert,
	Button,
	CodeBlock,
	CopyButton,
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
	const [activeTab, setActiveTab] = useState<"json" | "css">("css");
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
	const { showError } = useToast();

	useEffect(() => {
		postMessage({ type: "get-collections" });
		postMessage({ type: "load-settings" });
	}, [postMessage]);

	useFigmaMessage((msg) => {
		if (msg.type === "settings-loaded") {
			if (msg.data.colorFormat) {
				setColorFormat(msg.data.colorFormat as ColorFormat);
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
			setExpandedCssFile(null);
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
		setActiveTab(tabId as "json" | "css");
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

	const allCssText = () =>
		cssFiles
			.filter((f) => f.name !== "index.css")
			.map((f) => `/* === ${f.name} === */\n${f.content}`)
			.join("\n\n");

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
			<PageLayout>
				<LoadingState message="Loading collections…" />
			</PageLayout>
		);
	}

	// Exporting
	if (view === "exporting") {
		return (
			<PageLayout>
				<LoadingState message="Exporting…" />
			</PageLayout>
		);
	}

	// CSS Preview
	if (view === "css-preview" && cssFiles.length > 0) {
		const visibleFiles = cssFiles.filter((f) => f.name !== "index.css");
		return (
			<PageLayout>
				<PageBody>
					<div className={styles.successView}>
						<div className={styles.successIcon}>
							<Check size={24} />
						</div>
						<div className={styles.successContent}>
							<h2>CSS Export Complete</h2>
							<p>
								{cssStats?.totalVariables ?? 0} variables across{" "}
								{visibleFiles.length} files
							</p>
						</div>
					</div>

					<Accordion variant="flat">
						{visibleFiles.map((file) => {
							const isExpanded = expandedCssFile === file.name;
							return (
								<AccordionItem expanded={isExpanded} key={file.name}>
									<AccordionTrigger
										expanded={isExpanded}
										onClick={() =>
											setExpandedCssFile(isExpanded ? null : file.name)
										}
									>
										<span className={styles.cssFileName}>{file.name}</span>
										<span className={styles.cssFileCount}>
											{file.variableCount}
										</span>
										<CopyButton
											iconSize={12}
											label={file.name}
											onClick={(e) => e.stopPropagation()}
											size="icon-sm"
											text={file.content}
										/>
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
									</AccordionTrigger>
									<AccordionPanel expanded={isExpanded}>
										<ScrollArea className={styles.cssPreviewCode} orientation="horizontal">
											<CodeBlock>{file.content}</CodeBlock>
										</ScrollArea>
									</AccordionPanel>
								</AccordionItem>
							);
						})}
					</Accordion>
				</PageBody>

				<PageFooter>
					<CopyButton label="all CSS" text={allCssText}>
						Copy All
					</CopyButton>
					<Button onClick={handleExportAgain} variant="ghost">
						<FileDown size={14} />
						Export Again
					</Button>
					<Button
						onClick={() =>
							downloadAsZip(
								cssFiles.map((f) => ({ name: f.name, content: f.content })),
								"design-tokens-css",
							)
						}
						variant="primary"
					>
						<Archive size={14} />
						Download ZIP
					</Button>
				</PageFooter>
			</PageLayout>
		);
	}

	// Success (JSON export)
	if (view === "success" && exportResult) {
		return (
			<PageLayout>
				<div className={styles.successView}>
					<div className={styles.successIcon}>
						<Check size={24} />
					</div>

					<div className={styles.successContent}>
						<h2>Export Complete</h2>
						<p>Your design tokens have been downloaded</p>
					</div>

					<div className={styles.successStats}>
						<div className={styles.successStat}>
							<span className={styles.successStatLabel}>Collections</span>
							<strong className={styles.successStatValue}>
								{exportResult.collectionCount}
							</strong>
						</div>
						<div className={styles.successStat}>
							<span className={styles.successStatLabel}>Variables</span>
							<strong className={styles.successStatValue}>
								{exportResult.variableCount}
							</strong>
						</div>
						<div className={styles.successStat}>
							<span className={styles.successStatLabel}>Format</span>
							<strong className={styles.successStatValue}>
								{exportResult.format.toUpperCase()}
							</strong>
						</div>
					</div>

					<div className={styles.successActions}>
						<Button onClick={handleExportAgain} variant="ghost">
							<FileDown size={14} />
							Export Again
						</Button>
						<Button
							onClick={() => {
								handleExportAgain();
								setActiveTab("css");
							}}
							variant="default"
						>
							<Code size={14} />
							Export as CSS
						</Button>
					</div>
				</div>
			</PageLayout>
		);
	}

	// No collections
	if (collections.length === 0) {
		return (
			<PageLayout>
				<PageBody>
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
				</PageBody>
			</PageLayout>
		);
	}

	// Main selection view
	return (
		<PageLayout>
			<PageBody>
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
								</div>
							</TabPanel>
						</Tabs>
					</FramePanel>
				</Frame>
			</PageBody>

			<PageFooter>
				<Button
					onClick={activeTab === "css" ? handleExportCSS : handleExportJSON}
					variant="primary"
				>
					{activeTab === "css" ? <Code size={14} /> : <Download size={14} />}
					{activeTab === "css" ? "Export CSS" : "Export JSON"}
				</Button>
			</PageFooter>
		</PageLayout>
	);
}
