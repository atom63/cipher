import { useEffect } from "react";

interface UseListKeyboardOptions {
	/** Current selected IDs */
	selectedIds: Set<string>;
	/** All filtered item IDs (for select-all) */
	allIds: string[];
	/** Whether a panel/dialog is open (blocks delete, escape clears panel first) */
	isPanelOpen: boolean;
	/** Set selection state */
	setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
	/** Called on Escape when a panel is open */
	onClosePanel: () => void;
	/** Called on Delete/Backspace with items selected and no panel open */
	onDelete: () => void;
}

/**
 * Shared keyboard shortcuts for list pages.
 * - Escape: close panel or clear selection
 * - Cmd/Ctrl+A: select all
 * - Delete/Backspace: trigger delete
 */
export function useListKeyboard({
	selectedIds,
	allIds,
	isPanelOpen,
	setSelectedIds,
	onClosePanel,
	onDelete,
}: UseListKeyboardOptions) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.tagName === "SELECT"
			)
				return;

			if (e.key === "Escape") {
				if (isPanelOpen) {
					onClosePanel();
				} else if (selectedIds.size > 0) {
					setSelectedIds(new Set());
				}
				return;
			}

			if ((e.metaKey || e.ctrlKey) && e.key === "a") {
				e.preventDefault();
				setSelectedIds(new Set(allIds));
				return;
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				if (selectedIds.size > 0 && !isPanelOpen) {
					e.preventDefault();
					onDelete();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedIds, allIds, isPanelOpen, setSelectedIds, onClosePanel, onDelete]);
}
