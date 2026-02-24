import {
	Database,
	Grid,
	Paintbrush,
	Palette,
	Sparkles,
	Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	CollectionSelector,
	FileImport,
	ProgressView,
	SuccessView,
	TokenTable,
} from "../components/import";
import { RadioGroup, SectionHeader } from "../components/ui";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { CheckboxWithLabel } from "../components/ui/Checkbox";
import { TabPanel, Tabs } from "../components/ui/Tabs";
import type { DesignToken, ParsedTokens } from "../types/tokens";
import exportStyles from "./ExportPage.module.css";
import styles from "./ImportPage.module.css";

type ImportViewState =
	| "upload"
	| "collection"
	| "review"
	| "progress"
	| "success";
type FileType = "variables" | "styles";

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

export function ImportPage() {
	const [view, setView] = useState<ImportViewState>("upload");
	const [activeTab, setActiveTab] = useState<"variables" | "styles">(
		"variables",
	);
	const [fileType, setFileType] = useState<FileType>("variables");
	const [tokens, setTokens] = useState<DesignToken[]>([]);
	const [stylesData, setStylesData] = useState<any>(null);
	const [stylesByCategory, setStylesByCategory] = useState<StylesByCategory>({
		paint: [],
		text: [],
		effect: [],
		grid: [],
	});
	const [selectedStyleGroups, setSelectedStyleGroups] = useState<
		{ category: string; group: string }[]
	>([]);
	const [collectionName, setCollectionName] = useState("Design Tokens");
	const [importMode, setImportMode] = useState<"import" | "override">("import");
	const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
	const [result, setResult] = useState({
		success: 0,
		failed: 0,
		errors: [] as string[],
		changes: [] as Array<{
			name: string;
			type: string;
			action: "created" | "updated" | "unchanged";
			oldValue?: string;
			newValue: string;
		}>,
	});

	useEffect(() => {
		// Listen for messages from the plugin code
		window.onmessage = (event) => {
			const msg = event.data.pluginMessage;

			if (msg.type === "tokens-parsed") {
				const parsedData: ParsedTokens = msg.data;

				if (parsedData.errors.length > 0) {
					alert(
						`Parsing errors:\n${parsedData.errors.map((e) => e.message).join("\n")}`,
					);
				}

				if (parsedData.tokens.length > 0) {
					setTokens(parsedData.tokens);
					setFileType("variables");
					setView("collection");
				} else {
					alert("No tokens found in the file");
				}
			}

			if (msg.type === "variables-created" || msg.type === "import-complete") {
				console.log("Import result received:", msg.data);
				setResult(msg.data);
				setView("success");
			}

			if (msg.type === "error") {
				alert(`Error: ${msg.data.message}`);
				setView("upload");
			}
		};
	}, []);

	// Helper: Parse style groups from styles data
	const parseStyleGroups = (stylesObj: any): StylesByCategory => {
		const getGroups = (obj: any): StyleGroup[] => {
			const groups = new Map<string, number>();

			const traverse = (current: any, path: string) => {
				for (const [key, value] of Object.entries(current)) {
					const fullPath = path ? `${path}/${key}` : key;

					if (
						value &&
						typeof value === "object" &&
						"id" in value &&
						"type" in value
					) {
						// This is a style definition
						const parts = fullPath.split("/");
						const rootFolder = parts.length > 1 ? parts[0] : "Root";
						groups.set(rootFolder, (groups.get(rootFolder) || 0) + 1);
					} else if (value && typeof value === "object") {
						traverse(value, fullPath);
					}
				}
			};

			traverse(obj, "");

			return Array.from(groups.entries())
				.map(([name, count]) => ({ name, count }))
				.sort((a, b) => a.name.localeCompare(b.name));
		};

		return {
			paint: stylesObj.paint ? getGroups(stylesObj.paint) : [],
			text: stylesObj.text ? getGroups(stylesObj.text) : [],
			effect: stylesObj.effect ? getGroups(stylesObj.effect) : [],
			grid: stylesObj.grid ? getGroups(stylesObj.grid) : [],
		};
	};

	const handleTokensParsed = (parsed: ParsedTokens) => {
		// Variables file parsed successfully
		if (activeTab !== "variables") {
			const switchTab = confirm(
				"This is a Variables file, but you're in the Styles tab. Switch to Variables tab?",
			);
			if (switchTab) {
				setActiveTab("variables");
			} else {
				return;
			}
		}

		setTokens(parsed.tokens);
		setFileType("variables");
		setView("collection");
	};

	const handleFileParsed = (data: any) => {
		// Detect file type based on schema
		if (data.$schema === "figma-styles-export") {
			// Style export file
			if (activeTab !== "styles") {
				const switchTab = confirm(
					"This is a Styles export file, but you're in the Variables tab. Switch to Styles tab?",
				);
				if (switchTab) {
					setActiveTab("styles");
				} else {
					return;
				}
			}

			setStylesData(data);
			setFileType("styles");

			// Parse style groups
			if (data.styles) {
				const groups = parseStyleGroups(data.styles);
				setStylesByCategory(groups);

				// Select all by default
				const allGroups: { category: string; group: string }[] = [];
				Object.entries(groups).forEach(([category, styleGroups]) => {
					styleGroups.forEach((group: StyleGroup) => {
						allGroups.push({ category, group: group.name });
					});
				});
				setSelectedStyleGroups(allGroups);
			}

			setView("review");
		} else if (
			data.$schema === "design-tokens-with-collections" ||
			data.tokens
		) {
			// Variable tokens file
			if (activeTab !== "variables") {
				const switchTab = confirm(
					"This is a Variables export file, but you're in the Styles tab. Switch to Variables tab?",
				);
				if (switchTab) {
					setActiveTab("variables");
				} else {
					return;
				}
			}

			// Trigger the parser for variables
			alert(
				"Please use the file upload to parse variable tokens. Direct JSON parsing is not yet supported.",
			);
		} else {
			alert(
				"Unknown file format. Please upload a valid design tokens or styles export file.",
			);
		}
	};

	const handleCollectionSelected = (
		mode: "new" | "existing",
		name: string,
		impMode?: "import" | "override",
		collections?: string[],
	) => {
		setCollectionName(name);
		if (impMode) {
			setImportMode(impMode);
		}
		if (collections && collections.length > 0) {
			setSelectedCollections(collections);
		}
		setView("review");
	};

	const handleToggleStyleGroup = (category: string, group: string) => {
		setSelectedStyleGroups((prev) => {
			const exists = prev.some(
				(g) => g.category === category && g.group === group,
			);
			if (exists) {
				return prev.filter(
					(g) => !(g.category === category && g.group === group),
				);
			}
			return [...prev, { category, group }];
		});
	};

	const handleToggleAllStyleGroups = () => {
		const totalGroups = Object.values(stylesByCategory).reduce(
			(sum, groups) => sum + groups.length,
			0,
		);

		if (selectedStyleGroups.length === totalGroups) {
			// Deselect all
			setSelectedStyleGroups([]);
		} else {
			// Select all
			const allGroups: { category: string; group: string }[] = [];
			Object.entries(stylesByCategory).forEach(([category, groups]) => {
				groups.forEach((group: StyleGroup) => {
					allGroups.push({ category, group: group.name });
				});
			});
			setSelectedStyleGroups(allGroups);
		}
	};

	const isStyleGroupSelected = (category: string, group: string) => {
		return selectedStyleGroups.some(
			(g) => g.category === category && g.group === group,
		);
	};

	const handleImport = () => {
		let tokensToImport = tokens.filter((t) => t.action === "import");

		// Filter tokens by selected collections if collections were specified
		if (selectedCollections.length > 0) {
			tokensToImport = tokensToImport.filter((t) =>
				selectedCollections.includes(t.category),
			);
		}

		setView("progress");

		parent.postMessage(
			{
				pluginMessage: {
					type: "create-variables",
					data: {
						tokens: tokensToImport,
						collectionName,
						importMode,
						selectedCollections,
					},
				},
			},
			"*",
		);
	};

	const handleStyleImport = () => {
		if (selectedStyleGroups.length === 0) {
			alert("Please select at least one style group to import");
			return;
		}

		setView("progress");

		parent.postMessage(
			{
				pluginMessage: {
					type: "import-styles",
					data: {
						stylesData,
						selectedGroups: selectedStyleGroups,
						importMode,
					},
				},
			},
			"*",
		);
	};

	const handleCancel = () => {
		setView("upload");
		setTokens([]);
		setCollectionName("Design Tokens");
		setImportMode("import");
		setSelectedCollections([]);
	};

	const handleBackToCollection = () => {
		setView("collection");
	};

	const handleClose = () => {
		parent.postMessage({ pluginMessage: { type: "close" } }, "*");
	};

	const handleImportMore = () => {
		setView("upload");
		setTokens([]);
		setResult({ success: 0, failed: 0, errors: [], changes: [] });
		setImportMode("import");
		setSelectedCollections([]);
	};

	return (
		<div className="page-content">
			{view === "upload" && (
				<>
					<SectionHeader
						variant="primary"
						title="Import"
						description="Import Variables or Styles into your Figma file"
					/>

					<Tabs
						tabs={[
							{
								id: "variables",
								label: "Variables",
								icon: <Database size={16} />,
							},
							{
								id: "styles",
								label: "Styles",
								icon: <Paintbrush size={16} />,
							},
						]}
						activeTab={activeTab}
						onTabChange={(tabId) =>
							setActiveTab(tabId as "variables" | "styles")
						}
					>
						<TabPanel id="variables" activeTab={activeTab}>
							<Alert variant="info" title="Variables Import">
								Upload a design tokens JSON file exported from this plugin.
								Variables will be created or updated with their bindings
								preserved.
							</Alert>

							<FileImport
								onTokensParsed={handleTokensParsed}
								onFileParsed={handleFileParsed}
							/>
						</TabPanel>

						<TabPanel id="styles" activeTab={activeTab}>
							<Alert variant="info" title="Styles Import">
								Upload a Figma styles JSON file exported from this plugin.
								Variable bindings will be automatically restored if the
								referenced variables exist in the file.
							</Alert>

							<Alert variant="warning" title="Import Order">
								If your styles use variable bindings, make sure to import the
								variables file first, then import the styles file to restore all
								connections.
							</Alert>

							<FileImport
								onTokensParsed={handleTokensParsed}
								onFileParsed={handleFileParsed}
							/>
						</TabPanel>
					</Tabs>
				</>
			)}

			{view === "collection" && (
				<CollectionSelector
					tokens={tokens}
					onSelect={handleCollectionSelected}
					onCancel={handleCancel}
				/>
			)}

			{view === "review" && fileType === "variables" && (
				<TokenTable
					onCancel={handleBackToCollection}
					onImport={handleImport}
					onTokensUpdated={setTokens}
					tokens={tokens}
				/>
			)}

			{view === "review" && fileType === "styles" && (
				<div className={styles.reviewContent}>
					<h2 className={styles.reviewHeader}>Review Styles to Import</h2>

					<div className={styles.alertContainer}>
						<Alert variant="info" title="Style Import">
							Select which style groups you want to import. Variable bindings
							will be automatically restored if the referenced variables exist.
						</Alert>
					</div>

					{/* Import Mode */}
					<RadioGroup
						label="Action Type"
						description="Choose how to handle these styles"
						name="action-type-styles"
						value={importMode}
						onChange={(value: string) =>
							setImportMode(value as "import" | "override")
						}
						options={[
							{
								value: "import",
								label: "Import",
								description: "Create new styles, skip existing ones",
							},
							{
								value: "override",
								label: "Override",
								description: "Update existing styles with new values",
							},
						]}
					/>

					{/* Select All */}
					<div className={styles.selectAllSection}>
						<CheckboxWithLabel
							id="select-all-style-groups"
							label="Select All Style Groups"
							checked={
								selectedStyleGroups.length ===
								Object.values(stylesByCategory).reduce(
									(sum, groups) => sum + groups.length,
									0,
								)
							}
							onChange={handleToggleAllStyleGroups}
						/>
					</div>

					{/* Style Groups by Category */}
					<div className={styles.styleCategoriesContainer}>
						{stylesByCategory.paint.length > 0 && (
							<div className={exportStyles.categorySection}>
								<div className={exportStyles.categoryHeader}>
									<Palette size={16} />
									<h3>Color</h3>
									<span className={exportStyles.categoryCount}>
										({stylesByCategory.paint.length})
									</span>
								</div>
								<div className={exportStyles.categoryGroups}>
									{stylesByCategory.paint.map((group) => {
										const isSelected = isStyleGroupSelected(
											"paint",
											group.name,
										);
										return (
											<div
												key={`paint-${group.name}`}
												className={exportStyles.styleGroupItem}
												data-selected={isSelected}
												onClick={() =>
													handleToggleStyleGroup("paint", group.name)
												}
											>
												<CheckboxWithLabel
													id={`import-paint-${group.name}`}
													label={group.name}
													checked={isSelected}
													onChange={() =>
														handleToggleStyleGroup("paint", group.name)
													}
												/>
												<span className={exportStyles.styleGroupCount}>
													{group.count} style{group.count !== 1 ? "s" : ""}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{stylesByCategory.text.length > 0 && (
							<div className={exportStyles.categorySection}>
								<div className={exportStyles.categoryHeader}>
									<Type size={16} />
									<h3>Text</h3>
									<span className={exportStyles.categoryCount}>
										({stylesByCategory.text.length})
									</span>
								</div>
								<div className={exportStyles.categoryGroups}>
									{stylesByCategory.text.map((group) => {
										const isSelected = isStyleGroupSelected("text", group.name);
										return (
											<div
												key={`text-${group.name}`}
												className={exportStyles.styleGroupItem}
												data-selected={isSelected}
												onClick={() =>
													handleToggleStyleGroup("text", group.name)
												}
											>
												<CheckboxWithLabel
													id={`import-text-${group.name}`}
													label={group.name}
													checked={isSelected}
													onChange={() =>
														handleToggleStyleGroup("text", group.name)
													}
												/>
												<span className={exportStyles.styleGroupCount}>
													{group.count} style{group.count !== 1 ? "s" : ""}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{stylesByCategory.effect.length > 0 && (
							<div className={exportStyles.categorySection}>
								<div className={exportStyles.categoryHeader}>
									<Sparkles size={16} />
									<h3>Effect</h3>
									<span className={exportStyles.categoryCount}>
										({stylesByCategory.effect.length})
									</span>
								</div>
								<div className={exportStyles.categoryGroups}>
									{stylesByCategory.effect.map((group) => {
										const isSelected = isStyleGroupSelected(
											"effect",
											group.name,
										);
										return (
											<div
												key={`effect-${group.name}`}
												className={exportStyles.styleGroupItem}
												data-selected={isSelected}
												onClick={() =>
													handleToggleStyleGroup("effect", group.name)
												}
											>
												<CheckboxWithLabel
													id={`import-effect-${group.name}`}
													label={group.name}
													checked={isSelected}
													onChange={() =>
														handleToggleStyleGroup("effect", group.name)
													}
												/>
												<span className={exportStyles.styleGroupCount}>
													{group.count} style{group.count !== 1 ? "s" : ""}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{stylesByCategory.grid.length > 0 && (
							<div className={exportStyles.categorySection}>
								<div className={exportStyles.categoryHeader}>
									<Grid size={16} />
									<h3>Layout grid</h3>
									<span className={exportStyles.categoryCount}>
										({stylesByCategory.grid.length})
									</span>
								</div>
								<div className={exportStyles.categoryGroups}>
									{stylesByCategory.grid.map((group) => {
										const isSelected = isStyleGroupSelected("grid", group.name);
										return (
											<div
												key={`grid-${group.name}`}
												className={exportStyles.styleGroupItem}
												data-selected={isSelected}
												onClick={() =>
													handleToggleStyleGroup("grid", group.name)
												}
											>
												<CheckboxWithLabel
													id={`import-grid-${group.name}`}
													label={group.name}
													checked={isSelected}
													onChange={() =>
														handleToggleStyleGroup("grid", group.name)
													}
												/>
												<span className={exportStyles.styleGroupCount}>
													{group.count} style{group.count !== 1 ? "s" : ""}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className={styles.actions}>
						<Button variant="secondary" onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleStyleImport}
							disabled={selectedStyleGroups.length === 0}
						>
							Import Styles ({selectedStyleGroups.length})
						</Button>
					</div>
				</div>
			)}

			{view === "progress" && <ProgressView />}

			{view === "success" && (
				<SuccessView
					errors={result.errors}
					failed={result.failed}
					onClose={handleClose}
					onImportMore={handleImportMore}
					success={result.success}
					importMode={importMode}
					changes={result.changes}
				/>
			)}
		</div>
	);
}
