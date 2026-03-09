import { ArrowRight, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useFigmaMessage, usePostMessage } from "../../hooks/useFigmaMessage";
import type { DesignToken } from "../../types/tokens";
import {
	Button,
	CheckboxCard,
	EmptyState,
	Input,
	LoadingState,
	RadioGroup,
	SectionHeader,
	useToast,
} from "../ui";
import styles from "./CollectionSelector.module.css";

interface Collection {
	id: string;
	name: string;
	variableCount: number;
}

interface CollectionSelectorProps {
	tokens: DesignToken[];
	onSelect: (
		mode: "new" | "existing",
		collectionName: string,
		importMode?: "import" | "override",
		selectedCollections?: string[],
	) => void;
	onCancel: () => void;
}

export function CollectionSelector({
	tokens,
	onSelect,
	onCancel,
}: CollectionSelectorProps) {
	const { showWarning } = useToast();
	const [mode, setMode] = useState<"new" | "existing">("new");
	const [importMode, setImportMode] = useState<"import" | "override">("import");
	const [collections, setCollections] = useState<Collection[]>([]);
	const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
	const [newCollectionName, setNewCollectionName] = useState("Design Tokens");
	const [loading, setLoading] = useState(true);

	// Detect unique collections from tokens
	const detectedCollections = Array.from(
		new Set(tokens.map((t) => t.category)),
	);
	const isMultiCollection = detectedCollections.length > 1;

	// Track selected collections for multi-collection imports
	const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
		new Set(detectedCollections), // All selected by default
	);

	const postMessage = usePostMessage();

	useEffect(() => {
		postMessage({ type: "get-collections" });
	}, [postMessage]);

	useFigmaMessage((msg) => {
		if (msg.type === "collections-list") {
			const cols = msg.data.collections;
			setCollections(cols);

			// Smart default: check if any detected collections already exist
			const existingNames = cols.map((c: Collection) => c.name.toLowerCase());
			const hasExisting = detectedCollections.some((dc) =>
				existingNames.includes(dc.toLowerCase()),
			);
			setImportMode(hasExisting ? "override" : "import");

			if (cols.length > 0) {
				setSelectedCollectionId(cols[0].id);
			}
			setLoading(false);
		}
	});

	const handleContinue = () => {
		// For multi-collection imports, check that at least one collection is selected
		if (isMultiCollection && selectedCollections.size === 0) {
			showWarning("Please select at least one collection to import");
			return;
		}

		if (mode === "new") {
			if (!newCollectionName.trim()) {
				showWarning("Please enter a collection name");
				return;
			}
			// Pass selected collections array for multi-collection imports
			onSelect(
				"new",
				newCollectionName,
				importMode,
				Array.from(selectedCollections),
			);
		} else {
			const selected = collections.find((c) => c.id === selectedCollectionId);
			if (!selected) {
				showWarning("Please select a collection");
				return;
			}
			onSelect(
				"existing",
				selected.name,
				importMode,
				Array.from(selectedCollections),
			);
		}
	};

	const toggleCollection = (collectionName: string) => {
		setSelectedCollections((prev) => {
			const next = new Set(prev);
			if (next.has(collectionName)) {
				next.delete(collectionName);
			} else {
				next.add(collectionName);
			}
			return next;
		});
	};

	const toggleAllCollections = () => {
		if (selectedCollections.size === detectedCollections.length) {
			// Deselect all
			setSelectedCollections(new Set());
		} else {
			// Select all
			setSelectedCollections(new Set(detectedCollections));
		}
	};

	const selectedCollection = collections.find(
		(c) => c.id === selectedCollectionId,
	);

	// Calculate token counts per collection
	const collectionStats = detectedCollections.map((collectionName) => ({
		name: collectionName,
		count: tokens.filter((t) => t.category === collectionName).length,
	}));

	return (
		<div className={styles.collectionSelector}>
			<SectionHeader
				variant="secondary"
				title={
					isMultiCollection
						? "Multiple Collections Detected"
						: "Choose Collection"
				}
				description={
					isMultiCollection
						? "This file contains multiple collections that will be created in Figma"
						: "Select where to import your design tokens"
				}
			/>

			{loading ? (
				<LoadingState message="Loading collections…" />
			) : isMultiCollection ? (
				<>
					<div className={styles.collectionForm}>
						<RadioGroup
							label="Action"
							name="actionType"
							value={importMode}
							onChange={(value: string) =>
								setImportMode(value as "import" | "override")
							}
							options={[
								{
									value: "import",
									label: "Import (Create & Update)",
									description:
										"Create new and update existing. Errors on missing references.",
								},
								{
									value: "override",
									label: "Override (Update Only)",
									description:
										"Only update existing. Skips missing tokens and references.",
								},
							]}
						/>
					</div>

					<div className={styles.multiCollectionPreview}>
						<div className={styles.previewHeader}>
							<p className={styles.previewIntro}>
								Collections
							</p>
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleAllCollections}
							>
								{selectedCollections.size === detectedCollections.length
									? "Deselect All"
									: "Select All"}
							</Button>
						</div>
						<div className={styles.collectionPreviewList}>
							{collectionStats.map(({ name, count }) => (
								<CheckboxCard
									key={name}
									id={`collection-${name}`}
									label={name}
									description={`${count} variable${count !== 1 ? "s" : ""}`}
									checked={selectedCollections.has(name)}
									onChange={() => toggleCollection(name)}
								/>
							))}
						</div>
					</div>

					<div className={styles.collectionActions}>
						<Button variant="ghost" onClick={onCancel}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleContinue}
							disabled={selectedCollections.size === 0}
						>
							<ArrowRight size={14} />
							Continue ({selectedCollections.size} of {detectedCollections.length})
						</Button>
					</div>
				</>
			) : (
				<>
					<div className={styles.collectionForm}>
						<RadioGroup
							label="Action"
							name="actionType"
							value={importMode}
							onChange={(value: string) =>
								setImportMode(value as "import" | "override")
							}
							options={[
								{
									value: "import",
									label: "Import (Create & Update)",
									description:
										"Create new and update existing. Errors on missing references.",
								},
								{
									value: "override",
									label: "Override (Update Only)",
									description:
										"Only update existing. Skips missing tokens and references.",
								},
							]}
						/>

						<RadioGroup
							label="Import Mode"
							description="Create a new collection or append to an existing one"
							name="importMode"
							value={mode}
							onChange={(value: string) => setMode(value as "new" | "existing")}
							options={[
								{
									value: "new",
									label: "Create New Collection",
									description: "Start fresh with a new variable collection",
								},
								{
									value: "existing",
									label: "Append to Existing Collection",
									description:
										collections.length > 0
											? `Add to one of ${collections.length} existing collection${collections.length !== 1 ? "s" : ""}`
											: "No existing collections found",
								},
							]}
						/>
					</div>

					{mode === "new" ? (
						<div className={styles.collectionForm}>
							<Input
								label="Collection Name"
								description="Name for the new variable collection"
								value={newCollectionName}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setNewCollectionName(e.target.value)
								}
								placeholder="Design Tokens"
							/>
						</div>
					) : (
						<div className={styles.collectionForm}>
							{collections.length === 0 ? (
								<EmptyState
									icon={<FolderOpen size={48} strokeWidth={1.5} />}
									title="No collections found"
									description="Create a new collection to get started"
								/>
							) : (
								<>
									<RadioGroup
										label="Select Collection"
										description="Variables will be added to the selected collection"
										name="collection"
										value={selectedCollectionId}
										onChange={setSelectedCollectionId}
										options={collections.map((collection) => ({
											value: collection.id,
											label: collection.name,
											description: `${collection.variableCount} variable${collection.variableCount !== 1 ? "s" : ""}`,
											icon: <FolderOpen size={16} />,
										}))}
									/>
									{selectedCollection && (
										<div className={styles.collectionPreview}>
											<strong>Selected:</strong> {selectedCollection.name} (
											{selectedCollection.variableCount} existing variables)
										</div>
									)}
								</>
							)}
						</div>
					)}

					<div className={styles.collectionActions}>
						<Button variant="ghost" onClick={onCancel}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleContinue}
							disabled={mode === "existing" && collections.length === 0}
						>
							<ArrowRight size={14} />
							Continue to Review
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
