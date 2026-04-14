import { FolderOpen } from "lucide-react";
import type React from "react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { usePostMessage } from "../../hooks/useFigmaMessage";
import type { ParsedTokens } from "../../types/tokens";
import { getErrorMessage } from "../../utils/error-handler";
import { readZip } from "../../utils/zip-read";
import { LoadingState, useToast } from "../ui";
import styles from "./FileImport.module.css";

export interface FileImportHandle {
	openFilePicker: () => void;
}

interface FileImportProps {
	onTokensParsed: (tokens: ParsedTokens) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/** Files to skip on CSS import — computed/non-roundtrippable outputs.
 * typography.css is NOT skipped — the parser reverse-maps --typography-*
 * back to font/typescale/* primitives for Figma roundtrip. */
const SKIP_CSS_FILES = [
	"index.css",
	"radius.css",
	"effects.css",
];

function getExt(name: string): string {
	return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Extract files from a drop event.
 * Figma's plugin sandbox breaks the FileSystemEntry read API (both
 * entry.file() and createReader()). Use webkitGetAsEntry() only to detect
 * directory drops, then fall back to getAsFile() / dataTransfer.files for
 * the actual File objects. */
async function getDroppedFiles(
	e: React.DragEvent,
): Promise<{ files: File[]; hasDirectory: boolean }> {
	const items = e.dataTransfer.items;

	if (items?.length) {
		// Check for directories using webkitGetAsEntry (read-only, safe in Figma)
		for (let i = 0; i < items.length; i++) {
			const entry = items[i].webkitGetAsEntry?.();
			if (entry?.isDirectory) {
				return { files: [], hasDirectory: true };
			}
		}

		// Collect files via getAsFile() — works in Figma's sandbox
		const files = Array.from(items)
			.map((item) => item.getAsFile())
			.filter((f): f is File => f !== null);
		if (files.length > 0) {
			return { files, hasDirectory: false };
		}
	}

	// Final fallback
	return { files: Array.from(e.dataTransfer.files), hasDirectory: false };
}

export const FileImport = forwardRef<FileImportHandle, FileImportProps>(
	function FileImport({ onTokensParsed: _onTokensParsed }, ref) {
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { showError } = useToast();
	const postMessage = usePostMessage();

	useImperativeHandle(ref, () => ({
		openFilePicker: () => fileInputRef.current?.click(),
	}));

	const sendToParse = (content: string, format: "json" | "css", stylesData?: any) => {
		if (format === "json") {
			try {
				const data = JSON.parse(content);
				if (data.$schema === "figma-styles-export") {
					showError(
						"This is a Figma Styles file. Import supports variable token files (JSON or CSS).",
					);
					return;
				}
			} catch (_e) {
				// Fall through to backend parser
			}
		}

		postMessage({
			type: "parse-tokens",
			data: {
				content,
				format,
				...(stylesData ? { stylesData } : {}),
			},
		});
	};

	const handleFiles = async (files: File[]) => {
		if (files.length === 0) return;

		const totalSize = files.reduce((s, f) => s + f.size, 0);
		if (totalSize > MAX_FILE_SIZE) {
			showError("Files too large. Maximum total size is 5MB.");
			return;
		}

		setIsLoading(true);
		try {
			// ZIP file (silent support for round-trip with our own exports)
			if (files.length === 1 && getExt(files[0].name) === "zip") {
				const buffer = await files[0].arrayBuffer();
				const entries = await readZip(buffer);
				const cssEntries = entries.filter(
					(e) => {
						if (getExt(e.name) !== "css") return false;
						const basename = e.name.includes("/")
							? e.name.substring(e.name.lastIndexOf("/") + 1)
							: e.name;
						return !SKIP_CSS_FILES.includes(basename);
					},
				);

				if (cssEntries.length === 0) {
					const jsonEntry = entries.find((e) => getExt(e.name) === "json");
					if (jsonEntry) {
						sendToParse(jsonEntry.content, "json");
						return;
					}
					showError("No CSS or JSON token files found.");
					return;
				}

				// Extract bundled styles.json if present (Cipher ZIP round-trip)
				let bundledStyles: any = undefined;
				const stylesEntry = entries.find((e) => {
					const basename = e.name.includes("/")
						? e.name.substring(e.name.lastIndexOf("/") + 1)
						: e.name;
					return basename === "styles.json" && getExt(e.name) === "json";
				});
				if (stylesEntry) {
					try {
						const stylesJson = JSON.parse(stylesEntry.content);
						// Cipher styles JSON: { $schema: "figma-styles-export", styles: { paint, text, effect, grid } }
						if (stylesJson.$schema === "figma-styles-export" && stylesJson.styles) {
							bundledStyles = stylesJson.styles;
						}
					} catch (_e) {
						// Malformed styles.json — ignore, proceed with CSS-only import
					}
				}

				const combined = cssEntries
					.map((e) => {
						// Use basename only — FILE_CATEGORY_MAP keys are filenames without paths
						const basename = e.name.includes("/")
							? e.name.substring(e.name.lastIndexOf("/") + 1)
							: e.name;
						return `/* === ${basename} === */\n${e.content}`;
					})
					.join("\n\n");
				sendToParse(combined, "css", bundledStyles);
				return;
			}

			// Single JSON file
			if (files.length === 1 && getExt(files[0].name) === "json") {
				const content = await files[0].text();
				sendToParse(content, "json");
				return;
			}

			// CSS files (single or multiple, possibly from a folder drop)
			// Skip computed files that can't round-trip
			const cssFiles = files.filter(
				(f) => getExt(f.name) === "css" && !SKIP_CSS_FILES.includes(f.name),
			);
			const jsonFiles = files.filter((f) => getExt(f.name) === "json");

			if (cssFiles.length > 0) {
				const contents = await Promise.all(
					cssFiles.map(async (f) => {
						const text = await f.text();
						return `/* === ${f.name} === */\n${text}`;
					}),
				);
				sendToParse(contents.join("\n\n"), "css");
				return;
			}

			if (jsonFiles.length === 1) {
				const content = await jsonFiles[0].text();
				sendToParse(content, "json");
				return;
			}

			showError("No CSS or JSON token files found.");
		} catch (error) {
			showError(`Error reading files: ${getErrorMessage(error)}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		setIsLoading(true);
		try {
			const { files, hasDirectory } = await getDroppedFiles(e);
			if (hasDirectory) {
				showError("Folder drop isn't supported here. Export a ZIP from Figma and drop that instead.");
				setIsLoading(false);
				return;
			}
			await handleFiles(files);
		} catch (error) {
			showError(`Error reading drop: ${getErrorMessage(error)}`);
			setIsLoading(false);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fileList = Array.from(e.target.files ?? []);
		if (fileList.length > 0) {
			handleFiles(fileList);
		}
	};

	return (
		<div className={styles.fileImport}>
			<div
				aria-label="Drop files or a folder here, or click to browse"
				className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
				onClick={() => fileInputRef.current?.click()}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						fileInputRef.current?.click();
					}
				}}
				role="button"
				tabIndex={0}
			>
				<input
					accept=".json,.css,.zip"
					className={styles.hiddenInput}
					multiple
					onChange={handleFileSelect}
					ref={fileInputRef}
					type="file"
				/>

				{isLoading ? (
					<LoadingState message="Reading files…" />
				) : (
					<>
						<div className={styles.uploadIcon}>
							<FolderOpen size={20} />
						</div>
						<p className={styles.dropZonePrimary}>
							Drop files here
						</p>
						<p className={styles.dropZoneSecondary}>
							or click to browse
						</p>
						<div className={styles.formatBadges}>
							<span className={styles.formatBadge}>.json</span>
							<span className={styles.formatBadge}>.css</span>
							<span className={styles.formatBadge}>.zip</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
});
