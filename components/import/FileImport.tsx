import { FolderOpen } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { usePostMessage } from "../../hooks/useFigmaMessage";
import { parseCSS } from "../../parsers/css-parser";
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
		// Detect CSS files by extension or content pattern
		const isCSS =
			fileName?.endsWith(".css") ||
			(!content.trimStart().startsWith("{") &&
				content.includes("--") &&
				content.includes("{"));

		if (isCSS) {
			const result = parseCSS(content);
			if (result.errors.length > 0) {
				showError(
					`CSS parse errors: ${result.errors.map((e) => e.message).join(", ")}`,
				);
			}
			if (result.tokens.length > 0) {
				_onTokensParsed({
					tokens: result.tokens,
					stats: {
						total: result.tokens.length,
						byCategory: {},
						conflicts: 0,
						errors: result.errors.length,
					},
					errors: result.errors.map((e) => ({
						message: e.message,
						line: e.line,
						severity: "error" as const,
					})),
				});
			} else {
				showError("No CSS custom properties found in the file");
			}
			return;
		}

		// Try to detect styles-only files and show a helpful message
		try {
			const data = JSON.parse(content);
			if (data.$schema === "figma-styles-export") {
				showError("This is a Figma Styles file. Import supports variable token files (JSON or CSS).");
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
				className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
				onClick={() => fileInputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						fileInputRef.current?.click();
					}
				}}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				role="button"
				tabIndex={0}
				aria-label="Drop a file here or click to browse"
			>
				<input
					accept=".json,.css"
					onChange={handleFileSelect}
					ref={fileInputRef}
					className={styles.hiddenInput}
					type="file"
				/>

				{isLoading ? (
					<LoadingState message="Reading file…" />
				) : (
					<>
						<div className={styles.uploadIcon}><FolderOpen size={32} /></div>
						<p className={styles.dropZonePrimary}>
							Drop a file here or click to browse
						</p>
						<p className={styles.dropZoneSecondary}>
							Supports JSON and CSS files with design tokens
						</p>
					</>
				)}
			</div>

		</div>
	);
}
