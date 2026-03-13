import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { FileImportHandle } from "../components/import";
import {
	CollectionSelector,
	FileImport,
	ProgressView,
	SuccessView,
	TokenTable,
} from "../components/import";
import { PageBody, PageFooter, PageLayout } from "../components/layout";
import {
	Button,
	Frame,
	FramePanel,
	SectionHeader,
	useToast,
} from "../components/ui";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import type {
	DesignToken,
	ImportUndoEntry,
	ParsedTokens,
} from "../types/tokens";

/** A conflict detected when importing a token that already exists */
export interface ImportConflict {
	existingId: string;
	existingValues: Record<string, string>;
	tokenId: string;
}

type ImportViewState =
	| "upload"
	| "collection"
	| "review"
	| "progress"
	| "success";

export function ImportPage() {
	const fileImportRef = useRef<FileImportHandle>(null);
	const [view, setView] = useState<ImportViewState>("upload");
	const [tokens, setTokens] = useState<DesignToken[]>([]);
	const [isCipherExport, setIsCipherExport] = useState(false);
	const [collectionName, setCollectionName] = useState("Design Tokens");
	const [importMode, setImportModeState] = useState<"import" | "override">("import");
	const importModeRef = useRef(importMode);
	const setImportMode = (mode: "import" | "override") => {
		importModeRef.current = mode;
		setImportModeState(mode);
	};
	const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
	const [stylesData, setStylesData] = useState<any>(undefined);
	const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
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
		undoData: undefined as ImportUndoEntry[] | undefined,
	});

	const postMessage = usePostMessage();
	const { showError, showWarning, showSuccess } = useToast();

	useFigmaMessage((msg) => {
		if (msg.type === "tokens-parsed") {
			const parsedData: ParsedTokens = msg.data;

			if (parsedData.errors.length > 0) {
				showWarning(
					`Parsing errors: ${parsedData.errors.map((e) => e.message).join(", ")}`,
				);
			}

			if (parsedData.tokens.length > 0) {
				setTokens(parsedData.tokens);
				if (parsedData.isCipherExport) {
					setIsCipherExport(true);
					setImportMode("override");
				}
				if (parsedData.styles) {
					setStylesData(parsedData.styles);
				}
				setView("collection");
			} else {
				showError("No tokens found in the file");
			}
		}

		if (msg.type === "variables-created" || msg.type === "import-complete") {
			setResult({ ...msg.data, undoData: msg.data.undoData });
			setView("success");
		}

		if (msg.type === "import-undone") {
			const { success, failed } = msg.data;
			if (failed > 0) {
				showWarning(
					`Undo partially failed: ${success} reverted, ${failed} failed`,
				);
			} else {
				showSuccess(
					`Undo complete: ${success} variable${success !== 1 ? "s" : ""} reverted`,
				);
			}
			setResult((prev) => ({ ...prev, undoData: undefined }));
		}

		if (msg.type === "import-conflicts-result") {
			const { conflicts: conflictData, nameMap } = msg.data;
			setConflicts(conflictData);

			// Apply name corrections from the Figma-side reverse map.
			// CSS export converts "/" → "-" (lossy), so the parser's toFigmaName()
			// guesses wrong for names with literal hyphens (e.g., "brand-primary").
			// The nameMap provides the authoritative CSS-name → Figma-name mapping.
			if (nameMap && Object.keys(nameMap).length > 0) {
				setTokens((prev) =>
					prev.map((t) => {
						const correctedName = nameMap[t.name];
						const nameChanged = correctedName && correctedName !== t.figmaName;

						// Fix reference values: {color.brand.primary.500} → {color/brand-primary/500}
						// This must run for ALL reference tokens, not just those whose own name changed
						let correctedValue = t.value;
						if (t.type === "reference" && typeof t.value === "string") {
							const refMatch = t.value.match(/\{([^}]+)\}/);
							if (refMatch) {
								const refCssName = refMatch[1].replace(/\./g, "-");
								const refFigmaName = nameMap[refCssName];
								if (refFigmaName) {
									correctedValue = `{${refFigmaName}}`;
								}
							}
						}

						const valueChanged = correctedValue !== t.value;
						if (!(nameChanged || valueChanged)) return t;

						return {
							...t,
							...(nameChanged ? { figmaName: correctedName } : {}),
							...(valueChanged ? { value: correctedValue } : {}),
						};
					}),
				);
			}

			// In "import" mode, default conflicting tokens to skip (user can opt-in to overwrite)
			// In "override" mode, keep all tokens as "import" — the whole point is to update existing values
			if (conflictData.length > 0 && importModeRef.current !== "override") {
				const conflictIds = new Set(
					conflictData.map((c: ImportConflict) => c.tokenId),
				);
				setTokens((prev) =>
					prev.map((t) =>
						conflictIds.has(t.id) ? { ...t, action: "skip" as const } : t,
					),
				);
			}

			setView("review");
		}

		if (msg.type === "error") {
			showError(msg.data.message);
			setView("upload");
		}
	});

	const handleTokensParsed = (parsed: ParsedTokens) => {
		setTokens(parsed.tokens);
		if (parsed.isCipherExport) {
			setIsCipherExport(true);
			setImportMode("override");
		}
		if (parsed.styles) {
			setStylesData(parsed.styles);
		}
		setView("collection");
	};

	const handleCollectionSelected = (
		_mode: "new" | "existing",
		name: string,
		impMode?: "import" | "override",
		collections?: string[],
	) => {
		setCollectionName(name);
		if (impMode) {
			setImportMode(impMode);
		}
		const cols = collections && collections.length > 0 ? collections : [];
		if (cols.length > 0) {
			setSelectedCollections(cols);
		}

		postMessage({
			type: "check-import-conflicts",
			data: {
				tokens,
				collectionName: name,
				selectedCollections: cols.length > 0 ? cols : undefined,
			},
		});
	};

	const handleImport = () => {
		let tokensToImport = tokens.filter((t) => t.action === "import");

		if (selectedCollections.length > 0) {
			tokensToImport = tokensToImport.filter((t) =>
				selectedCollections.includes(t.category),
			);
		}

		setView("progress");

		postMessage({
			type: "create-variables",
			data: {
				tokens: tokensToImport,
				collectionName,
				importMode,
				selectedCollections,
				stylesData,
			},
		});
	};

	const resetState = () => {
		setView("upload");
		setTokens([]);
		setIsCipherExport(false);
		setCollectionName("Design Tokens");
		setImportMode("import");
		setSelectedCollections([]);
		setConflicts([]);
		setStylesData(undefined);
		setResult({
			success: 0,
			failed: 0,
			errors: [],
			changes: [],
			undoData: undefined,
		});
	};

	const handleCancel = () => resetState();

	const handleBackToCollection = () => {
		setView("collection");
	};

	const handleClose = () => {
		postMessage({ type: "close" });
	};

	const handleUndoImport = () => {
		if (result.undoData && result.undoData.length > 0) {
			postMessage({
				type: "undo-import",
				data: { entries: result.undoData },
			});
		}
	};

	const handleImportMore = () => resetState();

	// ---- Collection ----
	if (view === "collection") {
		return (
			<CollectionSelector
				isCipherExport={isCipherExport}
				onCancel={handleCancel}
				onSelect={handleCollectionSelected}
				tokens={tokens}
			/>
		);
	}

	// ---- Review ----
	if (view === "review") {
		return (
			<TokenTable
				conflicts={conflicts}
				importMode={importMode}
				onCancel={handleBackToCollection}
				onImport={handleImport}
				onTokensUpdated={setTokens}
				tokens={tokens}
			/>
		);
	}

	// ---- Progress ----
	if (view === "progress") {
		return (
			<PageLayout>
				<ProgressView />
			</PageLayout>
		);
	}

	// ---- Success ----
	if (view === "success") {
		return (
			<PageLayout>
				<SuccessView
					changes={result.changes}
					errors={result.errors}
					failed={result.failed}
					importMode={importMode}
					onClose={handleClose}
					onImportMore={handleImportMore}
					onUndo={handleUndoImport}
					success={result.success}
					undoData={result.undoData}
				/>
			</PageLayout>
		);
	}

	// ---- Upload (default) ----
	return (
		<PageLayout>
			<PageBody>
				<SectionHeader
					description="Import design tokens from JSON or CSS into Figma variables"
					title="Import"
					variant="primary"
				/>

				<Frame>
					<FramePanel>
						<FileImport onTokensParsed={handleTokensParsed} ref={fileImportRef} />
					</FramePanel>
				</Frame>
			</PageBody>

			<PageFooter>
				<Button
					onClick={() => fileImportRef.current?.openFilePicker()}
					variant="primary"
				>
					<Upload size={14} />
					Upload File
				</Button>
			</PageFooter>
		</PageLayout>
	);
}
