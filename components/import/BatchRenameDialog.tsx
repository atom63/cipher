import { ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import type { DesignToken } from "../../types/tokens";
import { Button, Checkbox, Dialog, DialogActions, Input } from "../ui";

interface BatchRenameDialogProps {
	onApply: (find: string, replace: string, useRegex: boolean) => void;
	onClose: () => void;
	tokens: DesignToken[];
}

export function BatchRenameDialog({
	tokens,
	onApply,
	onClose,
}: BatchRenameDialogProps) {
	const [find, setFind] = useState("");
	const [replace, setReplace] = useState("");
	const [useRegex, setUseRegex] = useState(false);

	const handleApply = () => {
		if (find.trim()) {
			onApply(find, replace, useRegex);
			onClose();
		}
	};

	// Calculate preview of changes
	const preview = useMemo(() => {
		if (!find.trim()) return [];

		let pattern: RegExp;
		try {
			pattern = useRegex
				? new RegExp(find, "gi")
				: new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
		} catch {
			return [];
		}

		return tokens
			.map((token) => {
				const newName = token.figmaName.replace(pattern, replace);
				return {
					id: token.id,
					oldName: token.figmaName,
					newName: newName !== token.figmaName ? newName : null,
				};
			})
			.filter((r) => r.newName !== null || tokens.length <= 20);
	}, [tokens, find, replace, useRegex]);

	const changeCount = preview.filter((r) => r.newName !== null).length;

	return (
		<Dialog
			footer={
				<DialogActions>
					<Button onClick={onClose}variant="outline" >
						Cancel
					</Button>
					<Button
						disabled={!find.trim() || changeCount === 0}
						onClick={handleApply}
						variant="primary"
					>
						<Check size={14} />
						Rename{changeCount > 0 ? ` ${changeCount}` : ""}
					</Button>
				</DialogActions>
			}
			isOpen={true}
			maxWidth="md"
			onClose={onClose}
			title="Batch Rename"
		>
			<div className="manage-rename-inputs">
				<Input
					autoFocus
					id="batch-find"
					label="Find"
					onChange={(e) => setFind(e.target.value)}
					placeholder="Text to find…"
					type="text"
					value={find}
				/>

				<Input
					id="batch-replace"
					label="Replace with"
					onChange={(e) => setReplace(e.target.value)}
					placeholder="Replace with…"
					type="text"
					value={replace}
				/>

				<label
					className="manage-regex-toggle"
					title="Use regular expressions (e.g. color/(\w+) → colour/$1)"
				>
					<Checkbox
						checked={useRegex}
						id="batch-use-regex"
						onChange={(e) => setUseRegex(e.target.checked)}
						size="sm"
					/>
					Regex
				</label>
			</div>

			{preview.length > 0 && (
				<div className="manage-rename-preview">
					<div className="manage-rename-preview-header">
						{changeCount > 0
							? `${changeCount} of ${tokens.length} will change`
							: `${tokens.length} ${tokens.length === 1 ? "token" : "tokens"} selected`}
					</div>
					<div className="manage-rename-preview-list">
						{preview.slice(0, 15).map((r) => (
							<div
								className={`manage-rename-preview-item ${r.newName === null ? "unchanged" : ""}`}
								key={r.id}
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
						{preview.length > 15 && (
							<div className="manage-rename-preview-more">
								…and {preview.length - 15} more
							</div>
						)}
					</div>
				</div>
			)}
		</Dialog>
	);
}
