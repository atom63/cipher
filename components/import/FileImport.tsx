import { FolderOpen } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { usePostMessage } from "../../hooks/useFigmaMessage";
import type { ParsedTokens } from "../../types/tokens";
import { getErrorMessage } from "../../utils/error-handler";
import { LoadingState, useToast } from "../ui";
import styles from "./FileImport.module.css";

interface FileImportProps {
	onTokensParsed: (tokens: ParsedTokens) => void;
}

export function FileImport({
	onTokensParsed: _onTokensParsed,
}: FileImportProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { showError } = useToast();
	const postMessage = usePostMessage();

	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

	const handleFile = async (file: File) => {
		if (file.size > MAX_FILE_SIZE) {
			showError("File too large. Maximum size is 5MB.");
			return;
		}
		setIsLoading(true);
		try {
			const content = await file.text();
			parseContent(content, file.name);
		} catch (error) {
			showError(`Error reading file: ${getErrorMessage(error)}`);
		} finally {
			setIsLoading(false);
		}
	};

	const parseContent = (content: string, fileName?: string) => {
		// Only accept JSON files
		if (fileName && !fileName.endsWith(".json")) {
			showError("Only JSON files are supported for import.");
			return;
		}

		// Try to detect styles-only files and show a helpful message
		try {
			const data = JSON.parse(content);
			if (data.$schema === "figma-styles-export") {
				showError(
					"This is a Figma Styles file. Import supports variable token files (JSON).",
				);
				return;
			}
		} catch (_e) {
			// Not valid JSON on its own — fall through to backend parser
		}

		// Send to plugin backend for parsing (for variable tokens)
		postMessage({
			type: "parse-tokens",
			data: { content },
		});
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files[0];
		if (file) {
			handleFile(file);
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
		const file = e.target.files?.[0];
		if (file) {
			handleFile(file);
		}
	};

	return (
		<div className={styles.fileImport}>
			{/* File Drop Zone */}
			<div
				aria-label="Drop a file here or click to browse"
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
					accept=".json"
					className={styles.hiddenInput}
					onChange={handleFileSelect}
					ref={fileInputRef}
					type="file"
				/>

				{isLoading ? (
					<LoadingState message="Reading file…" />
				) : (
					<>
						<div className={styles.uploadIcon}>
							<FolderOpen size={20} />
						</div>
						<p className={styles.dropZonePrimary}>
							Drop a file here or click to browse
						</p>
						<p className={styles.dropZoneSecondary}>
							Supported formats
						</p>
						<div className={styles.formatBadges}>
							<span className={styles.formatBadge}>.json</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
