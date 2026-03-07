import { Plus, Undo2, X } from "lucide-react";
import type { ImportUndoEntry } from "../../types/tokens";
import { Button, LoadingState, Spinner } from "../ui";
import styles from "./ProgressView.module.css";

interface ProgressViewProps {
	message?: string;
}

export function ProgressView({ message }: ProgressViewProps) {
	return (
		<LoadingState
			message={message || "Importing Tokens..."}
			hint="This may take a few moments..."
		>
			<Spinner size="lg" />
		</LoadingState>
	);
}

interface SuccessViewProps {
	success: number;
	failed: number;
	errors: string[];
	onClose: () => void;
	onImportMore: () => void;
	onUndo?: () => void;
	importMode?: "import" | "override";
	undoData?: ImportUndoEntry[];
	changes?: Array<{
		name: string;
		type: string;
		action: "created" | "updated" | "unchanged";
		oldValue?: string;
		newValue: string;
	}>;
}

export function SuccessView({
	success,
	failed,
	errors,
	onClose,
	onImportMore,
	onUndo,
	importMode = "import",
	undoData,
	changes = [],
}: SuccessViewProps) {
	const hasErrors = errors.length > 0;
	const allFailed = success === 0 && failed > 0;
	const isOverrideMode = importMode === "override";
	const actionVerb = isOverrideMode ? "Override" : "Import";
	const actionVerbPast = isOverrideMode ? "overridden" : "imported";

	// Categorize changes for display
	const changedTokens = changes.filter((c) => c.action === "updated");
	const createdTokens = changes.filter((c) => c.action === "created");
	const unchangedTokens = changes.filter((c) => c.action === "unchanged");
	const hasChanges = changedTokens.length > 0;

	// Categorize errors for better user understanding
	const errorCategories = {
		typeConflict: errors.filter((e) => e.includes("Type conflict")),
		unsupportedType: errors.filter((e) => e.includes("Unsupported type")),
		referenceError: errors.filter(
			(e) =>
				e.includes("Referenced token not found") ||
				e.includes("Invalid reference format"),
		),
		creationError: errors.filter(
			(e) => e.includes("Failed to create") && !e.includes("reference"),
		),
		other: errors.filter(
			(e) =>
				!e.includes("Type conflict") &&
				!e.includes("Unsupported type") &&
				!e.includes("Referenced token not found") &&
				!e.includes("Invalid reference format") &&
				!e.includes("Failed to create"),
		),
	};

	return (
		<div className={styles.successView}>
			<div
				className={styles.successIcon}
				style={{
					background: allFailed
						? "var(--destructive)"
						: hasErrors
							? "var(--warning)"
							: "var(--success)",
				}}
			>
				{allFailed ? "✗" : hasErrors ? "⚠" : "✓"}
			</div>
			<h2>
				{allFailed
					? `${actionVerb} Failed`
					: hasErrors
						? `${actionVerb} Completed with ${isOverrideMode ? "Warnings" : "Errors"}`
						: `${actionVerb} Complete!`}
			</h2>

			<div className={styles.successStats}>
				{success > 0 && (
					<p className={styles.successStat}>
						<span>✅</span>
						<span>
							Successfully {actionVerbPast}: <strong>{success}</strong> token
							{success !== 1 ? "s" : ""}
						</span>
					</p>
				)}
				{failed > 0 && (
					<p
						className={isOverrideMode ? styles.skippedStat : styles.failedStat}
					>
						<span>{isOverrideMode ? "⚠️" : "❌"}</span>
						<span>
							{isOverrideMode ? "Skipped" : "Failed"}: <strong>{failed}</strong>{" "}
							token{failed !== 1 ? "s" : ""}
							{isOverrideMode && " (tokens or references not found)"}
						</span>
					</p>
				)}
			</div>

			{/* Changes Summary - Show when in override mode with changes */}
			{isOverrideMode && hasChanges && (
				<details className={styles.changesDetails} open={true}>
					<summary>📝 Changes Summary ({changedTokens.length} updated)</summary>
					<div className={styles.changesDetailsContent}>
						<div className={styles.changesSummary}>
							<p>
								{createdTokens.length > 0 &&
									`${createdTokens.length} created, `}
								<strong>{changedTokens.length} updated</strong>
								{unchangedTokens.length > 0 &&
									`, ${unchangedTokens.length} unchanged`}
							</p>
						</div>

						{/* Updated Tokens List */}
						{changedTokens.length > 0 && (
							<div className={styles.changesSection}>
								<strong>Updated Tokens:</strong>
								<ul className={styles.changesList}>
									{changedTokens.slice(0, 20).map((change, i) => (
										<li key={i} className={styles.changeItem}>
											<div className={styles.changeName}>
												<code>{change.name}</code>
												<span className={styles.changeType}>{change.type}</span>
											</div>
											<div className={styles.changeValues}>
												<span className={styles.oldValue}>
													{change.oldValue}
												</span>
												<span className={styles.changeArrow}>→</span>
												<span className={styles.newValue}>
													{change.newValue}
												</span>
											</div>
										</li>
									))}
									{changedTokens.length > 20 && (
										<li className={styles.changeMore}>
											... and {changedTokens.length - 20} more changes
										</li>
									)}
								</ul>
							</div>
						)}
					</div>
				</details>
			)}

			{hasErrors && (
				<details
					className={styles.errorDetails}
					data-override-mode={isOverrideMode}
					open={allFailed}
				>
					<summary>
						{allFailed
							? `⚠️ ${isOverrideMode ? "Skip" : "Error"} Details`
							: `⚠️ View ${isOverrideMode ? "Skipped Tokens" : "Error Details"} (${errors.length})`}
					</summary>
					<div className={styles.errorDetailsContent}>
						{/* Error Summary */}
						<div className={styles.errorSummary}>
							<strong>
								{isOverrideMode ? "Skip Summary:" : "Error Summary:"}
							</strong>
							<ul className={styles.errorSummaryList}>
								{errorCategories.typeConflict.length > 0 && (
									<li>
										{errorCategories.typeConflict.length} type conflict
										{errorCategories.typeConflict.length !== 1 ? "s" : ""}{" "}
										(existing variable has different type)
									</li>
								)}
								{errorCategories.unsupportedType.length > 0 && (
									<li>
										{errorCategories.unsupportedType.length} unsupported type
										{errorCategories.unsupportedType.length !== 1 ? "s" : ""}
									</li>
								)}
								{errorCategories.referenceError.length > 0 && (
									<li>
										{errorCategories.referenceError.length} reference error
										{errorCategories.referenceError.length !== 1 ? "s" : ""}{" "}
										(token not found)
									</li>
								)}
								{errorCategories.creationError.length > 0 && (
									<li>
										{errorCategories.creationError.length} creation error
										{errorCategories.creationError.length !== 1 ? "s" : ""}
									</li>
								)}
								{errorCategories.other.length > 0 && (
									<li>
										{errorCategories.other.length} other error
										{errorCategories.other.length !== 1 ? "s" : ""}
									</li>
								)}
							</ul>
						</div>

						{/* Detailed Errors */}
						<div className={styles.errorDetailedSection}>
							<strong>
								{isOverrideMode ? "Skipped Tokens:" : "Detailed Errors:"}
							</strong>
							<ul className={styles.errorList}>
								{errors.map((error, i) => (
									<li key={i}>{error}</li>
								))}
							</ul>
						</div>
					</div>
				</details>
			)}

			<div className={styles.successActions}>
				{onUndo && undoData && undoData.length > 0 && (
					<Button variant="ghost" onClick={onUndo}>
						<Undo2 size={14} />
						Undo Import
					</Button>
				)}
				<Button variant="ghost" onClick={onImportMore}>
					<Plus size={14} />
					{actionVerb} More
				</Button>
				<Button variant="primary" onClick={onClose}>
					<X size={14} />
					Close
				</Button>
			</div>
		</div>
	);
}
