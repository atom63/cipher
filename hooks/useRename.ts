import { useMemo, useState } from "react";

export type RenameMode = "find-replace" | "prefix" | "suffix";

export interface RenamePreviewItem {
	id: string;
	oldName: string;
	newName: string | null;
}

interface UseRenameOptions {
	/** Items to rename (filtered by selection) */
	items: { id: string; name: string }[];
}

export interface UseRenameReturn {
	renameMode: RenameMode;
	setRenameMode: (mode: RenameMode) => void;
	findText: string;
	setFindText: (text: string) => void;
	replaceText: string;
	setReplaceText: (text: string) => void;
	useRegex: boolean;
	setUseRegex: (val: boolean) => void;
	renamePrefix: string;
	setRenamePrefix: (text: string) => void;
	renameSuffix: string;
	setRenameSuffix: (text: string) => void;
	/** All selected items with their computed new names (null = unchanged) */
	preview: RenamePreviewItem[];
	/** Only items that will actually change */
	changes: { id: string; oldName: string; newName: string }[];
	/** Reset all rename state */
	reset: () => void;
}

/**
 * Shared rename logic: find/replace, prefix, suffix with preview computation.
 * Used by both ManagePage and StylesPage rename dialogs.
 */
export function useRename({ items }: UseRenameOptions): UseRenameReturn {
	const [renameMode, setRenameMode] = useState<RenameMode>("find-replace");
	const [findText, setFindText] = useState("");
	const [replaceText, setReplaceText] = useState("");
	const [useRegex, setUseRegex] = useState(false);
	const [renamePrefix, setRenamePrefix] = useState("");
	const [renameSuffix, setRenameSuffix] = useState("");

	const preview = useMemo(() => {
		return items.map((item) => {
			let newName: string | null = null;

			if (renameMode === "prefix" && renamePrefix) {
				newName = `${renamePrefix}/${item.name}`;
			} else if (renameMode === "suffix" && renameSuffix) {
				newName = `${item.name}/${renameSuffix}`;
			} else if (renameMode === "find-replace" && findText) {
				try {
					const pattern = useRegex ? new RegExp(findText, "g") : null;
					const result = pattern
						? item.name.replace(pattern, replaceText)
						: item.name.replaceAll(findText, replaceText);
					if (result !== item.name) newName = result;
				} catch {
					// invalid regex
				}
			}

			return { id: item.id, oldName: item.name, newName };
		});
	}, [items, renameMode, findText, replaceText, useRegex, renamePrefix, renameSuffix]);

	const changes = useMemo(
		() =>
			preview.filter((r) => r.newName !== null) as {
				id: string;
				oldName: string;
				newName: string;
			}[],
		[preview],
	);

	const reset = () => {
		setRenameMode("find-replace");
		setFindText("");
		setReplaceText("");
		setUseRegex(false);
		setRenamePrefix("");
		setRenameSuffix("");
	};

	return {
		renameMode,
		setRenameMode,
		findText,
		setFindText,
		replaceText,
		setReplaceText,
		useRegex,
		setUseRegex,
		renamePrefix,
		setRenamePrefix,
		renameSuffix,
		setRenameSuffix,
		preview,
		changes,
		reset,
	};
}
