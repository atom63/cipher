import { AlertTriangle, Check, Search, X } from "lucide-react";
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
	Badge,
	Button,
	CheckboxWithLabel,
	Dropdown,
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

// Badge variant for token type
const getTypeBadgeVariant = (
	type: string,
): "default" | "secondary" | "success" | "warning" | "info" | "outline" => {
	const variantMap: Record<
		string,
		"default" | "secondary" | "success" | "warning" | "info" | "outline"
	> = {
		color: "info",
		spacing: "success",
		sizing: "default",
		borderRadius: "warning",
		borderWidth: "warning",
		number: "info",
		dimension: "default",
		string: "secondary",
		fontFamily: "secondary",
		fontWeight: "secondary",
		reference: "info",
	};
	return variantMap[type] || "outline";
};

// Render a token's value display
function renderTokenValue(token: DesignToken) {
	if (
		token.type === "color" &&
		typeof token.value === "object" &&
		"r" in token.value
	) {
		const { r, g, b } = token.value;
		const rgb = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
		return (
			<div className={styles.colorPreviewWrapper}>
				<div
					className={styles.colorPreview}
					style={{ backgroundColor: rgb }}
				/>
				<code className={styles.value}>{token.originalValue}</code>
			</div>
		);
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

// Memoized token row
const TokenRow = React.memo(function TokenRow({
	token,
	typeDisplayText,
	editing,
	conflict,
	onToggle,
	onActionChange,
	onNameChange,
	onValueChange,
	onStartEdit,
	onCancelEdit,
}: {
	token: DesignToken;
	typeDisplayText: string;
	editing: EditingState | null;
	conflict?: ImportConflict;
	onToggle: (id: string) => void;
	onActionChange: (id: string, action: TokenAction) => void;
	onNameChange: (id: string, name: string) => void;
	onValueChange: (id: string, value: string) => void;
	onStartEdit: (state: EditingState) => void;
	onCancelEdit: () => void;
}) {
	const isEditing = editing?.tokenId === token.id;

	return (
		<div
			className={`${styles.tokenRow} ${token.action === "skip" ? styles.skipped : ""}`}
		>
			<label className={styles.tokenCheckbox}>
				<input
					checked={token.action === "import"}
					onChange={() => onToggle(token.id)}
					type="checkbox"
				/>
			</label>

			<div className={styles.tokenInfo}>
				<div className={styles.tokenNames}>
					<span className={styles.originalName}>{token.name}</span>
					<Badge variant={getTypeBadgeVariant(token.type)} size="sm">
						{typeDisplayText}
					</Badge>
					<span className={styles.arrow}>→</span>
					{isEditing && editing.field === "figmaName" ? (
						<input
							autoFocus
							className={styles.inlineEdit}
							onBlur={onCancelEdit}
							onChange={(e) =>
								onNameChange(
									token.id,
									(e.target as HTMLInputElement).value,
								)
							}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === "Escape") {
									onCancelEdit();
								}
							}}
							type="text"
							value={token.figmaName}
						/>
					) : (
						<span
							className={`${styles.figmaName} ${styles.editable}`}
							onClick={() =>
								onStartEdit({ tokenId: token.id, field: "figmaName" })
							}
							title="Click to edit"
						>
							{token.figmaName} ✎
						</span>
					)}
				</div>

				{isEditing && editing.field === "value" ? (
					<input
						autoFocus
						className={styles.inlineEdit}
						onBlur={onCancelEdit}
						onChange={(e) =>
							onValueChange(
								token.id,
								(e.target as HTMLInputElement).value,
							)
						}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === "Escape") {
								onCancelEdit();
							}
						}}
						type="text"
						value={token.originalValue}
					/>
				) : (
					<div
						onClick={() =>
							onStartEdit({ tokenId: token.id, field: "value" })
						}
						style={{ cursor: "pointer" }}
						title="Click to edit"
					>
						{renderTokenValue(token)}
					</div>
				)}

				{conflict && (
					<div className={styles.conflictInfo}>
						<span className={styles.conflictLabel}>Existing:</span>
						{Object.entries(conflict.existingValues).map(
							([mode, value]) => (
								<code key={mode} className={styles.conflictValue}>
									{Object.keys(conflict.existingValues).length > 1
										? `${mode}: `
										: ""}
									{value}
								</code>
							),
						)}
					</div>
				)}
			</div>

			<div className={styles.tokenActions}>
				<Dropdown
					trigger={
						token.action === "import"
							? "✓ Import"
							: token.action === "skip"
								? "Skip"
								: "Overwrite"
					}
					options={[
						{ value: "import", label: "✓ Import" },
						{ value: "skip", label: "Skip" },
						{ value: "overwrite", label: "Overwrite" },
					]}
					variant="ghost"
					size="sm"
					align="right"
					width={120}
					onSelect={(value) =>
						onActionChange(token.id, value as TokenAction)
					}
				/>
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
	const [selectAll, setSelectAll] = useState(true);
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
							action: (token.action === "import"
								? "skip"
								: "import") as TokenAction,
						}
					: token,
			);
			onTokensUpdated(updated);
		},
		[tokens, onTokensUpdated],
	);

	const handleToggleAll = useCallback(
		(checked: boolean) => {
			const newAction: TokenAction = checked ? "import" : "skip";
			const updated = tokens.map((token) => ({ ...token, action: newAction }));
			onTokensUpdated(updated);
			setSelectAll(checked);
		},
		[tokens, onTokensUpdated],
	);

	const handleActionChange = useCallback(
		(tokenId: string, action: TokenAction) => {
			const updated = tokens.map((token) =>
				token.id === tokenId ? { ...token, action } : token,
			);
			onTokensUpdated(updated);
		},
		[tokens, onTokensUpdated],
	);

	const handleNameChange = useCallback(
		(tokenId: string, newName: string) => {
			const updated = tokens.map((token) =>
				token.id === tokenId ? { ...token, figmaName: newName } : token,
			);
			onTokensUpdated(updated);
			setEditing(null);
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
			setEditing(null);
		},
		[tokens, onTokensUpdated],
	);

	const handleCancelEdit = useCallback(() => setEditing(null), []);

	const handleBatchRename = (
		find: string,
		replace: string,
		scope: "all" | "name" | "path",
	) => {
		const updated = tokens.map((token) => {
			const regex = new RegExp(find, "gi");
			const newToken = { ...token };

			if (scope === "all" || scope === "name") {
				newToken.name = token.name.replace(regex, replace);
			}

			if (scope === "all" || scope === "path") {
				newToken.figmaName = token.figmaName.replace(regex, replace);
			}

			return newToken;
		});
		onTokensUpdated(updated);
	};

	const _handleGroupRename = (groupName: string, newGroupName: string) => {
		const updated = tokens.map((token) => {
			if (token.figmaName.startsWith(`${token.category}/${groupName}`)) {
				return {
					...token,
					figmaName: token.figmaName.replace(
						`${token.category}/${groupName}`,
						`${token.category}/${newGroupName}`,
					),
				};
			}
			return token;
		});
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

	// Get icon for token category
	const getCategoryIcon = (category: string): string => {
		const iconMap: Record<string, string> = {
			colors: "🎨",
			primitives: "🎨",
			spacing: "📏",
			radius: "⬜",
			sizes: "📐",
			sizing: "📐",
			abstractions: "🔗",
			semantic: "💡",
			typography: "✍️",
			effects: "✨",
			borders: "🔲",
			other: "📦",
		};
		return iconMap[category.toLowerCase()] || "📦";
	};

	// Get display name for category
	const getCategoryDisplayName = (category: string): string => {
		return category.charAt(0).toUpperCase() + category.slice(1);
	};

	// Resolve reference to find the actual token type (follows reference chains)
	const resolveReferenceType = useCallback(
		(token: DesignToken, visited = new Set<string>()): string | null => {
			if (
				token.type !== "reference" ||
				typeof token.originalValue !== "string"
			) {
				return null;
			}

			if (visited.has(token.id)) return null;
			visited.add(token.id);

			const refMatch = token.originalValue.match(/\{([^}]+)\}/);
			if (!refMatch) return null;

			const refPath = refMatch[1].replace(/\./g, "/");
			const referencedToken = tokens.find((t) => t.figmaName === refPath);
			if (!referencedToken) return null;

			if (referencedToken.type === "reference") {
				return resolveReferenceType(referencedToken, visited);
			}

			return referencedToken.type;
		},
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

	// Pre-compute type display text for all tokens
	const typeDisplayTexts = useMemo(() => {
		const map = new Map<string, string>();
		for (const token of tokens) {
			if (token.type === "reference") {
				const actualType = resolveReferenceType(token);
				map.set(
					token.id,
					actualType ? `reference → ${actualType}` : "reference",
				);
			} else {
				map.set(token.id, token.type);
			}
		}
		return map;
	}, [tokens, resolveReferenceType]);

	return (
		<div className={styles.tokenTableContainer}>
			<SectionHeader
				variant="secondary"
				title="Review & Confirm Import"
				description={`Found ${stats.total} tokens • ${stats.toImport} will be imported`}
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
							{getCategoryIcon(category)} {getCategoryDisplayName(category)} (
							{count})
						</button>
					))}
			</div>

			{/* Conflict Summary */}
			{conflicts.length > 0 && (
				<Alert variant="warning" title={`${conflicts.length} conflict${conflicts.length !== 1 ? "s" : ""} detected`}>
					{conflicts.length} token{conflicts.length !== 1 ? "s" : ""} already
					exist{conflicts.length === 1 ? "s" : ""} in the target collection.
					Conflicting tokens are set to &quot;Skip&quot; by default. Change to
					&quot;Overwrite&quot; to replace existing values.
				</Alert>
			)}

			{/* Validation Results */}
			{validation.issues.length > 0 && (
				<Alert
					variant={validation.valid ? "warning" : "error"}
					title={
						validation.valid
							? `${validation.stats.warnings} warning${validation.stats.warnings !== 1 ? "s" : ""}`
							: `${validation.stats.errors} error${validation.stats.errors !== 1 ? "s" : ""} found`
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
								…and {validation.issues.length - 5} more issue
								{validation.issues.length - 5 !== 1 ? "s" : ""}
							</li>
						)}
					</ul>
				</Alert>
			)}

			{/* Controls */}
			<div className={styles.tableControls}>
				<CheckboxWithLabel
					id="select-all"
					label="Select All"
					checked={selectAll}
					onChange={handleToggleAll}
				/>

				<div className={styles.controlActions}>
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
					<div className={styles.emptyState}>No tokens to display</div>
				) : (
					filteredTokens.map((token) => (
						<TokenRow
							key={token.id}
							token={token}
							typeDisplayText={typeDisplayTexts.get(token.id) || token.type}
							editing={editing}
							conflict={conflictMap.get(token.id)}
							onToggle={handleToggleToken}
							onActionChange={handleActionChange}
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
							Fix {validation.stats.errors} error
							{validation.stats.errors !== 1 ? "s" : ""} to import
						</>
					) : (
						<>
							<Check size={14} />
							Import {stats.toImport}{" "}
							{stats.toImport === 1 ? "Token" : "Tokens"}
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
