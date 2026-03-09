import {
	AlertTriangle,
	Check,
	CheckCircle,
	ChevronRight,
	Plus,
	Undo2,
	X,
	XCircle,
} from "lucide-react";
import type { ImportUndoEntry } from "../../types/tokens";
import { Button, LoadingState, Spinner } from "../ui";
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

	return (
		<div className={styles.successView}>
			<div
				className={styles.successIcon}
				data-status={allFailed ? "error" : hasErrors ? "warning" : "success"}
			>
				{allFailed ? (
					<X size={24} />
				) : hasErrors ? (
					<AlertTriangle size={24} />
				) : (
					<Check size={24} />
				)}
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
						<CheckCircle size={14} />
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
						{isOverrideMode ? (
							<AlertTriangle size={14} />
						) : (
							<XCircle size={14} />
						)}
						<span>
							{isOverrideMode ? "Skipped" : "Failed"}: <strong>{failed}</strong>{" "}
							token{failed !== 1 ? "s" : ""}
							{isOverrideMode && " (tokens or references not found)"}
						</span>
					</p>
				)}
			</div>

			{/* Changes Summary */}
			{changes.length > 0 && (
				<details className={styles.changesDetails} open={hasChanges}>
					<summary>
						{changedTokens.length > 0
							? `${changedTokens.length} updated`
							: `${changes.length} token${changes.length !== 1 ? "s" : ""}`}
						{createdTokens.length > 0 && ` · ${createdTokens.length} created`}
						{unchangedTokens.length > 0 &&
							` · ${unchangedTokens.length} unchanged`}
					</summary>
					<ul className={styles.changesList}>
						{changedTokens.slice(0, 30).map((change, i) => (
							<li className={styles.changeRow}key={i} >
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
				</details>
			)}

			{hasErrors && (
				<details
					className={styles.errorDetails}
					data-override-mode={isOverrideMode}
					open={allFailed}
				>
					<summary>
						{allFailed ? (
							<>
								<AlertTriangle size={14} /> {isOverrideMode ? "Skip" : "Error"}{" "}
								Details
							</>
						) : (
							<>
								<AlertTriangle size={14} /> View{" "}
								{isOverrideMode ? "Skipped Tokens" : "Error Details"} (
								{errors.length})
							</>
						)}
					</summary>
					<div className={styles.errorDetailsContent}>
						<ul className={styles.errorList}>
							{errors.map((error, i) => (
								<li key={i}>{error}</li>
							))}
						</ul>
					</div>
				</details>
			)}

			<div className={styles.successActions}>
				{onUndo && undoData && undoData.length > 0 && (
					<Button onClick={onUndo}variant="ghost" >
						<Undo2 size={14} />
						Undo
					</Button>
				)}
				<Button onClick={onClose}variant="secondary" >
					Close
				</Button>
				<Button onClick={onImportMore}variant="default" >
					<Plus size={14} />
					{actionVerb} More
				</Button>
			</div>
		</div>
	);
}
