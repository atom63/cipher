import {
	AlertTriangle,
	Check,
	ChevronRight,
	FileDown,
	Plus,
	Undo2,
	X,
	XCircle,
} from "lucide-react";
import type { ImportUndoEntry } from "../../types/tokens";
import { Button, LoadingState, ScrollArea, Spinner } from "../ui";
import styles from "./ProgressView.module.css";

interface ProgressViewProps {
	message?: string;
}

export function ProgressView({ message }: ProgressViewProps) {
	return (
		<LoadingState
			hint="This may take a few moments…"
			message={message || "Importing Tokens…"}
		>
			<Spinner size="lg" />
		</LoadingState>
	);
}

interface SuccessViewProps {
	actionLabel?: string;
	actionLabelPast?: string;
	changes?: Array<{
		name: string;
		type: string;
		action: "created" | "updated" | "unchanged";
		oldValue?: string;
		newValue: string;
	}>;
	errors: string[];
	failed: number;
	importMode?: "import" | "override";
	onClose: () => void;
	onImportMore: () => void;
	onUndo?: () => void;
	success: number;
	undoData?: ImportUndoEntry[];
}

export function SuccessView({
	actionLabel,
	actionLabelPast,
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
	const actionVerb = actionLabel ?? (isOverrideMode ? "Override" : "Import");
	const actionVerbPast =
		actionLabelPast ?? (isOverrideMode ? "overridden" : "imported");

	// Categorize changes for display
	const changedTokens = changes.filter((c) => c.action === "updated");
	const createdTokens = changes.filter((c) => c.action === "created");
	const unchangedTokens = changes.filter((c) => c.action === "unchanged");
	const hasChanges = changedTokens.length > 0;

	const statusIcon = allFailed ? (
		<X size={24} />
	) : hasErrors ? (
		<AlertTriangle size={24} />
	) : (
		<Check size={24} />
	);

	const title = allFailed
		? `${actionVerb} Failed`
		: hasErrors
			? `${actionVerb} Completed with ${isOverrideMode ? "Warnings" : "Errors"}`
			: `${actionVerb} Complete`;

	const subtitle = allFailed
		? `No tokens were ${actionVerbPast}`
		: `${success} token${success !== 1 ? "s" : ""} ${actionVerbPast} successfully`;

	return (
		<div className={styles.successView}>
			<div
				className={styles.successIcon}
				data-status={allFailed ? "error" : hasErrors ? "warning" : "success"}
			>
				{statusIcon}
			</div>

			<div className={styles.successContent}>
				<h2>{title}</h2>
				<p>{subtitle}</p>
			</div>

			{/* Stats */}
			<div className={styles.successStats}>
				{success > 0 && (
					<div className={styles.successStat}>
						<span className={styles.successStatLabel}>
							{isOverrideMode ? "Overridden" : "Imported"}
						</span>
						<strong className={styles.successStatValue}>{success}</strong>
					</div>
				)}
				{failed > 0 && (
					<div className={styles.successStat}>
						<span className={styles.successStatLabel}>
							{isOverrideMode ? "Skipped" : "Failed"}
						</span>
						<strong className={styles.successStatValue}>{failed}</strong>
					</div>
				)}
				{changedTokens.length > 0 && (
					<div className={styles.successStat}>
						<span className={styles.successStatLabel}>Updated</span>
						<strong className={styles.successStatValue}>
							{changedTokens.length}
						</strong>
					</div>
				)}
				{createdTokens.length > 0 && (
					<div className={styles.successStat}>
						<span className={styles.successStatLabel}>Created</span>
						<strong className={styles.successStatValue}>
							{createdTokens.length}
						</strong>
					</div>
				)}
				{unchangedTokens.length > 0 && (
					<div className={styles.successStat}>
						<span className={styles.successStatLabel}>Unchanged</span>
						<strong className={styles.successStatValue}>
							{unchangedTokens.length}
						</strong>
					</div>
				)}
			</div>

			{/* Changes Detail */}
			{hasChanges && (
				<details className={styles.changesDetails} open>
					<summary>
						{changedTokens.length} value{changedTokens.length !== 1 ? "s" : ""}{" "}
						changed
					</summary>
					<ScrollArea className={styles.changesScroll}>
						<ul className={styles.changesList}>
							{changedTokens.slice(0, 30).map((change, i) => (
								<li className={styles.changeRow} key={i}>
									<code className={styles.changeName}>{change.name}</code>
									<span className={styles.changeValues}>
										<span className={styles.oldValue}>{change.oldValue}</span>
										<ChevronRight size={10} />
										<span className={styles.newValue}>{change.newValue}</span>
									</span>
								</li>
							))}
							{changedTokens.length > 30 && (
								<li className={styles.changeMore}>
									…and {changedTokens.length - 30} more
								</li>
							)}
						</ul>
					</ScrollArea>
				</details>
			)}

			{/* Error Details */}
			{hasErrors && (
				<details className={styles.errorDetails} open={allFailed}>
					<summary>
						{allFailed ? (
							<>
								<XCircle size={12} /> {errors.length} error
								{errors.length !== 1 ? "s" : ""}
							</>
						) : (
							<>
								<AlertTriangle size={12} /> {errors.length}{" "}
								{isOverrideMode ? "skipped" : "error"}
								{errors.length !== 1 ? "s" : ""}
							</>
						)}
					</summary>
					<ScrollArea className={styles.errorDetailsContent}>
						<ul className={styles.errorList}>
							{errors.map((error, i) => (
								<li key={i}>{error}</li>
							))}
						</ul>
					</ScrollArea>
				</details>
			)}

			<div className={styles.successActions}>
				{onUndo && undoData && undoData.length > 0 && (
					<Button onClick={onUndo} variant="ghost">
						<Undo2 size={14} />
						Undo
					</Button>
				)}
				<Button onClick={onClose} variant="ghost">
					<FileDown size={14} />
					{actionVerb} Again
				</Button>
				<Button onClick={onImportMore} variant="default">
					<Plus size={14} />
					{actionVerb} More
				</Button>
			</div>
		</div>
	);
}
