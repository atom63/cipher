import { useState } from "react";
import {
	CollectionSelector,
	FileImport,
	ProgressView,
	SuccessView,
	TokenTable,
} from "../components/import";
import { SectionHeader, useToast } from "../components/ui";
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
	const [view, setView] = useState<ImportViewState>("upload");
	const [tokens, setTokens] = useState<DesignToken[]>([]);
	const [collectionName, setCollectionName] = useState("Design Tokens");
	const [importMode, setImportMode] = useState<"import" | "override">("import");
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
				// Capture styles section from combined export for round-trip import
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
			const { conflicts: conflictData } = msg.data;
			setConflicts(conflictData);

			if (conflictData.length > 0) {
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

	return (
		<div className="page-content">
			{view === "upload" && (
				<>
					<SectionHeader
						description="Import design tokens from JSON or CSS into Figma variables"
						title="Import"
						variant="primary"
					/>

					<FileImport onTokensParsed={handleTokensParsed} />
				</>
			)}

			{view === "collection" && (
				<CollectionSelector
					onCancel={handleCancel}
					onSelect={handleCollectionSelected}
					tokens={tokens}
				/>
			)}

			{view === "review" && (
				<TokenTable
					conflicts={conflicts}
					onCancel={handleBackToCollection}
					onImport={handleImport}
					onTokensUpdated={setTokens}
					tokens={tokens}
				/>
			)}

			{view === "progress" && <ProgressView />}

			{view === "success" && (
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
			)}
		</div>
	);
}
