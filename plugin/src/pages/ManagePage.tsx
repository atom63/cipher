import {
	ArrowRight,
	ArrowUpDown,
	Check,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Copy,
	FolderInput,
	Link,
	Palette,
	Pencil,
	PenLine,
	RefreshCw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Badge,
	Button,
	Checkbox,
	ColorSwatch,
	ConfirmDialog,
	Dialog,
	DialogActions,
	EmptyState,
	Frame,
	FrameFooter,
	FramePanel,
	Input,
	LoadingState,
	RenameDialog,
	ScrollArea,
	Separator,
	Tabs,
	useToast,
} from "../components/ui";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import { useListKeyboard } from "../hooks/useListKeyboard";
import { useRename } from "../hooks/useRename";
import { useSelection } from "../hooks/useSelection";
import type {
	CollectionInfo,
	DeletedVariableSnapshot,
	VariableInfo,
} from "../types/messages";

// Value rendering helpers (shared between row component and edit panel)
const isColorValue = (val: string) =>
	val.startsWith("#") ||
	val.startsWith("rgb") ||
	val.startsWith("hsl") ||
	val.startsWith("oklch");

const isReference = (val: string) => val.startsWith("{");

// Memoized variable row to avoid re-renders when sibling rows change
const VariableRow = React.memo(function VariableRow({
	variable,
	isSelected,
	onToggleSelect,
	onContextSelect,
}: {
	variable: VariableInfo;
	isSelected: boolean;
	onToggleSelect: (id: string, event: React.MouseEvent) => void;
	onContextSelect: (id: string) => void;
}) {
	const renderNameSwatches = () => {
		if (variable.resolvedType !== "COLOR") return null;
		const entries = Object.entries(variable.valuesByMode);
		const colorEntries = entries.filter(([, val]) => isColorValue(val));
		if (colorEntries.length === 0) return null;

		return (
			<span className="manage-name-swatches">
				{colorEntries.map(([mode, val]) => (
					<ColorSwatch
						color={val}
						key={mode}
						size="sm"
						title={`${mode}: ${val}`}
					/>
				))}
			</span>
		);
	};

	const renderValue = () => {
		const entries = Object.entries(variable.valuesByMode);
		const isColor = variable.resolvedType === "COLOR";

		if (entries.length === 1) {
			const [, val] = entries[0];
			if (isReference(val)) {
				return (
					<Badge icon={<Link size={10} />}size="sm" variant="outline" >
						{val.slice(1, -1)}
					</Badge>
				);
			}
			if (isColor && isColorValue(val)) {
				return (
					<Badge dot dotColor={val}size="sm" variant="outline" >
						{val}
					</Badge>
				);
			}
			return <span className="manage-value">{val}</span>;
		}

		return (
			<div className="manage-value-modes">
				{entries.map(([mode, val]) => (
					<div
						className="manage-mode-chip"
						key={mode}
						title={`${mode}: ${val}`}
					>
						<Badge size="sm"variant="secondary" >
							{mode}
						</Badge>
						{isReference(val) ? (
							<Badge icon={<Link size={10} />}size="sm" variant="outline" >
								{val.slice(1, -1)}
							</Badge>
						) : isColor && isColorValue(val) ? (
							<Badge dot dotColor={val}size="sm" variant="outline" >
								{val}
							</Badge>
						) : (
							<span className="manage-mode-val">{val}</span>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<div
			aria-selected={isSelected}
			className={`manage-row ${isSelected ? "manage-row-selected" : ""}`}
			onClick={(e) => onToggleSelect(variable.id, e)}
			onContextMenu={(e) => {
				e.preventDefault();
				onContextSelect(variable.id);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onToggleSelect(variable.id, e as unknown as React.MouseEvent);
				}
			}}
			role="row"
			tabIndex={0}
		>
			<div className="manage-col-check">
				<Checkbox
					checked={isSelected}
					id={`var-${variable.id}`}
					onChange={() => {}}
					size="sm"
				/>
			</div>
			<div className="manage-col-name">
				{renderNameSwatches()}
				<span className="manage-var-name" title={variable.name}>
					{variable.name.includes("/") ? (
						<>
							<span className="manage-var-path">
								{variable.name.substring(0, variable.name.lastIndexOf("/") + 1)}
							</span>
							{variable.name.substring(variable.name.lastIndexOf("/") + 1)}
						</>
					) : (
						variable.name
					)}
				</span>
			</div>
			<div className="manage-col-value">{renderValue()}</div>
		</div>
	);
});

type SortField = "name" | "collection" | "value";
type SortDir = "asc" | "desc";
type ActionPanel = "rename" | "move" | "edit" | "scale" | null;

/** Per-variable, per-mode edit values. Key = variableId, value = { modeName: editedValue } */
type EditValuesMap = Record<string, Record<string, string>>;

export function ManagePage({
	onNavigate,
}: {
	onNavigate?: (page: string) => void;
}) {
	const [variables, setVariables] = useState<VariableInfo[]>([]);
	const [collections, setCollections] = useState<CollectionInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filterCollection, setFilterCollection] = useState<string>("all");
	const [filterType, setFilterType] = useState<string>("all");
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDir, setSortDir] = useState<SortDir>("asc");
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);
	const isInitialLoad = useRef(true);
	const debouncedSearch = useDebouncedValue(search, 150);
	const listRef = useRef<HTMLDivElement>(null);

	// Action panels
	const [activePanel, setActivePanel] = useState<ActionPanel>(null);

	// Move state
	const [moveTargetId, setMoveTargetId] = useState<string>("");

	// Scale state
	const [scaleFactor, setScaleFactor] = useState<string>("2");
	const [scaleOperation, setScaleOperation] = useState<"multiply" | "divide">(
		"multiply",
	);

	// Edit values state: { [variableId]: { [modeName]: value } }
	const [editValues, setEditValues] = useState<EditValuesMap>({});
	// Track which field is in alias-pick mode: "varId:modeName"
	const [aliasPickField, setAliasPickField] = useState<string | null>(null);
	const [aliasSearch, setAliasSearch] = useState("");
	// Active mode tab per collection in edit dialog
	const [editActiveModes, setEditActiveModes] = useState<
		Record<string, string>
	>({});

	// Delete confirmation
	const [pendingDelete, setPendingDelete] = useState(false);
	const [dependencyWarning, setDependencyWarning] = useState<{
		deps: Record<
			string,
			{
				name: string;
				referencedBy: { id: string; name: string; collectionName: string }[];
			}
		>;
	} | null>(null);

	// Prevents double-submit on async operations
	const [operationPending, setOperationPending] = useState(false);

	const postMessage = usePostMessage();
	const { showSuccess, showError } = useToast();

	const loadVariables = useCallback(() => {
		setLoading(true);
		postMessage({ type: "get-variables" });
	}, [postMessage]);

	useEffect(() => {
		loadVariables();
	}, [loadVariables]);

	useFigmaMessage((msg) => {
		if (msg.type === "variables-list") {
			const vars: VariableInfo[] = msg.data.variables;
			setVariables(vars);
			setCollections(msg.data.collections);
			setLoading(false);
			setOperationPending(false);

			// Mark initial load complete
			isInitialLoad.current = false;
		} else if (msg.type === "variables-renamed") {
			const { success, failed, previousNames } = msg.data;
			if (failed > 0) {
				showError(`${failed} ${failed === 1 ? "rename" : "renames"} failed`);
			} else {
				showSuccess(
					`Renamed ${success} variable${success !== 1 ? "s" : ""}`,
					previousNames.length > 0
						? {
								label: "Undo",
								onClick: () => {
									postMessage({
										type: "rename-variables",
										data: {
											renames: previousNames.map((p) => ({
												id: p.id,
												newName: p.oldName,
											})),
										},
									});
								},
							}
						: undefined,
				);
			}
			setActivePanel(null);
			rename.reset();
			loadVariables();
		} else if (msg.type === "variables-deleted") {
			const { success, failed, snapshots } = msg.data as {
				success: number;
				failed: number;
				snapshots: DeletedVariableSnapshot[];
			};
			if (failed > 0) {
				showError(
					`${failed} ${failed === 1 ? "deletion" : "deletions"} failed`,
				);
			} else {
				showSuccess(
					`Deleted ${success} variable${success !== 1 ? "s" : ""}`,
					snapshots.length > 0
						? {
								label: "Undo",
								onClick: () => {
									postMessage({
										type: "restore-variables",
										data: { snapshots },
									});
								},
							}
						: undefined,
				);
			}
			setSelectedIds(new Set());
			loadVariables();
		} else if (msg.type === "variables-restored") {
			if (msg.data.failed > 0) {
				showError(
					`${msg.data.failed} ${msg.data.failed === 1 ? "restore" : "restores"} failed`,
				);
			} else {
				showSuccess(
					`Restored ${msg.data.success} variable${msg.data.success !== 1 ? "s" : ""}`,
				);
			}
			loadVariables();
		} else if (msg.type === "variables-moved") {
			const { success, failed, previousCollections } = msg.data;
			if (failed > 0) {
				showError(`${failed} ${failed === 1 ? "move" : "moves"} failed`);
			} else {
				showSuccess(
					`Moved ${success} variable${success !== 1 ? "s" : ""}`,
					previousCollections.length > 0
						? {
								label: "Undo",
								onClick: () => {
									// Group by original collection and move each group back
									const grouped = new Map<string, string[]>();
									for (const p of previousCollections) {
										const ids = grouped.get(p.collectionId) || [];
										ids.push(p.newId);
										grouped.set(p.collectionId, ids);
									}
									for (const [collectionId, varIds] of grouped) {
										postMessage({
											type: "move-variables",
											data: {
												variableIds: varIds,
												targetCollectionId: collectionId,
											},
										});
									}
								},
							}
						: undefined,
				);
			}
			setActivePanel(null);
			setSelectedIds(new Set());
			loadVariables();
		} else if (msg.type === "variable-values-updated") {
			const { success, failed, previousValues } = msg.data;
			if (failed > 0) {
				showError(`${failed} ${failed === 1 ? "update" : "updates"} failed`);
			} else {
				showSuccess(
					`Updated ${success} variable${success !== 1 ? "s" : ""}`,
					previousValues.length > 0
						? {
								label: "Undo",
								onClick: () => {
									postMessage({
										type: "update-variable-values",
										data: { updates: previousValues },
									});
								},
							}
						: undefined,
				);
			}
			setActivePanel(null);
			setEditValues({});
			setAliasPickField(null);
			setAliasSearch("");
			loadVariables();
		} else if (msg.type === "variables-duplicated") {
			const { success, failed, newVariableIds } = msg.data;
			if (failed > 0) {
				showError(
					`${failed} ${failed === 1 ? "duplication" : "duplications"} failed`,
				);
			} else {
				showSuccess(
					`Duplicated ${success} variable${success !== 1 ? "s" : ""}`,
					newVariableIds.length > 0
						? {
								label: "Undo",
								onClick: () => {
									postMessage({
										type: "delete-variables",
										data: { variableIds: newVariableIds },
									});
								},
							}
						: undefined,
				);
			}
			loadVariables();
		} else if (msg.type === "dependency-check-result") {
			const { dependencies } = msg.data as {
				dependencies: Record<
					string,
					{
						name: string;
						referencedBy: {
							id: string;
							name: string;
							collectionName: string;
						}[];
					}
				>;
			};
			const hasAnyDeps = Object.values(dependencies).some(
				(d) => d.referencedBy.length > 0,
			);
			if (hasAnyDeps) {
				setDependencyWarning({ deps: dependencies });
			} else {
				setPendingDelete(true);
			}
		} else if (msg.type === "variable-values-scaled") {
			const { success, failed, previousValues } = msg.data;
			if (failed > 0) {
				showError(`${failed} scale operation${failed === 1 ? "" : "s"} failed`);
			} else {
				showSuccess(
					`Scaled ${success} variable${success !== 1 ? "s" : ""}`,
					previousValues.length > 0
						? {
								label: "Undo",
								onClick: () => {
									postMessage({
										type: "update-variable-values",
										data: { updates: previousValues },
									});
								},
							}
						: undefined,
				);
			}
			setActivePanel(null);
			loadVariables();
		}
	});

	// Filter and sort
	const filtered = useMemo(() => {
		let result = [...variables];

		if (filterCollection !== "all") {
			result = result.filter((v) => v.collectionId === filterCollection);
		}
		if (filterType !== "all") {
			result = result.filter((v) => v.resolvedType === filterType);
		}
		if (debouncedSearch) {
			const lower = debouncedSearch.toLowerCase();
			result = result.filter(
				(v) =>
					v.name.toLowerCase().includes(lower) ||
					v.collectionName.toLowerCase().includes(lower) ||
					Object.values(v.valuesByMode).some((val) =>
						val.toLowerCase().includes(lower),
					),
			);
		}

		const naturalCompare = (a: string, b: string) =>
			a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

		const firstValue = (v: VariableInfo) => {
			const vals = Object.values(v.valuesByMode);
			return vals.length > 0 ? vals[0] : "";
		};

		result.sort((a, b) => {
			let cmp = 0;
			if (sortField === "name") cmp = naturalCompare(a.name, b.name);
			else if (sortField === "collection")
				cmp = naturalCompare(a.collectionName, b.collectionName);
			else if (sortField === "value")
				cmp = naturalCompare(firstValue(a), firstValue(b));
			return sortDir === "asc" ? cmp : -cmp;
		});

		return result;
	}, [
		variables,
		filterCollection,
		filterType,
		debouncedSearch,
		sortField,
		sortDir,
	]);

	// Group by collection → first path segment
	const grouped = useMemo(() => {
		const collections = new Map<string, Map<string, VariableInfo[]>>();
		for (const v of filtered) {
			if (!collections.has(v.collectionName))
				collections.set(v.collectionName, new Map());
			const subGroups = collections.get(v.collectionName);
			if (!subGroups) continue;
			const parts = v.name.split("/");
			const subKey = parts.length > 1 ? parts[0] : "Other";
			if (!subGroups.has(subKey)) subGroups.set(subKey, []);
			subGroups.get(subKey)?.push(v);
		}
		// Sort collections — logical design system order by default
		const COLLECTION_ORDER: Record<string, number> = {
			primitive: 0,
			primitives: 0,
			alias: 1,
			aliases: 1,
			semantic: 2,
			semantics: 2,
			responsive: 3,
		};
		const collectionPriority = (name: string) => {
			const lower = name.toLowerCase();
			for (const [key, order] of Object.entries(COLLECTION_ORDER)) {
				if (lower === key || lower.startsWith(`${key} `) || lower.endsWith(` ${key}`)) {
					return order;
				}
			}
			return 100;
		};
		const naturalCompare = (a: string, b: string) =>
			a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
		const sortedCollections = Array.from(collections.entries()).sort(
			([a], [b]) => {
				const pa = collectionPriority(a);
				const pb = collectionPriority(b);
				if (pa !== pb) {
					const cmp = pa - pb;
					return sortField === "collection" && sortDir === "desc" ? -cmp : cmp;
				}
				const cmp = naturalCompare(a, b);
				return sortField === "collection"
					? sortDir === "asc"
						? cmp
						: -cmp
					: cmp;
			},
		);
		// Sort sub-groups within each collection
		return new Map(
			sortedCollections.map(([name, subs]) => [
				name,
				new Map(
					Array.from(subs.entries()).sort(([a], [b]) => naturalCompare(a, b)),
				),
			]),
		);
	}, [filtered, sortField, sortDir]);

	const uniqueTypes = useMemo(() => {
		const types = new Set(variables.map((v) => v.resolvedType));
		return Array.from(types).sort();
	}, [variables]);

	// Selection
	const filteredIds = useMemo(() => filtered.map((v) => v.id), [filtered]);
	const {
		selectedIds,
		setSelectedIds,
		toggleSelect,
		selectAll,
		selectNone,
		contextSelect,
	} = useSelection({ allIds: filteredIds });

	const toggleGroup = useCallback((collectionName: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(collectionName)) next.delete(collectionName);
			else next.add(collectionName);
			return next;
		});
	}, []);

	// Rename
	const selectedItems = useMemo(
		() => variables.filter((v) => selectedIds.has(v.id)),
		[variables, selectedIds],
	);
	const rename = useRename({ items: selectedItems });

	// Keyboard shortcuts
	useListKeyboard({
		selectedIds,
		allIds: filteredIds,
		isPanelOpen: !!activePanel,
		setSelectedIds,
		onClosePanel: useCallback(() => setActivePanel(null), []),
		onDelete: useCallback(
			() =>
				postMessage({
					type: "check-dependencies",
					data: { variableIds: Array.from(selectedIds) },
				}),
			[postMessage, selectedIds],
		),
	});

	// Actions (guarded against double-submit)
	const handleRename = () => {
		if (rename.changes.length === 0 || operationPending) return;
		setOperationPending(true);
		postMessage({
			type: "rename-variables",
			data: {
				renames: rename.changes.map((r) => ({ id: r.id, newName: r.newName })),
			},
		});
	};

	const handleScale = () => {
		const factor = Number.parseFloat(scaleFactor);
		if (!factor || factor === 0 || operationPending) return;
		setOperationPending(true);
		postMessage({
			type: "scale-variable-values",
			data: {
				variableIds: Array.from(selectedIds),
				factor,
				operation: scaleOperation,
			},
		});
	};

	const handleDelete = () => {
		if (operationPending) return;
		setOperationPending(true);
		postMessage({
			type: "delete-variables",
			data: { variableIds: Array.from(selectedIds) },
		});
		setPendingDelete(false);
	};

	const handleMove = () => {
		if (!moveTargetId || operationPending) return;
		setOperationPending(true);
		postMessage({
			type: "move-variables",
			data: {
				variableIds: Array.from(selectedIds),
				targetCollectionId: moveTargetId,
			},
		});
	};

	const handleDuplicate = () => {
		if (operationPending) return;
		setOperationPending(true);
		postMessage({
			type: "duplicate-variables",
			data: { variableIds: Array.from(selectedIds) },
		});
	};

	// Selected variables for editing
	const editSelectedVars = useMemo(() => {
		if (activePanel !== "edit") return [];
		return variables.filter((v) => selectedIds.has(v.id));
	}, [activePanel, selectedIds, variables]);

	// Group selected variables by collection (each collection has its own modes)
	const editGroups = useMemo(() => {
		const map = new Map<
			string,
			{ collectionName: string; modes: string[]; vars: typeof editSelectedVars }
		>();
		for (const v of editSelectedVars) {
			let group = map.get(v.collectionId);
			if (!group) {
				group = {
					collectionName: v.collectionName,
					modes: Object.keys(v.valuesByMode),
					vars: [],
				};
				map.set(v.collectionId, group);
			}
			// Merge any modes we haven't seen yet
			for (const mode of Object.keys(v.valuesByMode)) {
				if (!group.modes.includes(mode)) {
					group.modes.push(mode);
				}
			}
			group.vars.push(v);
		}
		return Array.from(map.values());
	}, [editSelectedVars]);

	// Initialize edit values when edit panel opens — snapshot current values
	useEffect(() => {
		if (activePanel === "edit" && editSelectedVars.length > 0) {
			const initial: EditValuesMap = {};
			for (const v of editSelectedVars) {
				initial[v.id] = { ...v.valuesByMode };
			}
			setEditValues(initial);
			setAliasPickField(null);
			setAliasSearch("");
			setEditActiveModes({});
		}
	}, [activePanel, editSelectedVars]); // Only run when panel opens, not on every var change

	// Alias options for a specific variable (same type, not self)
	const getAliasOptions = useCallback(
		(varId: string, type: string) => {
			return variables
				.filter((v) => v.resolvedType === type && v.id !== varId)
				.sort((a, b) => a.name.localeCompare(b.name));
		},
		[variables],
	);

	// Filtered alias options by search
	const filteredAliasOptions = useMemo(() => {
		if (!aliasPickField) return [];
		const [varId] = aliasPickField.split("|||");
		const v = variables.find((x) => x.id === varId);
		if (!v) return [];
		const options = getAliasOptions(varId, v.resolvedType);
		if (!aliasSearch) return options.slice(0, 50);
		const lower = aliasSearch.toLowerCase();
		return options
			.filter(
				(o) =>
					o.name.toLowerCase().includes(lower) ||
					o.collectionName.toLowerCase().includes(lower),
			)
			.slice(0, 50);
	}, [aliasPickField, aliasSearch, getAliasOptions, variables]);

	// Helper to update a single field in editValues
	const setEditField = useCallback(
		(varId: string, modeName: string, value: string) => {
			setEditValues((prev) => ({
				...prev,
				[varId]: { ...prev[varId], [modeName]: value },
			}));
		},
		[],
	);

	// Check if any values actually changed
	const editHasChanges = useMemo(() => {
		for (const v of editSelectedVars) {
			const edited = editValues[v.id];
			if (!edited) continue;
			for (const [mode, original] of Object.entries(v.valuesByMode)) {
				if (edited[mode] !== original) return true;
			}
		}
		return false;
	}, [editSelectedVars, editValues]);

	const handleEditValues = () => {
		if (operationPending) return;
		// Collect only variables that actually changed
		const updates = editSelectedVars
			.filter((v) => {
				const edited = editValues[v.id];
				if (!edited) return false;
				return Object.entries(v.valuesByMode).some(
					([mode, original]) => edited[mode] !== original,
				);
			})
			.map((v) => ({
				id: v.id,
				valuesByMode: editValues[v.id],
			}));

		if (updates.length === 0) return;
		setOperationPending(true);
		postMessage({
			type: "update-variable-values",
			data: { updates },
		});
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir("asc");
		}
	};

	const openPanel = (panel: ActionPanel) => {
		setActivePanel((prev) => (prev === panel ? null : panel));
	};

	// Move target options (exclude collections that all selected vars are already in)
	const moveTargetCollections = useMemo(() => {
		const selectedVars = variables.filter((v) => selectedIds.has(v.id));
		const sourceCollectionIds = new Set(
			selectedVars.map((v) => v.collectionId),
		);
		// Show all collections, but mark the ones that are already sources
		return collections.map((c) => ({
			...c,
			isCurrent:
				sourceCollectionIds.size === 1 && sourceCollectionIds.has(c.id),
		}));
	}, [collections, selectedIds, variables]);

	if (loading) {
		return (
			<div className="manage-page">
				<LoadingState message="Loading variables…" />
			</div>
		);
	}

	return (
		<div className="manage-page" ref={listRef}>
			{/* Toolbar + Action bar */}
			<Frame>
			<FramePanel>
				<div className="manage-toolbar">
					<div className="manage-toolbar-left">
						<div className="manage-search">
							<Search className="manage-search-icon" size={14} />
							<input
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search variables…"
								type="text"
								value={search}
							/>
							{search && (
								<button
									aria-label="Clear search"
									className="manage-search-clear"
									onClick={() => setSearch("")}
									type="button"
								>
									<X size={12} />
								</button>
							)}
						</div>

						<select
							className="manage-filter-select"
							onChange={(e) => setFilterCollection(e.target.value)}
							value={filterCollection}
						>
							<option value="all">All collections</option>
							{collections.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name} ({c.variableCount})
								</option>
							))}
						</select>

						<select
							className="manage-filter-select"
							onChange={(e) => setFilterType(e.target.value)}
							value={filterType}
						>
							<option value="all">All types</option>
							{uniqueTypes.map((t) => (
								<option key={t} value={t}>
									{t}
								</option>
							))}
						</select>
					</div>

					<div className="manage-toolbar-right">
						<Button
							aria-label="Refresh variables"
							data-tooltip="Refresh"
							onClick={loadVariables}
							size="icon-sm"
							variant="ghost"
						>
							<RefreshCw size={14} />
						</Button>
					</div>
				</div>
			</FramePanel>
			<FrameFooter className="manage-actionbar">
				<span className="manage-selection-count">
					{selectedIds.size} selected
				</span>
					<div className="manage-actionbar-actions">
						{/* Edit group */}
						<Button
							disabled={selectedIds.size === 0}
							onClick={() => openPanel("rename")}
							size="sm"
							variant="ghost"
						>
							<PenLine size={14} />
							Rename
						</Button>
						<Button
							disabled={selectedIds.size === 0}
							onClick={() => openPanel("edit")}
							size="sm"
							variant="ghost"
						>
							<Pencil size={14} />
							Edit
						</Button>
						<Button
							disabled={selectedIds.size === 0}
							onClick={() => openPanel("move")}
							size="sm"
							variant="ghost"
						>
							<FolderInput size={14} />
							Move
						</Button>
						<Separator orientation="vertical" />
						{/* Transform group */}
						<Button
							disabled={operationPending || selectedIds.size === 0}
							onClick={handleDuplicate}
							size="sm"
							variant="ghost"
						>
							<Copy size={14} />
							Duplicate
						</Button>
						<Button
							disabled={selectedIds.size === 0}
							onClick={() => openPanel("scale")}
							size="sm"
							variant="ghost"
						>
							<ArrowUpDown size={14} />
							Scale
						</Button>
						<Separator orientation="vertical" />
						{/* Destructive */}
						<Button
							disabled={selectedIds.size === 0}
							onClick={() => {
								postMessage({
									type: "check-dependencies",
									data: { variableIds: Array.from(selectedIds) },
								});
							}}
							size="sm"
							variant="ghost"
						>
							<Trash2 size={14} />
							Delete
						</Button>
					</div>
				{selectedIds.size > 0 && (
					<Button
						aria-label="Clear selection"
						data-tooltip="Clear selection (Esc)"
						onClick={selectNone}
						size="icon-sm"
						variant="ghost"
					>
						<X size={14} />
					</Button>
				)}
			</FrameFooter>
			</Frame>

			{/* Rename dialog */}
			<RenameDialog
				disabled={operationPending}
				isOpen={activePanel === "rename" && selectedIds.size > 0}
				itemLabel={`${selectedIds.size} ${selectedIds.size === 1 ? "variable" : "variables"}`}
				onApply={handleRename}
				onClose={() => setActivePanel(null)}
				rename={rename}
			/>

			{/* Move dialog */}
			<Dialog
				footer={
					<DialogActions>
						<Button onClick={() => setActivePanel(null)}variant="outline" >
							Cancel
						</Button>
						<Button
							disabled={!moveTargetId || operationPending}
							onClick={handleMove}
							variant="primary"
						>
							<FolderInput size={14} />
							{moveTargetId
								? `Move to ${moveTargetCollections.find((c) => c.id === moveTargetId)?.name ?? "collection"}`
								: "Select a collection"}
						</Button>
					</DialogActions>
				}
				isOpen={activePanel === "move" && selectedIds.size > 0}
				maxWidth="sm"
				onClose={() => setActivePanel(null)}
				title={`Move ${selectedIds.size} ${selectedIds.size === 1 ? "variable" : "variables"}`}
			>
				<div className="manage-move-options">
					{moveTargetCollections.map((c) => (
						<label
							className={`manage-move-option ${c.isCurrent ? "manage-move-current" : ""}`}
							key={c.id}
						>
							<input
								checked={moveTargetId === c.id}
								disabled={c.isCurrent}
								name="moveTarget"
								onChange={() => setMoveTargetId(c.id)}
								type="radio"
								value={c.id}
							/>
							<span className="manage-move-name">{c.name}</span>
							<span className="manage-move-count">
								{c.variableCount}{" "}
								{c.variableCount === 1 ? "variable" : "variables"}
							</span>
							{c.isCurrent && (
								<Badge size="sm"variant="secondary" >
									current
								</Badge>
							)}
						</label>
					))}
				</div>
			</Dialog>

			{/* Edit values dialog */}
			<Dialog
				footer={
					<DialogActions>
						<Button onClick={() => setActivePanel(null)}variant="outline" >
							Cancel
						</Button>
						<Button
							disabled={!editHasChanges || operationPending}
							onClick={handleEditValues}
							variant="primary"
						>
							<Check size={14} />
							Save changes
						</Button>
					</DialogActions>
				}
				isOpen={activePanel === "edit" && editSelectedVars.length > 0}
				maxWidth="lg"
				noPadding
				onClose={() => setActivePanel(null)}
				title={`Edit ${editSelectedVars.length} ${editSelectedVars.length === 1 ? "variable" : "variables"}`}
			>
				<div className="manage-edit-table">
					{editGroups.map((group) => {
						const activeMode =
							editActiveModes[group.collectionName] || group.modes[0];
						return (
							<div className="manage-edit-group"key={group.collectionName} >
								{/* Collection label + mode tabs */}
								{(editGroups.length > 1 || group.modes.length > 1) && (
									<div className="manage-edit-group-bar">
										{editGroups.length > 1 && (
											<span className="manage-edit-group-label">
												{group.collectionName}
											</span>
										)}
										{group.modes.length > 1 && (
											<Tabs
												activeTab={activeMode}
												className="manage-edit-mode-tabs"
												onTabChange={(id) =>
													setEditActiveModes((prev) => ({
														...prev,
														[group.collectionName]: id,
													}))
												}
												size="sm"
												tabs={group.modes.map((m) => ({ id: m, label: m }))}
											/>
										)}
									</div>
								)}
								{/* Column headers */}
								<div className="manage-edit-table-header">
									<div className="manage-edit-col-name">Name</div>
									<div className="manage-edit-col-value">Value</div>
								</div>

								{/* Editable rows — single mode at a time */}
								<div className="manage-edit-table-body">
									{group.vars.map((v) => {
										const fieldKey = `${v.id}|||${activeMode}`;
										const val = editValues[v.id]?.[activeMode] ?? "";
										const isAlias = isReference(val);
										const isPickingAlias = aliasPickField === fieldKey;

										return (
											<div className="manage-edit-row"key={v.id} >
												<div className="manage-edit-col-name" title={v.name}>
													<span className="manage-edit-var-name">{v.name}</span>
												</div>
												<div className="manage-edit-col-value">
													{isPickingAlias ? (
														<div className="manage-edit-alias-field">
															<div className="manage-edit-alias-search">
																<input
																	autoFocus
																	className="manage-edit-alias-input"
																	onChange={(e) =>
																		setAliasSearch(e.target.value)
																	}
																	placeholder="Search variables…"
																	type="text"
																	value={aliasSearch}
																/>
																<div className="manage-edit-alias-list">
																	{filteredAliasOptions.map((opt) => {
																		const optVal =
																			Object.values(opt.valuesByMode)[0] || "";
																		return (
																			<button
																				className={`manage-edit-alias-option ${val === `{${opt.name}}` ? "active" : ""}`}
																				key={opt.id}
																				onClick={() => {
																					setEditField(
																						v.id,
																						activeMode,
																						`{${opt.name}}`,
																					);
																					setAliasPickField(null);
																					setAliasSearch("");
																				}}
																				type="button"
																			>
																				{opt.resolvedType === "COLOR" &&
																					isColorValue(optVal) && (
																						<ColorSwatch
																							color={optVal}
																							size="sm"
																						/>
																					)}
																				<span className="manage-edit-alias-name">
																					{opt.name}
																				</span>
																				<span className="manage-edit-alias-value">
																					{optVal}
																				</span>
																			</button>
																		);
																	})}
																	{filteredAliasOptions.length === 0 && (
																		<div className="manage-edit-alias-empty">
																			No matching variables
																		</div>
																	)}
																</div>
															</div>
															<Button
																onClick={() => {
																	setAliasPickField(null);
																	setAliasSearch("");
																}}
																size="sm"
																variant="ghost"
															>
																Cancel
															</Button>
														</div>
													) : isAlias ? (
														<div className="manage-edit-alias-display">
															<Badge
																icon={<Link size={10} />}
																size="sm"
																variant="outline"
															>
																{val.slice(1, -1)}
															</Badge>
															<Button
																data-tooltip="Change reference"
																onClick={() => {
																	setAliasPickField(fieldKey);
																	setAliasSearch("");
																}}
																size="icon-xs"
																variant="ghost"
															>
																<Link size={12} />
															</Button>
															<Button
																data-tooltip="Remove reference"
																onClick={() =>
																	setEditField(v.id, activeMode, "")
																}
																size="icon-xs"
																variant="destructive-soft"
															>
																<X size={12} />
															</Button>
														</div>
													) : (
														<div className="manage-edit-input-row">
															{v.resolvedType === "COLOR" &&
																isColorValue(val) && (
																	<input
																		className="manage-edit-color-picker"
																		onChange={(e) =>
																			setEditField(
																				v.id,
																				activeMode,
																				e.target.value,
																			)
																		}
																		type="color"
																		value={
																			val.startsWith("#")
																				? val.slice(0, 7)
																				: "#000000"
																		}
																	/>
																)}
															{v.resolvedType === "BOOLEAN" ? (
																<select
																	className="manage-filter-select"
																	onChange={(e) =>
																		setEditField(
																			v.id,
																			activeMode,
																			e.target.value,
																		)
																	}
																	value={val || "false"}
																>
																	<option value="true">true</option>
																	<option value="false">false</option>
																</select>
															) : (
																<input
																	className="manage-edit-input"
																	onChange={(e) =>
																		setEditField(
																			v.id,
																			activeMode,
																			e.target.value,
																		)
																	}
																	placeholder={
																		v.resolvedType === "COLOR"
																			? "#000000"
																			: v.resolvedType === "FLOAT"
																				? "0"
																				: "Value…"
																	}
																	type={
																		v.resolvedType === "FLOAT"
																			? "number"
																			: "text"
																	}
																	value={val}
																/>
															)}
															{v.resolvedType !== "BOOLEAN" && (
																<Button
																	data-tooltip="Set as reference"
																	onClick={() => {
																		setAliasPickField(fieldKey);
																		setAliasSearch("");
																	}}
																	size="icon-xs"
																	variant="ghost"
																>
																	<Link size={12} />
																</Button>
															)}
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</Dialog>

			{/* Scale numeric values dialog */}
			{(() => {
				const selectedVars = variables.filter((v) => selectedIds.has(v.id));
				const floatVars = selectedVars.filter(
					(v) => v.resolvedType === "FLOAT",
				);
				const factor = Number.parseFloat(scaleFactor);
				const validFactor = !Number.isNaN(factor) && factor !== 0;

				return (
					<Dialog
						footer={
							floatVars.length > 0 ? (
								<DialogActions>
									<Button
										onClick={() => setActivePanel(null)}
										variant="outline"
									>
										Cancel
									</Button>
									<Button
										disabled={
											!validFactor || floatVars.length === 0 || operationPending
										}
										onClick={handleScale}
										variant="primary"
									>
										<Check size={14} />
										Scale {floatVars.length}
									</Button>
								</DialogActions>
							) : undefined
						}
						isOpen={activePanel === "scale" && selectedIds.size > 0}
						maxWidth="sm"
						onClose={() => setActivePanel(null)}
						title={`Scale ${floatVars.length} numeric ${floatVars.length === 1 ? "variable" : "variables"}`}
					>
						{floatVars.length === 0 ? (
							<div className="manage-rename-hint">
								No numeric variables in selection. Scale works on number values
								only.
							</div>
						) : (
							<>
								<div className="manage-rename-inputs">
									<div className="manage-scale-controls">
										<label className="manage-swap-label">Operation</label>
										<div className="manage-scale-radio-group">
											<label>
												<input
													checked={scaleOperation === "multiply"}
													name="scaleOp"
													onChange={() => setScaleOperation("multiply")}
													type="radio"
												/>
												Multiply
											</label>
											<label>
												<input
													checked={scaleOperation === "divide"}
													name="scaleOp"
													onChange={() => setScaleOperation("divide")}
													type="radio"
												/>
												Divide
											</label>
										</div>
									</div>
									<Input
										label="Factor"
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setScaleFactor(e.target.value)
										}
										placeholder="e.g. 2"
										value={scaleFactor}
									/>
								</div>
								{validFactor && floatVars.length > 0 && (
									<div className="manage-rename-preview">
										<div className="manage-rename-preview-header">Preview:</div>
										<div className="manage-rename-preview-list">
											{floatVars.slice(0, 10).map((v) => {
												const firstMode = Object.keys(v.valuesByMode)[0];
												const original = Number.parseFloat(v.valuesByMode[firstMode]);
												const result =
													scaleOperation === "multiply"
														? original * factor
														: original / factor;
												return (
													<div
														className="manage-rename-preview-item"
														key={v.id}
													>
														<span className="manage-rename-old">
															{v.name}: {original}
														</span>
														<span className="manage-rename-arrow">
															<ArrowRight size={12} />
														</span>
														<span className="manage-rename-new">
															{Number.isInteger(result)
																? result
																: result.toFixed(2)}
														</span>
													</div>
												);
											})}
											{floatVars.length > 10 && (
												<div className="manage-rename-preview-more">
													...and {floatVars.length - 10} more
												</div>
											)}
										</div>
									</div>
								)}
							</>
						)}
					</Dialog>
				);
			})()}

			{/* Variable list */}
			{filtered.length === 0 ? (
				<EmptyState
						action={
							variables.length === 0 ? (
								<Button onClick={() => onNavigate?.("generate")} variant="primary">
									Create Design System
								</Button>
							) : (
								<Button
									onClick={() => {
										setSearch("");
										setFilterCollection("all");
										setFilterType("all");
									}}
									size="sm"
									variant="outline"
								>
									Clear filters
								</Button>
							)
						}
						description={
							variables.length === 0
								? "Generate a complete token system from your brand colors."
								: "Try adjusting your search or filters."
						}
						icon={variables.length === 0 ? <Palette size={24} /> : <Search size={24} />}
						title={variables.length === 0 ? "No tokens yet" : "No variables found"}
					/>
			) : (
				<div className="manage-list">
					{/* Header */}
					<div className="manage-list-header">
						<div className="manage-col-check">
							<Checkbox
								checked={
									selectedIds.size === filtered.length && filtered.length > 0
								}
								id="select-all"
								indeterminate={
									selectedIds.size > 0 && selectedIds.size < filtered.length
								}
								onChange={() =>
									selectedIds.size === filtered.length
										? selectNone()
										: selectAll()
								}
								size="sm"
							/>
						</div>
						<div
							aria-sort={
								sortField === "name"
									? sortDir === "asc"
										? "ascending"
										: "descending"
									: "none"
							}
							className="manage-col-name manage-sortable"
							onClick={() => handleSort("name")}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSort("name");
								}
							}}
							role="columnheader"
							tabIndex={0}
						>
							Name{" "}
							{sortField === "name" &&
								(sortDir === "asc" ? (
									<ChevronUp size={12} />
								) : (
									<ChevronDown size={12} />
								))}
						</div>
						<div
							aria-sort={
								sortField === "value"
									? sortDir === "asc"
										? "ascending"
										: "descending"
									: "none"
							}
							className="manage-col-value manage-sortable"
							onClick={() => handleSort("value")}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSort("value");
								}
							}}
							role="columnheader"
							tabIndex={0}
						>
							Value{" "}
							{sortField === "value" &&
								(sortDir === "asc" ? (
									<ChevronUp size={12} />
								) : (
									<ChevronDown size={12} />
								))}
						</div>
					</div>

					<ScrollArea className="manage-list-body">
					{/* Grouped rows */}
					{Array.from(grouped.entries()).map(([collectionName, subGroups]) => {
						const isCollapsed = collapsedGroups.has(collectionName);
						const allVars = Array.from(subGroups.values()).flat();
						const groupSelected = allVars.filter((v) =>
							selectedIds.has(v.id),
						).length;
						const hasSubGroups = subGroups.size > 1 || !subGroups.has("Other");
						return (
							<div className="manage-group"key={collectionName} >
								<div
									aria-expanded={!isCollapsed}
									className="manage-group-header"
									onClick={() => toggleGroup(collectionName)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											toggleGroup(collectionName);
										}
									}}
									role="button"
									tabIndex={0}
								>
									{isCollapsed ? (
										<ChevronRight size={14} />
									) : (
										<ChevronDown size={14} />
									)}
									<span className="manage-group-name">{collectionName}</span>
									<Badge variant="outline">{allVars.length}</Badge>
									{groupSelected > 0 && <Badge>{groupSelected} selected</Badge>}
								</div>
								{!isCollapsed &&
									hasSubGroups &&
									Array.from(subGroups.entries()).map(([subKey, vars]) => {
										const subGroupKey = `${collectionName}/${subKey}`;
										const isSubCollapsed = collapsedGroups.has(subGroupKey);
										const subSelected = vars.filter((v) =>
											selectedIds.has(v.id),
										).length;
										return (
											<div className="manage-subgroup"key={subGroupKey} >
												<div
													aria-expanded={!isSubCollapsed}
													className="manage-subgroup-header"
													onClick={(e) => {
														e.stopPropagation();
														toggleGroup(subGroupKey);
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															toggleGroup(subGroupKey);
														}
													}}
													role="button"
													tabIndex={0}
												>
													{isSubCollapsed ? (
														<ChevronRight size={12} />
													) : (
														<ChevronDown size={12} />
													)}
													<span className="manage-subgroup-name">{subKey}</span>
													<span className="manage-subgroup-count">
														{vars.length}
													</span>
													{subSelected > 0 && (
														<Badge>{subSelected} selected</Badge>
													)}
												</div>
												{!isSubCollapsed &&
													vars.map((v) => (
														<VariableRow
															isSelected={selectedIds.has(v.id)}
															key={v.id}
															onContextSelect={contextSelect}
															onToggleSelect={toggleSelect}
															variable={v}
														/>
													))}
											</div>
										);
									})}
								{!(isCollapsed || hasSubGroups ) && (
									<div className="manage-subgroup">
										{allVars.map((v) => (
											<VariableRow
												isSelected={selectedIds.has(v.id)}
												key={v.id}
												onContextSelect={contextSelect}
												onToggleSelect={toggleSelect}
												variable={v}
											/>
										))}
									</div>
								)}
							</div>
						);
					})}
					</ScrollArea>
				</div>
			)}

			<ConfirmDialog
				cancelText="Cancel"
				confirmText={`Delete ${selectedIds.size} ${selectedIds.size === 1 ? "variable" : "variables"}`}
				isOpen={pendingDelete}
				message={`Delete ${selectedIds.size} variable${selectedIds.size !== 1 ? "s" : ""}? You can undo this from the notification.`}
				onClose={() => setPendingDelete(false)}
				onConfirm={handleDelete}
				title="Delete Variables"
			/>

			<ConfirmDialog
				cancelText="Cancel"
				confirmText={"Delete anyway"}
				isOpen={dependencyWarning !== null}
				message={(() => {
					if (!dependencyWarning) return "";
					const depsWithRefs = Object.values(dependencyWarning.deps).filter(
						(d) => d.referencedBy.length > 0,
					);
					const count = depsWithRefs.length;
					const lines = [
						`${count} variable${count !== 1 ? "s are" : " is"} referenced by other variables:`,
						"",
						...depsWithRefs.flatMap((d) => [
							`\u2022 "${d.name}" is referenced by:`,
							...d.referencedBy.map(
								(r) => `  \u2013 ${r.name} (${r.collectionName})`,
							),
						]),
						"",
						"Deleting will break these references. Continue?",
					];
					return lines.join("\n");
				})()}
				onClose={() => setDependencyWarning(null)}
				onConfirm={() => {
					setDependencyWarning(null);
					handleDelete();
				}}
				title="Delete Variables with Dependencies"
			/>
		</div>
	);
}

