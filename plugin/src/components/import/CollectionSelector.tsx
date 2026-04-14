import { ArrowRight, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useFigmaMessage, usePostMessage } from "../../hooks/useFigmaMessage";
import type { DesignToken } from "../../types/tokens";
import { PageBody, PageFooter, PageLayout } from "../layout";
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
	/** Whether this is a Cipher CSS export (enables streamlined update flow) */
	isCipherExport?: boolean;
	onCancel: () => void;
	onSelect: (
		mode: "new" | "existing",
		collectionName: string,
		importMode?: "import" | "override",
		selectedCollections?: string[],
	) => void;
	tokens: DesignToken[];
}

export function CollectionSelector({
	tokens,
	isCipherExport = false,
	onSelect,
	onCancel,
}: CollectionSelectorProps) {
	const { showWarning } = useToast();
	const [mode, setMode] = useState<"new" | "existing">(isCipherExport ? "existing" : "new");
	const [importMode, setImportMode] = useState<"import" | "override">(isCipherExport ? "override" : "import");
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

		// Multi-collection imports don't use a single target collection — proceed directly
		if (isMultiCollection) {
			onSelect("new", newCollectionName, importMode, Array.from(selectedCollections));
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

	// Determine footer content based on state
	const footerContent = loading ? null : isMultiCollection ? (
		<PageFooter>
			<Button onClick={onCancel} variant="ghost">
				Cancel
			</Button>
			<Button
				disabled={selectedCollections.size === 0}
				onClick={handleContinue}
				variant="primary"
			>
				<ArrowRight size={14} />
				Continue ({selectedCollections.size} of{" "}
				{detectedCollections.length})
			</Button>
		</PageFooter>
	) : (
		<PageFooter>
			<Button onClick={onCancel} variant="ghost">
				Cancel
			</Button>
			<Button
				disabled={mode === "existing" && collections.length === 0}
				onClick={handleContinue}
				variant="primary"
			>
				<ArrowRight size={14} />
				Continue to Review
			</Button>
		</PageFooter>
	);

	return (
		<PageLayout className={styles.collectionSelector}>
			<PageBody>
				<SectionHeader
					description={
						isCipherExport
							? "Update your Figma variables with edited CSS values"
							: isMultiCollection
								? "This file contains multiple collections that will be created in Figma"
								: "Select where to import your design tokens"
					}
					title={
						isCipherExport
							? "Update Variables"
							: isMultiCollection
								? "Multiple Collections Detected"
								: "Choose Collection"
					}
					variant="secondary"
				/>

				{loading ? (
					<LoadingState message="Loading collections…" />
				) : isMultiCollection ? (
					<>
						<div className={styles.collectionForm}>
							<RadioGroup
								label="Action"
								name="actionType"
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
								value={importMode}
							/>
						</div>

						<div className={styles.multiCollectionPreview}>
							<div className={styles.previewHeader}>
								<p className={styles.previewIntro}>Collections</p>
								<Button onClick={toggleAllCollections} size="sm" variant="ghost">
									{selectedCollections.size === detectedCollections.length
										? "Deselect All"
										: "Select All"}
								</Button>
							</div>
							<div className={styles.collectionPreviewList}>
								{collectionStats.map(({ name, count }) => (
									<CheckboxCard
										checked={selectedCollections.has(name)}
										description={`${count} variable${count !== 1 ? "s" : ""}`}
										id={`collection-${name}`}
										key={name}
										label={name}
										onChange={() => toggleCollection(name)}
									/>
								))}
							</div>
						</div>
					</>
				) : (
					<>
						<div className={styles.collectionForm}>
							<RadioGroup
								label="Action"
								name="actionType"
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
								value={importMode}
							/>

							<RadioGroup
								description="Create a new collection or append to an existing one"
								label="Import Mode"
								name="importMode"
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
								value={mode}
							/>
						</div>

						{mode === "new" ? (
							<div className={styles.collectionForm}>
								<Input
									description="Name for the new variable collection"
									label="Collection Name"
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setNewCollectionName(e.target.value)
									}
									placeholder="Design Tokens"
									value={newCollectionName}
								/>
							</div>
						) : (
							<div className={styles.collectionForm}>
								{collections.length === 0 ? (
									<EmptyState
										description="Create a new collection to get started"
										icon={<FolderOpen size={48} strokeWidth={1.5} />}
										title="No collections found"
									/>
								) : (
									<>
										<RadioGroup
											description="Variables will be added to the selected collection"
											label="Select Collection"
											name="collection"
											onChange={setSelectedCollectionId}
											options={collections.map((collection) => ({
												value: collection.id,
												label: collection.name,
												description: `${collection.variableCount} variable${collection.variableCount !== 1 ? "s" : ""}`,
												icon: <FolderOpen size={16} />,
											}))}
											value={selectedCollectionId}
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
					</>
				)}
			</PageBody>

			{footerContent}
		</PageLayout>
	);
}
