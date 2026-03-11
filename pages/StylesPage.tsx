import {
	ArrowRight,
	Check,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Copy,
	Grid,
	Link,
	Palette,
	Pencil,
	PenLine,
	RefreshCw,
	Search,
	Sparkles,
	Trash2,
	Type,
	Unlink,
	X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	Badge,
	Button,
	ColorSwatch,
	ConfirmDialog,
	Dialog,
	DialogActions,
	EmptyState,
	Frame,
	FrameFooter,
	FramePanel,
	GradientSwatch,
	LoadingState,
	RenameDialog,
	ScrollArea,
	Separator,
	useToast,
} from "../components/ui";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useFigmaMessage, usePostMessage } from "../hooks/useFigmaMessage";
import { useListKeyboard } from "../hooks/useListKeyboard";
import { useRename } from "../hooks/useRename";
import { useSelection } from "../hooks/useSelection";
import type {
	EffectInfo,
	PaintInfo,
	RebindSuggestion,
	StyleCounts,
	StyleEdit,
	StyleInfo,
} from "../types/messages";

type CategoryFilter = "all" | "paint" | "text" | "effect" | "grid";
type SortField = "name";
type SortDir = "asc" | "desc";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
	paint: <Palette size={12} />,
	text: <Type size={12} />,
	effect: <Sparkles size={12} />,
	grid: <Grid size={12} />,
};

// Memoized style row to avoid re-renders when sibling rows change
const StyleRow = React.memo(function StyleRow({
	style,
	isSelected,
	onToggleSelect,
	onContextSelect,
	renderPreview,
}: {
	style: StyleInfo;
	isSelected: boolean;
	onToggleSelect: (id: string, event: React.MouseEvent) => void;
	onContextSelect: (id: string) => void;
	renderPreview: (s: StyleInfo) => React.ReactNode;
}) {
	return (
		<div
			aria-selected={isSelected}
			className={`manage-row ${isSelected ? "manage-row-selected" : ""}`}
			onClick={(e) => onToggleSelect(style.id, e)}
			onContextMenu={(e) => {
				e.preventDefault();
				onContextSelect(style.id);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onToggleSelect(style.id, e as unknown as React.MouseEvent);
				}
			}}
			role="row"
			tabIndex={0}
		>
			<div className="manage-col-check">
				<input checked={isSelected} onChange={() => {}} type="checkbox" />
			</div>
			<div className="manage-col-name">
				<span className="manage-var-name" title={style.name}>
					{style.name.split("/").pop()}
				</span>
			</div>
			<div className="manage-col-value">{renderPreview(style)}</div>
		</div>
	);
});

export function StylesPage() {
	const [styles, setStyles] = useState<StyleInfo[]>([]);
	const [counts, setCounts] = useState<StyleCounts | null>(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filterCategory, setFilterCategory] = useState<CategoryFilter>("all");
	const [sortField, setSortField] = useState<SortField>("name");
	const [sortDir, setSortDir] = useState<SortDir>("asc");
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
		new Set(),
	);
	const debouncedSearch = useDebouncedValue(search, 150);

	// Action panels
	const [showRename, setShowRename] = useState(false);
	const [pendingDelete, setPendingDelete] = useState(false);
	const [operationPending, setOperationPending] = useState(false);
	const [showRebind, setShowRebind] = useState(false);
	const [rebindSuggestions, setRebindSuggestions] = useState<
		RebindSuggestion[]
	>([]);
	const [rebindLoading, setRebindLoading] = useState(false);
	const [rebindExcluded, setRebindExcluded] = useState<Set<number>>(new Set());

	// Edit state
	const [showEdit, setShowEdit] = useState(false);
	const [editValues, setEditValues] = useState<
		Record<string, Partial<StyleEdit>>
	>({});

	const postMessage = usePostMessage();
	const { showSuccess, showError } = useToast();

	const loadStyles = useCallback(() => {
		setLoading(true);
		postMessage({ type: "get-style-details" });
	}, [postMessage]);

	useEffect(() => {
		loadStyles();
	}, [loadStyles]);

	useFigmaMessage((msg) => {
		if (msg.type === "style-details-list") {
			const stylesList: StyleInfo[] = msg.data.styles;
			setStyles(stylesList);
			setCounts(msg.data.counts);
			setLoading(false);
			setOperationPending(false);

			// Auto-collapse large groups (50+ styles) on initial load
			if (loading) {
				const counts = new Map<string, number>();
				for (const s of stylesList) {
					const parts = s.name.split("/");
					const groupKey =
						parts.length > 1
							? `${s.category}/${parts[0]}`
							: `${s.category}/Root`;
					counts.set(groupKey, (counts.get(groupKey) || 0) + 1);
				}
				const largeGroups = new Set<string>();
				for (const [name, count] of counts) {
					if (count >= 50) largeGroups.add(name);
				}
				if (largeGroups.size > 0) setCollapsedGroups(largeGroups);
			}
		} else if (msg.type === "styles-renamed") {
			const { success, failed } = msg.data;
			// Capture undo data before clearing state
			const styleMap = new Map(styles.map((s) => [s.id, s]));
			const undoRenames = rename.changes.map((r) => ({
				id: r.id,
				category: (styleMap.get(r.id)?.category ?? "paint") as
					| "paint"
					| "text"
					| "effect"
					| "grid",
				newName: r.oldName,
			}));
			if (failed > 0) showError(`${failed} rename(s) failed`);
			else
				showSuccess(
					`Renamed ${success} style${success !== 1 ? "s" : ""}`,
					undoRenames.length > 0
						? {
								label: "Undo",
								onClick: () => {
									postMessage({
										type: "rename-styles",
										data: { renames: undoRenames },
									});
								},
							}
						: undefined,
				);
			setShowRename(false);
			rename.reset();
			loadStyles();
		} else if (msg.type === "styles-deleted") {
			const { success, failed } = msg.data;
			if (failed > 0) showError(`${failed} deletion(s) failed`);
			else showSuccess(`Deleted ${success} style${success !== 1 ? "s" : ""}`);
			setSelectedIds(new Set());
			loadStyles();
		} else if (msg.type === "rebind-suggestions") {
			setRebindSuggestions(msg.data.suggestions);
			setRebindLoading(false);
			setRebindExcluded(new Set());
			if (msg.data.suggestions.length === 0) {
				showSuccess(
					"No unbound properties found that match any local variables",
				);
				setShowRebind(false);
			}
		} else if (msg.type === "rebind-applied") {
			const { success, failed, applied } = msg.data;
			if (failed > 0) showError(`${failed} rebind(s) failed`);
			else
				showSuccess(
					`Rebound ${success} propert${success !== 1 ? "ies" : "y"} to variables`,
					applied.length > 0
						? {
								label: "Undo",
								onClick: () => {
									postMessage({
										type: "undo-rebind",
										data: { bindings: applied },
									});
								},
							}
						: undefined,
				);
			setShowRebind(false);
			setRebindSuggestions([]);
			loadStyles();
		} else if (msg.type === "rebind-undone") {
			const { success, failed } = msg.data;
			if (failed > 0) showError(`${failed} unbind(s) failed`);
			else showSuccess(`Unbound ${success} color${success !== 1 ? "s" : ""}`);
			loadStyles();
		} else if (msg.type === "styles-duplicated") {
			const { success, failed, newStyleIds } = msg.data;
			if (failed > 0) showError(`${failed} duplication(s) failed`);
			else
				showSuccess(
					`Duplicated ${success} style${success !== 1 ? "s" : ""}`,
					newStyleIds.length > 0
						? {
								label: "Undo",
								onClick: () => {
									for (const id of newStyleIds) {
										postMessage({
											type: "delete-styles",
											data: { styleIds: [id], category: "paint" },
										});
									}
								},
							}
						: undefined,
				);
			loadStyles();
		} else if (msg.type === "styles-edited") {
			const { success, failed } = msg.data;
			if (failed > 0) showError(`${failed} edit(s) failed`);
			else showSuccess(`Updated ${success} style${success !== 1 ? "s" : ""}`);
			setShowEdit(false);
			setEditValues({});
			loadStyles();
		}
	});

	// Filter and sort
	const filtered = useMemo(() => {
		let result = [...styles];

		if (filterCategory !== "all") {
			result = result.filter((s) => s.category === filterCategory);
		}
		if (debouncedSearch) {
			const lower = debouncedSearch.toLowerCase();
			result = result.filter(
				(s) =>
					s.name.toLowerCase().includes(lower) ||
					s.description.toLowerCase().includes(lower),
			);
		}

		const naturalCompare = (a: string, b: string) =>
			a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

		result.sort((a, b) => {
			let cmp = 0;
			if (sortField === "name") cmp = naturalCompare(a.name, b.name);
			return sortDir === "asc" ? cmp : -cmp;
		});

		return result;
	}, [styles, filterCategory, debouncedSearch, sortField, sortDir]);

	// Group by root folder
	const grouped = useMemo(() => {
		const groups = new Map<string, StyleInfo[]>();
		for (const s of filtered) {
			const parts = s.name.split("/");
			const groupKey =
				parts.length > 1 ? `${s.category}/${parts[0]}` : `${s.category}/Root`;
			if (!groups.has(groupKey)) groups.set(groupKey, []);
			groups.get(groupKey)?.push(s);
		}
		const sorted = Array.from(groups.entries()).sort(([a], [b]) =>
			a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
		);
		return new Map(sorted);
	}, [filtered]);

	// Selection
	const filteredIds = useMemo(() => filtered.map((s) => s.id), [filtered]);
	const {
		selectedIds,
		setSelectedIds,
		toggleSelect,
		selectAll,
		selectNone,
		contextSelect,
	} = useSelection({ allIds: filteredIds });

	// Keyboard shortcuts
	useListKeyboard({
		selectedIds,
		allIds: filteredIds,
		isPanelOpen: showRename || showRebind || showEdit,
		setSelectedIds,
		onClosePanel: useCallback(() => {
			if (showRename) {
				setShowRename(false);
			} else if (showRebind) {
				setShowRebind(false);
				setRebindSuggestions([]);
			} else if (showEdit) {
				setShowEdit(false);
				setEditValues({});
			}
		}, [showRename, showRebind, showEdit]),
		onDelete: useCallback(() => setPendingDelete(true), []),
	});

	const toggleGroup = useCallback((groupKey: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});
	}, []);

	// Rename
	const selectedItems = useMemo(
		() => styles.filter((s) => selectedIds.has(s.id)),
		[styles, selectedIds],
	);
	const rename = useRename({ items: selectedItems });

	const handleRename = () => {
		if (rename.changes.length === 0 || operationPending) return;
		setOperationPending(true);
		// Look up category from styles for each renamed item
		const styleMap = new Map(styles.map((s) => [s.id, s]));
		postMessage({
			type: "rename-styles",
			data: {
				renames: rename.changes.map((r) => ({
					id: r.id,
					category: (styleMap.get(r.id)?.category ?? "paint") as
						| "paint"
						| "text"
						| "effect"
						| "grid",
					newName: r.newName,
				})),
			},
		});
	};

	const handleDelete = () => {
		if (operationPending) return;
		setOperationPending(true);
		// Group by category for the message
		const selected = styles.filter((s) => selectedIds.has(s.id));
		const byCategory = new Map<string, string[]>();
		for (const s of selected) {
			if (!byCategory.has(s.category)) byCategory.set(s.category, []);
			byCategory.get(s.category)?.push(s.id);
		}
		// Send one delete per category
		for (const [category, ids] of byCategory) {
			postMessage({
				type: "delete-styles",
				data: {
					styleIds: ids,
					category: category as "paint" | "text" | "effect" | "grid",
				},
			});
		}
		setPendingDelete(false);
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortField(field);
			setSortDir("asc");
		}
	};

	const handleScanRebind = () => {
		const ids =
			selectedIds.size > 0
				? Array.from(selectedIds)
				: styles
						.filter(
							(s) =>
								s.category === "paint" ||
								s.category === "effect" ||
								s.category === "text",
						)
						.map((s) => s.id);
		setRebindLoading(true);
		setShowRebind(true);
		setShowRename(false);
		postMessage({ type: "scan-rebind", data: { styleIds: ids } });
	};

	const handleDuplicate = () => {
		if (operationPending || selectedIds.size === 0) return;
		setOperationPending(true);
		postMessage({
			type: "duplicate-styles",
			data: { styleIds: Array.from(selectedIds) },
		});
	};

	const editSelectedStyles = useMemo(() => {
		if (!showEdit) return [];
		return styles.filter((s) => selectedIds.has(s.id));
	}, [showEdit, selectedIds, styles]);

	const openEdit = () => {
		const selected = styles.filter((s) => selectedIds.has(s.id));
		const initial: Record<string, Partial<StyleEdit>> = {};
		for (const s of selected) {
			const edit: Partial<StyleEdit> = { description: s.description };
			if (s.preview.type === "paint" && s.preview.paints.length > 0) {
				const first = s.preview.paints[0];
				if (first.paintType === "SOLID") {
					edit.color = first.color || "#000000";
					edit.opacity = first.opacity ?? 1;
				}
			} else if (s.preview.type === "text") {
				edit.fontFamily = s.preview.fontFamily;
				edit.fontStyle = s.preview.fontStyle;
				edit.fontSize = Number.parseFloat(s.preview.fontSize);
				const lh = s.preview.lineHeight;
				if (lh === "auto") {
					// keep undefined
				} else {
					const num = Number.parseFloat(lh);
					if (!Number.isNaN(num)) {
						edit.lineHeight = {
							value: num,
							unit: lh.includes("%") ? "PERCENT" : "PIXELS",
						};
					}
				}
			}
			initial[s.id] = edit;
		}
		setEditValues(initial);
		setShowEdit(true);
		setShowRename(false);
		setShowRebind(false);
	};

	const handleEditApply = () => {
		if (operationPending) return;
		const edits: StyleEdit[] = [];
		for (const s of editSelectedStyles) {
			const ev = editValues[s.id];
			if (!ev) continue;
			edits.push({ styleId: s.id, ...ev });
		}
		if (edits.length === 0) return;
		setOperationPending(true);
		postMessage({ type: "edit-styles", data: { edits } });
	};

	const updateEditField = (styleId: string, field: string, value: any) => {
		setEditValues((prev) => ({
			...prev,
			[styleId]: { ...prev[styleId], [field]: value },
		}));
	};

	const handleApplyRebind = () => {
		if (operationPending) return;
		const activeSuggestions = rebindSuggestions.filter(
			(_, i) => !rebindExcluded.has(i),
		);
		if (activeSuggestions.length === 0) return;
		setOperationPending(true);
		postMessage({
			type: "apply-rebind",
			data: {
				bindings: activeSuggestions.map((s) => ({
					styleId: s.styleId,
					field: s.field,
					variableId: s.suggestedVariableId,
				})),
			},
		});
	};

	const toggleRebindExclude = (index: number) => {
		setRebindExcluded((prev) => {
			const next = new Set(prev);
			if (next.has(index)) next.delete(index);
			else next.add(index);
			return next;
		});
	};

	// Render a single paint layer
	const renderPaintLayer = useCallback((paint: PaintInfo, i: number) => {
		if (paint.paintType === "SOLID") {
			const solidColor = paint.color || "#000";
			return (
				<span className="styles-paint-layer"key={i} >
					<ColorSwatch color={solidColor} opacity={paint.opacity} />
					<span className="styles-preview-text">
						{paint.colorVariable ? (
							<span
								className="styles-var-ref"
								data-tooltip={`Variable: ${paint.colorVariable}`}
							>
								<Link size={10} /> {paint.colorVariable.split("/").pop()}
							</span>
						) : (
							paint.color || "empty"
						)}
						{paint.opacity != null && paint.opacity < 1 && (
							<span className="styles-opacity">
								{paint.opacityVariable ? (
									<span
										className="styles-var-ref"
										data-tooltip={`Opacity variable: ${paint.opacityVariable}`}
									>
										<Link size={10} /> {paint.opacityVariable.split("/").pop()}
									</span>
								) : (
									` ${Math.round(paint.opacity * 100)}%`
								)}
							</span>
						)}
					</span>
				</span>
			);
		}

		if (paint.paintType.startsWith("GRADIENT_")) {
			const stops = paint.stops || [];
			// Build CSS gradient for swatch
			const gradientColors = stops.map((s) => s.color).join(", ");
			const gradientBg = `linear-gradient(90deg, ${gradientColors})`;
			return (
				<span className="styles-paint-layer styles-gradient-layer"key={i} >
					<GradientSwatch gradient={gradientBg} opacity={paint.opacity} />
					<span className="styles-gradient-stops">
						{stops.map((s, j) => (
							<span className="styles-gradient-stop"key={j} >
								<ColorSwatch color={s.color} size="sm" />
								{s.variable ? (
									<span className="styles-var-ref" data-tooltip={s.variable}>
										<Link size={10} /> {s.variable.split("/").pop()}
									</span>
								) : (
									<span className="styles-stop-color">{s.color}</span>
								)}
								<span className="styles-stop-pos">
									{Math.round(s.position * 100)}%
								</span>
							</span>
						))}
						{paint.opacity != null && paint.opacity < 1 && (
							<span className="styles-gradient-opacity">
								{paint.opacityVariable ? (
									<span
										className="styles-var-ref"
										data-tooltip={`Opacity: ${paint.opacityVariable}`}
									>
										<Link size={10} /> {paint.opacityVariable.split("/").pop()}
									</span>
								) : (
									<span className="styles-stop-pos">
										{Math.round(paint.opacity * 100)}% opacity
									</span>
								)}
							</span>
						)}
					</span>
				</span>
			);
		}

		if (paint.paintType === "IMAGE") {
			return (
				<span className="styles-paint-layer"key={i} >
					<span className="styles-preview-text">Image fill</span>
				</span>
			);
		}

		return (
			<span className="styles-preview-text"key={i} >
				{paint.paintType}
			</span>
		);
	}, []);

	// Render a single effect layer
	const renderEffectLayer = useCallback((effect: EffectInfo, i: number) => {
		const hasVars =
			effect.colorVariable || effect.radiusVariable || effect.spreadVariable;
		return (
			<span className="styles-effect-layer"key={i} >
				{effect.color && <ColorSwatch color={effect.color} />}
				<span className="styles-preview-text">{effect.description}</span>
				{hasVars && (
					<span className="styles-var-refs">
						{effect.colorVariable && (
							<span
								className="styles-var-ref"
								data-tooltip={`Color: ${effect.colorVariable}`}
							>
								<Link size={10} /> {effect.colorVariable.split("/").pop()}
							</span>
						)}
						{effect.radiusVariable && (
							<span
								className="styles-var-ref"
								data-tooltip={`Radius: ${effect.radiusVariable}`}
							>
								<Link size={10} /> {effect.radiusVariable.split("/").pop()}
							</span>
						)}
					</span>
				)}
			</span>
		);
	}, []);

	// Render preview (stable reference for memoized rows)
	const renderPreview = useCallback(
		(s: StyleInfo) => {
			const p = s.preview;
			if (p.type === "paint") {
				return (
					<span className="styles-preview-colors">
						{p.paints.map((paint, i) => renderPaintLayer(paint, i))}
						{p.paints.length === 0 && (
							<span className="styles-preview-text">empty</span>
						)}
					</span>
				);
			}
			if (p.type === "text") {
				return (
					<span className="styles-preview-text">
						{p.fontFamily} {p.fontStyle} {p.fontSize}/{p.lineHeight}
						{p.variables && Object.keys(p.variables).length > 0 && (
							<span className="styles-var-refs">
								{Object.entries(p.variables).map(([prop, varName]) => (
									<span
										className="styles-var-ref"
										data-tooltip={`${prop}: ${varName}`}
										key={prop}
									>
										<Link size={10} /> {varName.split("/").pop()}
									</span>
								))}
							</span>
						)}
					</span>
				);
			}
			if (p.type === "effect") {
				return (
					<span className="styles-preview-effects">
						{p.effects.map((effect, i) => renderEffectLayer(effect, i))}
						{p.effects.length === 0 && (
							<span className="styles-preview-text">none</span>
						)}
					</span>
				);
			}
			if (p.type === "grid") {
				return (
					<span className="styles-preview-text">
						{p.patterns.join(", ") || "none"}
					</span>
				);
			}
			return null;
		},
		[renderEffectLayer, renderPaintLayer],
	);

	if (loading) {
		return (
			<div className="manage-page">
				<LoadingState message="Loading styles…" />
			</div>
		);
	}

	return (
		<div className="manage-page">
			{/* Toolbar + Action bar */}
			<Frame>
			<FramePanel>
			<div className="manage-toolbar">
				<div className="manage-toolbar-left">
					<div className="manage-search">
						<Search className="manage-search-icon" size={14} />
						<input
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search styles…"
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
						onChange={(e) =>
							setFilterCategory(e.target.value as CategoryFilter)
						}
						value={filterCategory}
					>
						<option value="all">All types</option>
						<option value="paint">Color ({counts?.paint ?? 0})</option>
						<option value="text">Text ({counts?.text ?? 0})</option>
						<option value="effect">Effect ({counts?.effect ?? 0})</option>
						<option value="grid">Grid ({counts?.grid ?? 0})</option>
					</select>
				</div>

				<div className="manage-toolbar-right">
					<Button
						aria-label="Rebind unbound colors to variables"
						data-tooltip="Rebind"
						onClick={handleScanRebind}
						size="icon-sm"
						variant="ghost"
					>
						<Unlink size={14} />
					</Button>
					<Button
						aria-label="Refresh styles"
						data-tooltip="Refresh"
						onClick={loadStyles}
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
						onClick={() => setShowRename(!showRename)}
						size="sm"
						variant="ghost"
					>
						<PenLine size={14} />
						Rename
					</Button>
					<Button
						disabled={selectedIds.size === 0}
						onClick={openEdit}
						size="sm"
						variant="ghost"
					>
						<Pencil size={14} />
						Edit
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
						onClick={handleScanRebind}
						size="sm"
						variant="ghost"
					>
						<Unlink size={14} />
						Rebind
					</Button>
					<Separator orientation="vertical" />
					{/* Destructive */}
					<Button
						disabled={selectedIds.size === 0}
						onClick={() => setPendingDelete(true)}
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
				isOpen={showRename && selectedIds.size > 0}
				itemLabel={`${selectedIds.size} ${selectedIds.size === 1 ? "style" : "styles"}`}
				onApply={handleRename}
				onClose={() => setShowRename(false)}
				rename={rename}
			/>

			{/* Edit dialog */}
			<Dialog
				footer={
					<DialogActions>
						<Button
							onClick={() => {
								setShowEdit(false);
								setEditValues({});
							}}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={operationPending}
							onClick={handleEditApply}
							variant="primary"
						>
							<Check size={14} />
							Save changes
						</Button>
					</DialogActions>
				}
				isOpen={showEdit && editSelectedStyles.length > 0}
				maxWidth="lg"
				noPadding
				onClose={() => {
					setShowEdit(false);
					setEditValues({});
				}}
				title={`Edit ${editSelectedStyles.length} ${editSelectedStyles.length === 1 ? "style" : "styles"}`}
			>
				<div className="manage-edit-table">
					<div className="manage-edit-table-header">
						<div className="manage-edit-col-name">Style</div>
						<div className="manage-edit-col-value">Properties</div>
					</div>
					<div className="manage-edit-table-body">
						{editSelectedStyles.map((s) => {
							const ev = editValues[s.id] || {};
							return (
								<div className="manage-edit-row"key={s.id} >
									<div className="manage-edit-col-name" title={s.name}>
										<span className="manage-edit-var-name">
											{CATEGORY_ICONS[s.category]}
											{s.name}
										</span>
									</div>
									<div className="manage-edit-col-value">
										<div className="styles-edit-fields">
											{/* Paint style: color + opacity */}
											{s.preview.type === "paint" &&
												s.preview.paints.length > 0 &&
												s.preview.paints[0].paintType === "SOLID" && (
													<div className="manage-edit-input-row">
														<input
															className="manage-edit-color-picker"
															onChange={(e) =>
																updateEditField(s.id, "color", e.target.value)
															}
															type="color"
															value={(ev.color || "#000000").slice(0, 7)}
														/>
														<input
															className="manage-edit-input"
															onChange={(e) =>
																updateEditField(s.id, "color", e.target.value)
															}
															placeholder="#000000"
															type="text"
															value={ev.color || ""}
														/>
														<input
															className="manage-edit-input"
															max={100}
															min={0}
															onChange={(e) =>
																updateEditField(
																	s.id,
																	"opacity",
																	Number.parseInt(e.target.value, 10) / 100,
																)
															}
															placeholder="100"
															style={{ width: 64 }}
															type="number"
															value={
																ev.opacity != null
																	? Math.round(ev.opacity * 100)
																	: 100
															}
														/>
														<span className="styles-edit-unit">%</span>
													</div>
												)}

											{/* Text style: font, size, line-height */}
											{s.preview.type === "text" && (
												<>
													<div className="manage-edit-input-row">
														<input
															className="manage-edit-input"
															onChange={(e) =>
																updateEditField(
																	s.id,
																	"fontFamily",
																	e.target.value,
																)
															}
															placeholder="Font family"
															type="text"
															value={ev.fontFamily || ""}
														/>
														<input
															className="manage-edit-input"
															onChange={(e) =>
																updateEditField(
																	s.id,
																	"fontStyle",
																	e.target.value,
																)
															}
															placeholder="Style"
															style={{ width: 80 }}
															type="text"
															value={ev.fontStyle || ""}
														/>
													</div>
													<div className="manage-edit-input-row">
														<input
															className="manage-edit-input"
															min={1}
															onChange={(e) =>
																updateEditField(
																	s.id,
																	"fontSize",
																	Number.parseFloat(e.target.value) || undefined,
																)
															}
															placeholder="Size"
															style={{ width: 64 }}
															type="number"
															value={ev.fontSize ?? ""}
														/>
														<span className="styles-edit-unit">px</span>
														<span className="styles-edit-separator">/</span>
														<input
															className="manage-edit-input"
															min={0}
															onChange={(e) => {
																const val = Number.parseFloat(e.target.value);
																updateEditField(
																	s.id,
																	"lineHeight",
																	Number.isNaN(val)
																		? "AUTO"
																		: { value: val, unit: "PIXELS" as const },
																);
															}}
															placeholder="LH"
															style={{ width: 64 }}
															type="number"
															value={
																ev.lineHeight &&
																typeof ev.lineHeight === "object"
																	? ev.lineHeight.value
																	: ""
															}
														/>
														<span className="styles-edit-unit">px</span>
													</div>
												</>
											)}

											{/* Effect style: read-only summary */}
											{s.preview.type === "effect" && (
												<div className="styles-edit-readonly">
													{s.preview.effects
														.map((e) => e.description)
														.join(", ") || "No effects"}
												</div>
											)}

											{/* Grid style: read-only */}
											{s.preview.type === "grid" && (
												<div className="styles-edit-readonly">
													{s.preview.patterns.join(", ") || "No grids"}
												</div>
											)}

											{/* Description — all types */}
											<input
												className="manage-edit-input"
												onChange={(e) =>
													updateEditField(s.id, "description", e.target.value)
												}
												placeholder="Description…"
												type="text"
												value={ev.description ?? ""}
											/>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</Dialog>

			{/* Rebind panel */}
			{showRebind && (
				<div className="manage-action-panel">
					<div className="manage-action-panel-header">
						<span>
							Rebind — reconnect unbound properties to matching variables
						</span>
						<button
							className="manage-panel-close"
							data-tooltip="Close panel"
							onClick={() => {
								setShowRebind(false);
								setRebindSuggestions([]);
							}}
							type="button"
						>
							<X size={14} />
						</button>
					</div>

					{rebindLoading ? (
						<div className="styles-rebind-loading">
							Scanning for unbound properties…
						</div>
					) : rebindSuggestions.length > 0 ? (
						<div className="styles-rebind-list">
							<div className="styles-rebind-header">
								{rebindSuggestions.length - rebindExcluded.size} of{" "}
								{rebindSuggestions.length} suggestion
								{rebindSuggestions.length !== 1 ? "s" : ""} selected
							</div>
							<div className="styles-rebind-items">
								{rebindSuggestions.map((s, i) => (
									<div
										className={`styles-rebind-item ${rebindExcluded.has(i) ? "styles-rebind-excluded" : ""}`}
										key={`${s.styleId}-${s.field}-${i}`}
									>
										<input
											checked={!rebindExcluded.has(i)}
											onChange={() => toggleRebindExclude(i)}
											type="checkbox"
										/>
										{s.currentColor ? (
											<ColorSwatch color={s.currentColor} />
										) : (
											<span className="styles-rebind-value">
												{s.currentValue}
											</span>
										)}
										<span
											className="styles-rebind-style-name"
											title={s.styleName}
										>
											{s.styleName.split("/").pop()}
											<span className="styles-rebind-field">
												{s.field.startsWith("stop:")
													? " (gradient stop)"
													: s.field.startsWith("effect:")
														? " (effect)"
														: s.field === "fontSize"
															? " (font size)"
															: s.field === "lineHeight"
																? " (line height)"
																: s.field === "fontFamily"
																	? " (font family)"
																	: s.field === "fontWeight"
																		? " (font weight)"
																		: ""}
											</span>
										</span>
										<span className="manage-rename-arrow">
											<ArrowRight size={12} />
										</span>
										<span className="styles-var-ref">
											<Link size={10} /> {s.suggestedVariableName}
										</span>
										<Badge
											variant={s.matchType === "exact" ? "success" : "warning"}
										>
											{s.matchType}
										</Badge>
									</div>
								))}
							</div>
							<div className="manage-panel-actions">
								<Button
									onClick={() => {
										setShowRebind(false);
										setRebindSuggestions([]);
									}}
									variant="ghost"
								>
									Cancel
								</Button>
								<Button
									disabled={
										rebindExcluded.size === rebindSuggestions.length ||
										operationPending
									}
									onClick={handleApplyRebind}
									variant="primary"
								>
									<Check size={14} />
									Rebind {rebindSuggestions.length - rebindExcluded.size}{" "}
									propert
									{rebindSuggestions.length - rebindExcluded.size !== 1
										? "ies"
										: "y"}
								</Button>
							</div>
						</div>
					) : null}
				</div>
			)}

			{/* Style list */}
			{filtered.length === 0 ? (
				<EmptyState
					description={
						styles.length === 0
							? "This file has no local styles."
							: "No styles match your current filters."
					}
					title="No styles found"
				/>
			) : (
				<div className="manage-list">
					<div className="manage-list-header">
						<div className="manage-col-check">
							<input
								checked={
									selectedIds.size === filtered.length && filtered.length > 0
								}
								onChange={() =>
									selectedIds.size === filtered.length
										? selectNone()
										: selectAll()
								}
								type="checkbox"
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
						<div className="manage-col-value">Preview</div>
					</div>

					<ScrollArea className="manage-list-body">
					{Array.from(grouped.entries()).map(([groupKey, groupStyles]) => {
						const isCollapsed = collapsedGroups.has(groupKey);
						const groupSelected = groupStyles.filter((s) =>
							selectedIds.has(s.id),
						).length;
						const [cat, ...nameParts] = groupKey.split("/");
						const groupLabel = nameParts.join("/") || "Root";
						return (
							<div className="manage-group"key={groupKey} >
								<div
									aria-expanded={!isCollapsed}
									className="manage-group-header"
									onClick={() => toggleGroup(groupKey)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											toggleGroup(groupKey);
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
									{CATEGORY_ICONS[cat]}
									<span className="manage-group-name">{groupLabel}</span>
									<Badge variant="outline">{groupStyles.length}</Badge>
									{groupSelected > 0 && (
										<Badge variant="info">{groupSelected} selected</Badge>
									)}
								</div>
								{!isCollapsed && (
									<div className="manage-subgroup">
										{groupStyles.map((s) => (
											<StyleRow
												isSelected={selectedIds.has(s.id)}
												key={s.id}
												onContextSelect={contextSelect}
												onToggleSelect={toggleSelect}
												renderPreview={renderPreview}
												style={s}
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
				confirmText="Delete"
				isOpen={pendingDelete}
				message={`Delete ${selectedIds.size} style${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`}
				onClose={() => setPendingDelete(false)}
				onConfirm={handleDelete}
				title="Delete Styles"
			/>
		</div>
	);
}
