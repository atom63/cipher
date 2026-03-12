import { FolderOpen } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { usePostMessage } from "../../hooks/useFigmaMessage";
import type { ParsedTokens } from "../../types/tokens";
import { getErrorMessage } from "../../utils/error-handler";
import { readZip } from "../../utils/zip-read";
import { LoadingState, useToast } from "../ui";
import styles from "./FileImport.module.css";

interface FileImportProps {
	onTokensParsed: (tokens: ParsedTokens) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/** Files to skip on CSS import — computed/non-roundtrippable outputs */
const SKIP_CSS_FILES = [
	"index.css",
	"radius.css",
	"typescales.css",
	"effects.css",
];

function getExt(name: string): string {
	return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Read a FileSystemFileEntry as a File */
function readFileEntry(entry: FileSystemFileEntry): Promise<File> {
	return new Promise((resolve, reject) => entry.file(resolve, reject));
}

/** Recursively read all files from a FileSystemDirectoryEntry */
async function readDirectoryEntry(
	dirEntry: FileSystemDirectoryEntry,
): Promise<File[]> {
	const reader = dirEntry.createReader();
	const files: File[] = [];

	// readEntries returns batches, must call repeatedly until empty
	const readBatch = (): Promise<FileSystemEntry[]> =>
		new Promise((resolve, reject) => reader.readEntries(resolve, reject));

	let batch = await readBatch();
	while (batch.length > 0) {
		for (const entry of batch) {
			if (entry.isFile) {
				files.push(await readFileEntry(entry as FileSystemFileEntry));
			} else if (entry.isDirectory) {
				files.push(
					...(await readDirectoryEntry(entry as FileSystemDirectoryEntry)),
				);
			}
		}
		batch = await readBatch();
	}

	return files;
}

/** Extract files from a drop event, supporting both files and folders */
async function getDroppedFiles(e: React.DragEvent): Promise<File[]> {
	const items = e.dataTransfer.items;

	// Try webkitGetAsEntry for folder support
	if (items?.length) {
		const entries: FileSystemEntry[] = [];
		for (let i = 0; i < items.length; i++) {
			const entry = items[i].webkitGetAsEntry?.();
			if (entry) entries.push(entry);
		}

		if (entries.length > 0) {
			const files: File[] = [];
			for (const entry of entries) {
				if (entry.isDirectory) {
					files.push(
						...(await readDirectoryEntry(entry as FileSystemDirectoryEntry)),
					);
				} else if (entry.isFile) {
					files.push(await readFileEntry(entry as FileSystemFileEntry));
				}
			}
			return files;
		}
	}

	// Fallback: plain file list (no folder support)
	return Array.from(e.dataTransfer.files);
}

export function FileImport({
	onTokensParsed: _onTokensParsed,
}: FileImportProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { showError } = useToast();
	const postMessage = usePostMessage();

	const sendToParse = (content: string, format: "json" | "css") => {
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
			data: { content, format },
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
				const entries = readZip(buffer);
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

				const combined = cssEntries
					.map((e) => {
						// Use basename only — FILE_CATEGORY_MAP keys are filenames without paths
						const basename = e.name.includes("/")
							? e.name.substring(e.name.lastIndexOf("/") + 1)
							: e.name;
						return `/* === ${basename} === */\n${e.content}`;
					})
					.join("\n\n");
				sendToParse(combined, "css");
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
			const files = await getDroppedFiles(e);
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
							Drop files or a folder here
						</p>
						<p className={styles.dropZoneSecondary}>
							or click to browse
						</p>
						<div className={styles.formatBadges}>
							<span className={styles.formatBadge}>.json</span>
							<span className={styles.formatBadge}>.css</span>
							<span className={styles.formatBadge}>folder</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
