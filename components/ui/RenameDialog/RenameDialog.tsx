import { ArrowRight, Check } from "lucide-react";
import type { RenamePreviewItem, UseRenameReturn } from "../../../hooks/useRename";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Dialog, DialogActions } from "../Dialog";
import { Input } from "../Input";
import { Tabs } from "../Tabs";

interface RenameDialogProps {
	isOpen: boolean;
	onClose: () => void;
	/** e.g. "3 variables" or "5 styles" */
	itemLabel: string;
	rename: UseRenameReturn;
	onApply: () => void;
	disabled?: boolean;
}

export function RenameDialog({
	isOpen,
	onClose,
	itemLabel,
	rename,
	onApply,
	disabled = false,
}: RenameDialogProps) {
	const { changes, preview } = rename;

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={`Rename ${itemLabel}`}
			maxWidth="md"
			footer={
				<DialogActions>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={onApply}
						disabled={changes.length === 0 || disabled}
					>
						<Check size={14} />
						Rename{changes.length > 0 ? ` ${changes.length}` : ""}
					</Button>
				</DialogActions>
			}
		>
			<Tabs
				size="sm"
				tabs={[
					{ id: "find-replace", label: "Replace" },
					{ id: "prefix", label: "Prefix" },
					{ id: "suffix", label: "Suffix" },
				]}
				activeTab={rename.renameMode}
				onTabChange={(tab) =>
					rename.setRenameMode(tab as "find-replace" | "prefix" | "suffix")
				}
			/>

			<div className="manage-rename-inputs">
				{rename.renameMode === "find-replace" && (
					<>
						<Input
							label="Find"
							value={rename.findText}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								rename.setFindText(e.target.value)
							}
							placeholder="Text to find…"
						/>
						<Input
							label="Replace with"
							value={rename.replaceText}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								rename.setReplaceText(e.target.value)
							}
							placeholder="Replace with…"
						/>
						<label
							className="manage-regex-toggle"
							title="Use regular expressions (e.g. color/(\w+) → colour/$1)"
						>
							<Checkbox
								id="rename-use-regex"
								checked={rename.useRegex}
								size="sm"
								onChange={(e) => rename.setUseRegex(e.target.checked)}
							/>
							Regex
						</label>
					</>
				)}
				{rename.renameMode === "prefix" && (
					<Input
						label="Prefix"
						value={rename.renamePrefix}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							rename.setRenamePrefix(e.target.value)
						}
						placeholder="e.g. brand/"
					/>
				)}
				{rename.renameMode === "suffix" && (
					<Input
						label="Suffix"
						value={rename.renameSuffix}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							rename.setRenameSuffix(e.target.value)
						}
						placeholder="e.g. /dark"
					/>
				)}
			</div>

			{preview.length > 0 && <RenamePreview items={preview} />}
		</Dialog>
	);
}

function RenamePreview({ items }: { items: RenamePreviewItem[] }) {
	const changes = items.filter((r) => r.newName !== null);

	return (
		<div className="manage-rename-preview">
			<div className="manage-rename-preview-header">
				{changes.length > 0
					? `${changes.length} of ${items.length} will change`
					: `${items.length} ${items.length === 1 ? "item" : "items"} selected`}
			</div>
			<div className="manage-rename-preview-list">
				{items.slice(0, 15).map((r) => (
					<div
						key={r.id}
						className={`manage-rename-preview-item ${r.newName === null ? "unchanged" : ""}`}
					>
						<span
							className={
								r.newName !== null
									? "manage-rename-old"
									: "manage-rename-unchanged"
							}
						>
							{r.oldName}
						</span>
						{r.newName !== null && (
							<>
								<span className="manage-rename-arrow">
									<ArrowRight size={12} />
								</span>
								<span className="manage-rename-new">{r.newName}</span>
							</>
						)}
					</div>
				))}
				{items.length > 15 && (
					<div className="manage-rename-preview-more">
						…and {items.length - 15} more
					</div>
				)}
			</div>
		</div>
	);
}
