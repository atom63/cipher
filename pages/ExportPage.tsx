import {
	Check,
	ChevronDown,
	ChevronRight,
	Code,
	Copy,
	Database,
	Download,
	FileDown,
	Grid,
	Paintbrush,
	Palette,
	Sparkles,
	Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Alert,
	Button,
	CheckboxWithLabel,
	EmptyState,
	LoadingState,
	RadioGroup,
	SectionHeader,
	TabPanel,
	Tabs,
	useToast,
} from "../components/ui";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import type { CSSFileInfo } from "../types/messages";
import styles from "./ExportPage.module.css";

interface Collection {
	id: string;
	name: string;
	variableCount: number;
	modes: string[];
}

interface StyleGroup {
	name: string;
	count: number;
}

interface StylesByCategory {
	paint: StyleGroup[];
	text: StyleGroup[];
	effect: StyleGroup[];
	grid: StyleGroup[];
}

type ExportViewState = "selection" | "exporting" | "success" | "css-preview";
type ColorFormat = "oklch" | "hex" | "rgba";

export function ExportPage() {
	const [view, setView] = useState<ExportViewState>("selection");
	const [activeTab, setActiveTab] = useState<"variables" | "css" | "styles">(
		"variables",
	);
	const [collections, setCollections] = useState<Collection[]>([]);
	const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
		[],
	);
	const [stylesByCategory, setStylesByCategory] = useState<StylesByCategory>({
		paint: [],
		text: [],
		effect: [],
		grid: [],
	});
	const [selectedStyleGroups, setSelectedStyleGroups] = useState<
		{ category: "paint" | "text" | "effect" | "grid"; group: string }[]
	>([]);
	const [colorFormat, setColorFormat] = useState<ColorFormat>("oklch");
	const [loading, setLoading] = useState(true);
	const [exportResult, setExportResult] = useState<{
		tokens: any;
		collectionCount: number;
		variableCount: number;
		format: ColorFormat;
	} | null>(null);
	const [stylesExportResult, setStylesExportResult] = useState<{
		styles: any;
		counts: any;
		format: ColorFormat;
	} | null>(null);
	const [cssFiles, setCssFiles] = useState<CSSFileInfo[]>([]);
	const [cssStats, setCssStats] = useState<{
		totalVariables: number;
		totalCollections: number;
	} | null>(null);
	const [expandedCssFile, setExpandedCssFile] = useState<string | null>(null);
	const [includeThemeInline, setIncludeThemeInline] = useState(false);

	const postMessage = usePostMessage();
	const { showSuccess, showError } = useToast();

	// Request collections, styles, and saved settings on mount
	useEffect(() => {
		postMessage({ type: "get-collections" });
		postMessage({ type: "get-styles" });
		postMessage({ type: "load-settings" });
	}, [postMessage]);

	// Listen for messages from Figma main thread
	useFigmaMessage((msg) => {
		if (msg.type === "settings-loaded") {
			if (msg.data.colorFormat) {
				setColorFormat(msg.data.colorFormat as ColorFormat);
			}
			if (msg.data.lastExportTab) {
				setActiveTab(msg.data.lastExportTab as "variables" | "styles");
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
			setSelectedCollectionIds(cols.map((c: Collection) => c.id));
			setLoading(false);
		}

		if (msg.type === "styles-list") {
			const stylesData = msg.data.stylesByCategory as StylesByCategory;
			setStylesByCategory(stylesData);
			const allSelections: {
				category: "paint" | "text" | "effect" | "grid";
				group: string;
			}[] = [];
			for (const category of ["paint", "text", "effect", "grid"] as const) {
				for (const group of stylesData[category]) {
					allSelections.push({ category, group: group.name });
				}
			}
			setSelectedStyleGroups(allSelections);
		}

		if (msg.type === "export-complete") {
			setExportResult({ ...msg.data, format: msg.data.format as ColorFormat });
			setView("success");
			downloadJSON(msg.data.tokens, "design-tokens");
		}

		if (msg.type === "styles-export-complete") {
			setStylesExportResult({
				...msg.data,
				format: msg.data.format as ColorFormat,
			});
			setView("success");
			downloadJSON(msg.data.styles, "figma-styles");
		}

		if (msg.type === "css-export-complete") {
			setCssFiles(msg.data.files);
			setCssStats({
				totalVariables: msg.data.totalVariables,
				totalCollections: msg.data.totalCollections,
			});
			setView("css-preview");
			// Auto-expand first file
			if (msg.data.files.length > 0) {
				setExpandedCssFile(msg.data.files[0].name);
			}
		}

		if (msg.type === "export-error") {
			showError(`Export error: ${msg.data.message}`);
			setView("selection");
		}
	});

	const handleColorFormatChange = (value: string) => {
		const format = value as ColorFormat;
		setColorFormat(format);
		postMessage({ type: "save-settings", data: { colorFormat: format } });
	};

	const handleTabChange = (tabId: string) => {
		const tab = tabId as "variables" | "css" | "styles";
		setActiveTab(tab);
		// Only persist variables/styles to settings (css is new, settings type doesn't include it yet)
		if (tab === "variables" || tab === "styles") {
			postMessage({ type: "save-settings", data: { lastExportTab: tab } });
		}
	};

	const handleToggleCollection = (collectionId: string) => {
		setSelectedCollectionIds((prev) =>
			prev.includes(collectionId)
				? prev.filter((id) => id !== collectionId)
				: [...prev, collectionId],
		);
	};

	const handleToggleAll = () => {
		if (selectedCollectionIds.length === collections.length) {
			setSelectedCollectionIds([]);
		} else {
			setSelectedCollectionIds(collections.map((c) => c.id));
		}
	};

	const handleToggleStyleGroup = (
		category: "paint" | "text" | "effect" | "grid",
		groupName: string,
	) => {
		setSelectedStyleGroups((prev) => {
			const exists = prev.some(
				(s) => s.category === category && s.group === groupName,
			);
			if (exists) {
				return prev.filter(
					(s) => !(s.category === category && s.group === groupName),
				);
			}
			return [...prev, { category, group: groupName }];
		});
	};

	const handleToggleAllStyles = () => {
		const totalGroups = Object.values(stylesByCategory).reduce(
			(sum, groups) => sum + groups.length,
			0,
		);
		if (selectedStyleGroups.length === totalGroups) {
			setSelectedStyleGroups([]);
		} else {
			const allSelections: {
				category: "paint" | "text" | "effect" | "grid";
				group: string;
			}[] = [];
			for (const category of ["paint", "text", "effect", "grid"] as const) {
				for (const group of stylesByCategory[category]) {
					allSelections.push({ category, group: group.name });
				}
			}
			setSelectedStyleGroups(allSelections);
		}
	};

	const isStyleGroupSelected = (category: string, groupName: string) => {
		return selectedStyleGroups.some(
			(s) => s.category === category && s.group === groupName,
		);
	};

	const handleExport = () => {
		if (selectedCollectionIds.length === 0) {
			showError("Please select at least one collection to export");
			return;
		}

		setView("exporting");
		postMessage({
			type: "export-variables",
			data: {
				collectionIds: selectedCollectionIds,
				colorFormat: colorFormat,
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

	const handleExportStyles = () => {
		if (selectedStyleGroups.length === 0) {
			showError("Please select at least one style group to export");
			return;
		}

		setView("exporting");
		postMessage({
			type: "export-styles",
			data: {
				selectedGroups: selectedStyleGroups,
				colorFormat: colorFormat,
			},
		});
	};

	const handleExportCSS = () => {
		if (selectedCollectionIds.length === 0) {
			showError("Please select at least one collection to export");
			return;
		}

		setView("exporting");
		postMessage({
			type: "export-css",
			data: {
				collectionIds: selectedCollectionIds,
				colorFormat,
				includeThemeInline,
				includeColorMix: false,
			},
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				showSuccess(`Copied ${label}`);
			})
			.catch(() => {
				showError("Failed to copy");
			});
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
		setStylesExportResult(null);
		setCssFiles([]);
		setCssStats(null);
	};

	const handleClose = () => {
		postMessage({ type: "close" });
	};

	// Determine initial tab - if no collections, default to styles
	useEffect(() => {
		const totalStyles = Object.values(stylesByCategory).reduce(
			(sum, groups) => sum + groups.length,
			0,
		);
		if (!loading && collections.length === 0 && totalStyles > 0) {
			setActiveTab("styles");
		}
	}, [loading, collections.length, stylesByCategory]);

	if (loading) {
		return (
			<div className="page-content">
				<LoadingState message="Loading collections and styles…" />
			</div>
		);
	}

	if (view === "exporting") {
		return (
			<div className="page-content">
				<LoadingState
					message={
						exportResult ? "Exporting variables…" : "Exporting styles…"
					}
				/>
			</div>
		);
	}

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
					<Button variant="ghost" onClick={handleExportAgain}>
						<FileDown size={14} />
						Back
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

	if (view === "success" && (exportResult || stylesExportResult)) {
		return (
			<div className="page-content">
				<div className={styles.successView}>
					<div className={styles.successIcon}>
						<Check size={40} />
					</div>

					<div className={styles.successContent}>
						<h2>Export Complete!</h2>
						<p>
							Your {exportResult ? "design tokens" : "Figma styles"} have been
							downloaded
						</p>
					</div>

					{exportResult && (
						<div className={styles.successStats}>
							<div className={styles.successStatsContent}>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Collections:</span>
									<strong className={styles.successStatValue}>
										{exportResult.collectionCount}
									</strong>
								</div>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Variables:</span>
									<strong className={styles.successStatValue}>
										{exportResult.variableCount}
									</strong>
								</div>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Color Format:</span>
									<strong className={styles.successStatValue}>
										{exportResult.format.toUpperCase()}
									</strong>
								</div>
							</div>
						</div>
					)}

					{stylesExportResult && (
						<div className={styles.successStats}>
							<div className={styles.successStatsContent}>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Color:</span>
									<strong className={styles.successStatValue}>
										{stylesExportResult.counts.paint}
									</strong>
								</div>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Text:</span>
									<strong className={styles.successStatValue}>
										{stylesExportResult.counts.text}
									</strong>
								</div>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Effect:</span>
									<strong className={styles.successStatValue}>
										{stylesExportResult.counts.effect}
									</strong>
								</div>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Layout grid:</span>
									<strong className={styles.successStatValue}>
										{stylesExportResult.counts.grid}
									</strong>
								</div>
								<div className={styles.successStatRow}>
									<span className={styles.successStatLabel}>Color Format:</span>
									<strong className={styles.successStatValue}>
										{stylesExportResult.format.toUpperCase()}
									</strong>
								</div>
							</div>
						</div>
					)}

					<div className={styles.successActions}>
						<Button variant="ghost" onClick={handleExportAgain}>
							<FileDown size={14} />
							Export More
						</Button>
						<Button variant="primary" onClick={handleClose}>
							Close
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="page-content">
			<SectionHeader
				variant="primary"
				title="Export"
				description="Export Variables or Styles from your Figma file"
			/>

			<Tabs
				tabs={[
					{
						id: "variables",
						label: "JSON",
						icon: <Database size={16} />,
					},
					{
						id: "css",
						label: "CSS",
						icon: <Code size={16} />,
					},
					{
						id: "styles",
						label: "Styles",
						icon: <Paintbrush size={16} />,
					},
				]}
				activeTab={activeTab}
				onTabChange={handleTabChange}
			>
				<TabPanel id="variables" activeTab={activeTab}>
					{collections.length === 0 ? (
						<EmptyState
							icon="📦"
							title="No Variable Collections"
							description="This file has no variable collections. Try the Styles tab to export Figma Styles instead."
						/>
					) : (
						<>
							{/* Color Format Selection */}
							<div className={styles.formatSection}>
								<RadioGroup
									label="Color Format"
									description="Choose how colors should be exported"
									name="color-format"
									variant="inline"
									value={colorFormat}
									onChange={handleColorFormatChange}
									options={[
										{
											value: "oklch",
											label: "OKLCH",
											description:
												"Modern perceptual color space with alpha support (recommended)",
										},
										{
											value: "hex",
											label: "HEX",
											description:
												"Hexadecimal format (#RRGGBB or #RRGGBBAA with opacity)",
										},
										{
											value: "rgba",
											label: "RGBA",
											description: "RGB with alpha channel rgba(r, g, b, a)",
										},
									]}
								/>
							</div>

							{/* Select All / Deselect All */}
							<div className={styles.selectAllSection}>
								<CheckboxWithLabel
									id="select-all"
									label="Select All Collections"
									checked={selectedCollectionIds.length === collections.length}
									onChange={() => handleToggleAll()}
								/>
							</div>

							{/* Collection List */}
							<div className={styles.collectionList}>
								{collections.map((collection) => {
									const isSelected = selectedCollectionIds.includes(
										collection.id,
									);
									return (
										<div
											key={collection.id}
											className={styles.collectionCard}
											data-selected={isSelected}
											onClick={() => handleToggleCollection(collection.id)}
										>
											<div className={styles.collectionCardContent}>
												<CheckboxWithLabel
													id={`collection-${collection.id}`}
													label={collection.name}
													checked={isSelected}
													onChange={() => handleToggleCollection(collection.id)}
												/>
												<div className={styles.collectionMeta}>
													<span>
														{collection.variableCount} variable
														{collection.variableCount !== 1 ? "s" : ""}
													</span>
													<span>•</span>
													<span>{collection.modes.join(", ")}</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* Export Actions */}
							<div className={styles.exportActions}>
								<Button
									variant="primary"
									onClick={handleExport}
									disabled={selectedCollectionIds.length === 0}
								>
									<Download size={14} />
									Export Variables{" "}
									{selectedCollectionIds.length > 0 &&
										`(${selectedCollectionIds.length})`}
								</Button>
							</div>

							{/* Info Note */}
							<Alert variant="info" title="Variables">
								Export Figma Variables as design tokens in the same format used
								for imports. Perfect for version control and team collaboration.
							</Alert>
						</>
					)}
				</TabPanel>

				<TabPanel id="css" activeTab={activeTab}>
					{collections.length === 0 ? (
						<EmptyState
							icon="📦"
							title="No Variable Collections"
							description="This file has no variable collections to generate CSS from."
						/>
					) : (
						<>
							{/* Color Format Selection */}
							<div className={styles.formatSection}>
								<RadioGroup
									label="Color Format"
									description="Choose how colors should be exported in CSS"
									name="color-format-css"
									variant="inline"
									value={colorFormat}
									onChange={handleColorFormatChange}
									options={[
										{
											value: "oklch",
											label: "OKLCH",
											description:
												"Modern perceptual color space (recommended)",
										},
										{
											value: "hex",
											label: "HEX",
											description: "Hexadecimal format (#RRGGBB)",
										},
										{
											value: "rgba",
											label: "RGBA",
											description: "RGB with alpha channel",
										},
									]}
								/>
							</div>

							{/* Options */}
							<div className={styles.selectAllSection}>
								<CheckboxWithLabel
									id="theme-inline"
									label="Include @theme inline (Tailwind CSS v4)"
									checked={includeThemeInline}
									onChange={() => setIncludeThemeInline(!includeThemeInline)}
								/>
							</div>

							{/* Select All / Deselect All */}
							<div className={styles.selectAllSection}>
								<CheckboxWithLabel
									id="select-all-css"
									label="Select All Collections"
									checked={selectedCollectionIds.length === collections.length}
									onChange={() => handleToggleAll()}
								/>
							</div>

							{/* Collection List */}
							<div className={styles.collectionList}>
								{collections.map((collection) => {
									const isSelected = selectedCollectionIds.includes(
										collection.id,
									);
									return (
										<div
											key={collection.id}
											className={styles.collectionCard}
											data-selected={isSelected}
											onClick={() => handleToggleCollection(collection.id)}
										>
											<div className={styles.collectionCardContent}>
												<CheckboxWithLabel
													id={`css-collection-${collection.id}`}
													label={collection.name}
													checked={isSelected}
													onChange={() => handleToggleCollection(collection.id)}
												/>
												<div className={styles.collectionMeta}>
													<span>
														{collection.variableCount} variable
														{collection.variableCount !== 1 ? "s" : ""}
													</span>
													<span>•</span>
													<span>{collection.modes.join(", ")}</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* Export Actions */}
							<div className={styles.exportActions}>
								<Button
									variant="primary"
									onClick={handleExportCSS}
									disabled={selectedCollectionIds.length === 0}
								>
									<Code size={14} />
									Generate CSS{" "}
									{selectedCollectionIds.length > 0 &&
										`(${selectedCollectionIds.length})`}
								</Button>
							</div>

							<Alert variant="info" title="CSS Export">
								Generates CSS custom properties directly from Figma Variables.
								Multi-mode collections (Light/Dark) output separate selectors.
								References between collections are preserved as var()
								references.
							</Alert>
						</>
					)}
				</TabPanel>

				<TabPanel id="styles" activeTab={activeTab}>
					{Object.values(stylesByCategory).every((cat) => cat.length === 0) ? (
						<EmptyState
							icon="🎨"
							title="No Styles Found"
							description="This file has no Figma Styles. Modern files typically use Variables instead."
						/>
					) : (
						<>
							{/* Color Format Selection */}
							<div className={styles.formatSection}>
								<RadioGroup
									label="Color Format"
									description="Choose how colors should be exported"
									name="color-format-styles"
									variant="inline"
									value={colorFormat}
									onChange={handleColorFormatChange}
									options={[
										{
											value: "oklch",
											label: "OKLCH",
											description:
												"Modern perceptual color space (recommended)",
										},
										{
											value: "hex",
											label: "HEX",
											description: "Traditional hexadecimal format (#RRGGBB)",
										},
										{
											value: "rgba",
											label: "RGBA",
											description: "RGB with alpha channel rgba(r, g, b, a)",
										},
									]}
								/>
							</div>

							{/* Select All / Deselect All */}
							<div className={styles.selectAllSection}>
								<CheckboxWithLabel
									id="select-all-styles"
									label="Select All Style Groups"
									checked={
										selectedStyleGroups.length ===
										Object.values(stylesByCategory).reduce(
											(sum, groups) => sum + groups.length,
											0,
										)
									}
									onChange={() => handleToggleAllStyles()}
								/>
							</div>

							{/* Style Categories */}
							<div className={styles.styleCategoriesContainer}>
								{stylesByCategory.paint.length > 0 && (
									<div className={styles.categorySection}>
										<div className={styles.categoryHeader}>
											<Palette size={16} />
											<h3>Color</h3>
											<span className={styles.categoryCount}>
												({stylesByCategory.paint.length})
											</span>
										</div>
										<div className={styles.categoryGroups}>
											{stylesByCategory.paint.map((group) => {
												const isSelected = isStyleGroupSelected(
													"paint",
													group.name,
												);
												return (
													<div
														key={`paint-${group.name}`}
														className={styles.styleGroupItem}
														data-selected={isSelected}
														onClick={() =>
															handleToggleStyleGroup("paint", group.name)
														}
													>
														<CheckboxWithLabel
															id={`paint-${group.name}`}
															label={group.name}
															checked={isSelected}
															onChange={() =>
																handleToggleStyleGroup("paint", group.name)
															}
														/>
														<span className={styles.styleGroupCount}>
															{group.count} style{group.count !== 1 ? "s" : ""}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{stylesByCategory.text.length > 0 && (
									<div className={styles.categorySection}>
										<div className={styles.categoryHeader}>
											<Type size={16} />
											<h3>Text</h3>
											<span className={styles.categoryCount}>
												({stylesByCategory.text.length})
											</span>
										</div>
										<div className={styles.categoryGroups}>
											{stylesByCategory.text.map((group) => {
												const isSelected = isStyleGroupSelected(
													"text",
													group.name,
												);
												return (
													<div
														key={`text-${group.name}`}
														className={styles.styleGroupItem}
														data-selected={isSelected}
														onClick={() =>
															handleToggleStyleGroup("text", group.name)
														}
													>
														<CheckboxWithLabel
															id={`text-${group.name}`}
															label={group.name}
															checked={isSelected}
															onChange={() =>
																handleToggleStyleGroup("text", group.name)
															}
														/>
														<span className={styles.styleGroupCount}>
															{group.count} style{group.count !== 1 ? "s" : ""}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{stylesByCategory.effect.length > 0 && (
									<div className={styles.categorySection}>
										<div className={styles.categoryHeader}>
											<Sparkles size={16} />
											<h3>Effect</h3>
											<span className={styles.categoryCount}>
												({stylesByCategory.effect.length})
											</span>
										</div>
										<div className={styles.categoryGroups}>
											{stylesByCategory.effect.map((group) => {
												const isSelected = isStyleGroupSelected(
													"effect",
													group.name,
												);
												return (
													<div
														key={`effect-${group.name}`}
														className={styles.styleGroupItem}
														data-selected={isSelected}
														onClick={() =>
															handleToggleStyleGroup("effect", group.name)
														}
													>
														<CheckboxWithLabel
															id={`effect-${group.name}`}
															label={group.name}
															checked={isSelected}
															onChange={() =>
																handleToggleStyleGroup("effect", group.name)
															}
														/>
														<span className={styles.styleGroupCount}>
															{group.count} style{group.count !== 1 ? "s" : ""}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{stylesByCategory.grid.length > 0 && (
									<div className={styles.categorySection}>
										<div className={styles.categoryHeader}>
											<Grid size={16} />
											<h3>Layout grid</h3>
											<span className={styles.categoryCount}>
												({stylesByCategory.grid.length})
											</span>
										</div>
										<div className={styles.categoryGroups}>
											{stylesByCategory.grid.map((group) => {
												const isSelected = isStyleGroupSelected(
													"grid",
													group.name,
												);
												return (
													<div
														key={`grid-${group.name}`}
														className={styles.styleGroupItem}
														data-selected={isSelected}
														onClick={() =>
															handleToggleStyleGroup("grid", group.name)
														}
													>
														<CheckboxWithLabel
															id={`grid-${group.name}`}
															label={group.name}
															checked={isSelected}
															onChange={() =>
																handleToggleStyleGroup("grid", group.name)
															}
														/>
														<span className={styles.styleGroupCount}>
															{group.count} style{group.count !== 1 ? "s" : ""}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								)}
							</div>

							{/* Export Actions */}
							<div className={styles.exportActions}>
								<Button
									variant="primary"
									onClick={handleExportStyles}
									disabled={selectedStyleGroups.length === 0}
								>
									<Download size={14} />
									Export Styles{" "}
									{selectedStyleGroups.length > 0 &&
										`(${selectedStyleGroups.length})`}
								</Button>
							</div>

							{/* Info Notes */}
							<Alert variant="info" title="Styles Export & Import">
								Export and import legacy Figma Styles with full variable binding
								support. Variable bindings will be automatically restored when
								importing if the referenced variables exist.
							</Alert>

							<Alert variant="info" title="What Gets Exported">
								• <strong>Color:</strong> Solid colors, gradients (with variable
								bindings)
								<br />• <strong>Text:</strong> Typography settings and font
								properties
								<br />• <strong>Effect:</strong> Shadows and blurs
								<br />• <strong>Layout grid:</strong> Grid layouts and guides
							</Alert>
						</>
					)}
				</TabPanel>
			</Tabs>
		</div>
	);
}
