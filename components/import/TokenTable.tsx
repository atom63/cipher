import { AlertTriangle, Check, Pencil, Search, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import {
	type ValidationResult,
	validateTokens,
} from "../../parsers/import-validator";
import type {
	DesignToken,
	TokenAction,
	TokenCategory,
} from "../../types/tokens";
import {
	Button,
	Checkbox,
	EmptyState,
	SectionHeader,
} from "../ui";
import { Alert } from "../ui/Alert";
import { BatchRenameDialog } from "./BatchRenameDialog";
import styles from "./TokenTable.module.css";

/** A conflict detected when importing a token that already exists */
export interface ImportConflict {
	tokenId: string;
	existingValues: Record<string, string>;
	existingId: string;
}

interface TokenTableProps {
	tokens: DesignToken[];
	onTokensUpdated: (tokens: DesignToken[]) => void;
	onImport: () => void;
	onCancel: () => void;
	conflicts?: ImportConflict[];
}

interface EditingState {
	tokenId: string;
	field: "figmaName" | "value";
}

// Render a token's value display
function renderTokenValue(token: DesignToken) {
	if (
		token.type === "color" &&
		typeof token.value === "object" &&
		"r" in token.value
	) {
		return <code className={styles.value}>{token.originalValue}</code>;
	}

	if (
		token.type === "spacing" ||
		token.type === "sizing" ||
		token.type === "borderRadius" ||
		token.type === "borderWidth" ||
		token.type === "number" ||
		token.type === "dimension"
	) {
		return (
			<code className={styles.value}>
				{token.originalValue}
				<span className={styles.tokenUnit}>px</span>
			</code>
		);
	}

	if (token.type === "reference") {
		return (
			<code className={`${styles.value} ${styles.tokenReference}`}>
				{token.originalValue}
			</code>
		);
	}

	if (
		token.type === "string" ||
		token.type === "fontFamily" ||
		token.type === "fontWeight" ||
		token.type === "text"
	) {
		return (
			<code className={`${styles.value} ${styles.tokenString}`}>
				{token.originalValue}
			</code>
		);
	}

	return <code className={styles.value}>{token.originalValue}</code>;
}

// Memoized token row — matches ManagePage column layout: check | name | value
const TokenRow = React.memo(function TokenRow({
	token,
	editing,
	conflict,
	onToggle,
	onNameChange,
	onValueChange,
	onStartEdit,
	onCancelEdit,
}: {
	token: DesignToken;
	editing: EditingState | null;
	conflict?: ImportConflict;
	onToggle: (id: string) => void;
	onNameChange: (id: string, name: string) => void;
	onValueChange: (id: string, value: string) => void;
	onStartEdit: (state: EditingState) => void;
	onCancelEdit: () => void;
}) {
	const isEditing = editing?.tokenId === token.id;

	const renderNameSwatch = () => {
		if (
			token.type !== "color" ||
			typeof token.value !== "object" ||
			!("r" in token.value)
		)
			return null;
		const { r, g, b } = token.value;
		const rgb = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
		return (
			<div
				className={styles.colorPreview}
				style={{ backgroundColor: rgb }}
				title={token.originalValue}
			/>
		);
	};

	// Show figmaName with path portion dimmed (like ManagePage)
	const renderName = () => {
		if (isEditing && editing.field === "figmaName") {
			return (
				<input
					autoFocus
					className={styles.inlineEdit}
					onBlur={onCancelEdit}
					onChange={(e) =>
						onNameChange(token.id, (e.target as HTMLInputElement).value)
					}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === "Escape") onCancelEdit();
					}}
					type="text"
					value={token.figmaName}
				/>
			);
		}

		const name = token.figmaName;
		const hasPath = name.includes("/");
		return (
			<span
				className={`${styles.tokenName} ${styles.editable}`}
				onClick={() => onStartEdit({ tokenId: token.id, field: "figmaName" })}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onStartEdit({ tokenId: token.id, field: "figmaName" });
					}
				}}
				role="button"
				tabIndex={0}
				title={`${token.name} → ${name}`}
			>
				{hasPath ? (
					<>
						<span className={styles.tokenPath}>
							{name.substring(0, name.lastIndexOf("/") + 1)}
						</span>
						{name.substring(name.lastIndexOf("/") + 1)}
					</>
				) : (
					name
				)}
				<Pencil size={8} className={styles.editIcon} />
			</span>
		);
	};

	const renderValue = () => {
		if (isEditing && editing.field === "value") {
			return (
				<input
					autoFocus
					className={styles.inlineEdit}
					onBlur={onCancelEdit}
					onChange={(e) =>
						onValueChange(token.id, (e.target as HTMLInputElement).value)
					}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === "Escape") onCancelEdit();
					}}
					type="text"
					value={token.originalValue}
				/>
			);
		}

		return (
			<span
				className={styles.editable}
				onClick={() => onStartEdit({ tokenId: token.id, field: "value" })}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onStartEdit({ tokenId: token.id, field: "value" });
					}
				}}
				role="button"
				tabIndex={0}
				title="Click to edit value"
			>
				{renderTokenValue(token)}
			</span>
		);
	};

	return (
		<div
			className={`${styles.tokenRow} ${token.action === "skip" ? styles.skipped : ""} ${conflict ? styles.conflictRow : ""}`}
		>
			<div className={styles.colCheck}>
				<Checkbox
					id={`token-${token.id}`}
					checked={token.action !== "skip"}
					size="sm"
					onChange={() => onToggle(token.id)}
				/>
			</div>
			<div className={styles.colName}>
				{renderNameSwatch()}
				{renderName()}
			</div>
			<div className={styles.colValue}>
				{renderValue()}
			</div>
		</div>
	);
});

export function TokenTable({
	tokens,
	onTokensUpdated,
	onImport,
	onCancel,
	conflicts = [],
}: TokenTableProps) {
	const [filter, setFilter] = useState<TokenCategory | "all">("all");
	const [editing, setEditing] = useState<EditingState | null>(null);
	const [showBatchRename, setShowBatchRename] = useState(false);

	const filteredTokens =
		filter === "all" ? tokens : tokens.filter((t) => t.category === filter);

	const handleToggleToken = useCallback(
		(tokenId: string) => {
			const updated = tokens.map((token) =>
				token.id === tokenId
					? {
							...token,
							action: (token.action === "skip"
								? "import"
								: "skip") as TokenAction,
						}
					: token,
			);
			onTokensUpdated(updated);
		},
		[tokens, onTokensUpdated],
	);

	const allSelected = tokens.every((t) => t.action !== "skip");
	const noneSelected = tokens.every((t) => t.action === "skip");

	const handleToggleAll = useCallback(() => {
		const newAction: TokenAction = allSelected ? "skip" : "import";
		const updated = tokens.map((token) => ({ ...token, action: newAction }));
		onTokensUpdated(updated);
	}, [tokens, onTokensUpdated, allSelected]);

	const handleNameChange = useCallback(
		(tokenId: string, newName: string) => {
			const updated = tokens.map((token) =>
				token.id === tokenId ? { ...token, figmaName: newName } : token,
			);
			onTokensUpdated(updated);
		},
		[tokens, onTokensUpdated],
	);

	const handleValueChange = useCallback(
		(tokenId: string, newValue: string) => {
			const updated = tokens.map((token) => {
				if (token.id === tokenId) {
					if (token.type === "color") {
						const trimmed = newValue.trim();
						if (trimmed.startsWith("#") || trimmed.startsWith("oklch(")) {
							return { ...token, originalValue: trimmed };
						}
					} else if (
						token.type === "spacing" ||
						token.type === "sizing" ||
						token.type === "borderRadius" ||
						token.type === "borderWidth" ||
						token.type === "number" ||
						token.type === "dimension"
					) {
						const num = Number.parseFloat(newValue);
						if (!Number.isNaN(num)) {
							return { ...token, value: num, originalValue: newValue };
						}
					} else if (
						token.type === "string" ||
						token.type === "fontFamily" ||
						token.type === "fontWeight" ||
						token.type === "text"
					) {
						return { ...token, value: newValue, originalValue: newValue };
					}
				}
				return token;
			});
			onTokensUpdated(updated);
		},
		[tokens, onTokensUpdated],
	);

	const handleCancelEdit = useCallback(() => setEditing(null), []);

	const handleBatchRename = (find: string, replace: string, useRegex: boolean) => {
		let pattern: RegExp;
		try {
			pattern = useRegex ? new RegExp(find, "gi") : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
		} catch {
			return;
		}
		const updated = tokens.map((token) => ({
			...token,
			name: token.name.replace(pattern, replace),
			figmaName: token.figmaName.replace(pattern, replace),
		}));
		onTokensUpdated(updated);
	};

	// Dynamic stats - calculate for ALL categories present
	const categoryStats = tokens.reduce(
		(acc, token) => {
			acc[token.category] = (acc[token.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const stats = {
		total: tokens.length,
		toImport: tokens.filter((t) => t.action === "import").length,
		byCategory: categoryStats,
	};

	// Pre-flight validation
	const validation: ValidationResult = useMemo(
		() => validateTokens(tokens),
		[tokens],
	);

	// Build conflict lookup map
	const conflictMap = useMemo(() => {
		const map = new Map<string, ImportConflict>();
		for (const c of conflicts) {
			map.set(c.tokenId, c);
		}
		return map;
	}, [conflicts]);

	return (
		<div className={styles.tokenTableContainer}>
			<SectionHeader
				variant="secondary"
				title="Review Tokens"
				description={`${stats.total} ${stats.total === 1 ? "token" : "tokens"} found · ${stats.toImport} selected for import`}
			/>

			{/* Stats - Dynamic category filters */}
			<div className={styles.statsBar}>
				<button
					className={`${styles.statChip} ${filter === "all" ? styles.active : ""}`}
					onClick={() => setFilter("all")}
					type="button"
				>
					All ({stats.total})
				</button>
				{Object.entries(stats.byCategory)
					.sort(([, a], [, b]) => b - a) // Sort by count descending
					.map(([category, count]) => (
						<button
							key={category}
							className={`${styles.statChip} ${filter === category ? styles.active : ""}`}
							onClick={() => setFilter(category as TokenCategory)}
							type="button"
						>
							{category.charAt(0).toUpperCase() + category.slice(1)} ({count})
						</button>
					))}
			</div>

			{/* Conflict Summary */}
			{conflicts.length > 0 && (
				<Alert variant="warning" title={`${conflicts.length} ${conflicts.length === 1 ? "conflict" : "conflicts"} detected`}>
					{conflicts.length} {conflicts.length === 1 ? "token already exists" : "tokens already exist"} in the target collection.
					Deselect to skip, or keep selected to overwrite existing values.
				</Alert>
			)}

			{/* Validation Results */}
			{validation.issues.length > 0 && (
				<Alert
					variant={validation.valid ? "warning" : "error"}
					title={
						validation.valid
							? `${validation.stats.warnings} ${validation.stats.warnings === 1 ? "warning" : "warnings"}`
							: `${validation.stats.errors} ${validation.stats.errors === 1 ? "error" : "errors"} — fix before importing`
					}
				>
					<ul className={styles.validationList}>
						{validation.issues.slice(0, 5).map((issue) => (
							<li key={`${issue.tokenId}-${issue.type}`}>
								<strong>{issue.tokenName}</strong>: {issue.message}
							</li>
						))}
						{validation.issues.length > 5 && (
							<li>
								…and {validation.issues.length - 5} more
							</li>
						)}
					</ul>
				</Alert>
			)}

			{/* List Header */}
			<div className={styles.listHeader}>
				<div className={styles.colCheck}>
					<Checkbox
						id="select-all"
						checked={allSelected}
						indeterminate={!allSelected && !noneSelected}
						size="sm"
						onChange={handleToggleAll}
					/>
				</div>
				<div className={styles.colName}>Name</div>
				<div className={styles.colValue}>
					<span>Value</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowBatchRename(true)}
						title="Find and replace in token names"
					>
						<Search size={14} />
						Batch Rename
					</Button>
				</div>
			</div>

			{/* Token List */}
			<div className={styles.tokenList}>
				{filteredTokens.length === 0 ? (
					<EmptyState
						icon={<Search size={24} />}
						title={filter === "all" ? "No tokens found" : `No ${filter} tokens`}
						description={filter === "all" ? undefined : "Select a different category or show all tokens."}
						size="sm"
					/>
				) : (
					filteredTokens.map((token) => (
						<TokenRow
							key={token.id}
							token={token}
							editing={editing}
							conflict={conflictMap.get(token.id)}
							onToggle={handleToggleToken}
							onNameChange={handleNameChange}
							onValueChange={handleValueChange}
							onStartEdit={setEditing}
							onCancelEdit={handleCancelEdit}
						/>
					))
				)}
			</div>

			{/* Actions */}
			<div className={styles.tableActions}>
				<Button variant="ghost" onClick={onCancel}>
					<X size={14} />
					Cancel
				</Button>
				<Button
					variant="primary"
					disabled={stats.toImport === 0 || !validation.valid}
					onClick={onImport}
				>
					{!validation.valid ? (
						<>
							<AlertTriangle size={14} />
							Fix {validation.stats.errors} {validation.stats.errors === 1 ? "error" : "errors"} to import
						</>
					) : (
						<>
							<Check size={14} />
							Import {stats.toImport} {stats.toImport === 1 ? "token" : "tokens"}
						</>
					)}
				</Button>
			</div>

			{/* Batch Rename Dialog */}
			{showBatchRename && (
				<BatchRenameDialog
					onApply={handleBatchRename}
					onClose={() => setShowBatchRename(false)}
					tokens={tokens}
				/>
			)}
		</div>
	);
}
