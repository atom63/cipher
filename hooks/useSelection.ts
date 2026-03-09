import { useCallback, useState } from "react";

interface UseSelectionOptions {
	/** All item IDs in current filtered/sorted order */
	allIds: string[];
}

interface UseSelectionReturn {
	contextSelect: (id: string) => void;
	selectAll: () => void;
	selectedIds: Set<string>;
	selectNone: () => void;
	setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
	toggleSelect: (id: string, event?: React.MouseEvent) => void;
}

/**
 * Shared selection logic with shift-click range selection.
 * Used by both ManagePage (variables) and StylesPage (styles).
 */
export function useSelection({
	allIds,
}: UseSelectionOptions): UseSelectionReturn {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [lastClickedId, setLastClickedId] = useState<string | null>(null);

	const toggleSelect = useCallback(
		(id: string, event?: React.MouseEvent) => {
			setSelectedIds((prev) => {
				const next = new Set(prev);
				if (event?.shiftKey && lastClickedId) {
					const start = allIds.indexOf(lastClickedId);
					const end = allIds.indexOf(id);
					if (start !== -1 && end !== -1) {
						const [from, to] = start < end ? [start, end] : [end, start];
						for (let i = from; i <= to; i++) {
							next.add(allIds[i]);
						}
						return next;
					}
				}
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			});
			setLastClickedId(id);
		},
		[allIds, lastClickedId],
	);

	const selectAll = useCallback(
		() => setSelectedIds(new Set(allIds)),
		[allIds],
	);

	const selectNone = useCallback(() => setSelectedIds(new Set()), []);

	const contextSelect = useCallback((id: string) => {
		setSelectedIds(new Set([id]));
		setLastClickedId(id);
	}, []);

	return {
		selectedIds,
		setSelectedIds,
		toggleSelect,
		selectAll,
		selectNone,
		contextSelect,
	};
}
