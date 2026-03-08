import { FileText } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { usePostMessage } from "../../hooks/useFigmaMessage";
import { parseCSS } from "../../parsers/css-parser";
import type { ParsedTokens } from "../../types/tokens";
import { getErrorMessage } from "../../utils/error-handler";
import { Button, LoadingState, SectionHeader, Textarea, useToast } from "../ui";
import styles from "./FileImport.module.css";

interface FileImportProps {
	onTokensParsed: (tokens: ParsedTokens) => void;
	onFileParsed?: (data: any) => void;
}

export function FileImport({
	onTokensParsed: _onTokensParsed,
	onFileParsed,
}: FileImportProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [pastedContent, setPastedContent] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { showError } = useToast();
	const postMessage = usePostMessage();

	const handleFile = async (file: File) => {
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

		// Try to parse as JSON first to detect file type
		try {
			const data = JSON.parse(content);

			// Check if it's a styles export file
			if (data.$schema === "figma-styles-export" && onFileParsed) {
				onFileParsed(data);
				return;
			}
		} catch (_e) {
			// If JSON parse fails, fall back to backend parser
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

	const handlePaste = () => {
		if (pastedContent.trim()) {
			parseContent(pastedContent);
		}
	};

	return (
		<div className={styles.fileImport}>
			<SectionHeader
				variant="secondary"
				title="Import Design Tokens"
				description="Upload or paste your design tokens to sync with Figma"
			/>

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
					style={{ display: "none" }}
					type="file"
				/>

				{isLoading ? (
					<LoadingState message="Reading file…" />
				) : (
					<>
						<div className={styles.uploadIcon}>📁</div>
						<p className={styles.dropZonePrimary}>
							Drop a file here or click to browse
						</p>
						<p className={styles.dropZoneSecondary}>
							Supports JSON and CSS files with design tokens
						</p>
					</>
				)}
			</div>

			{/* Or Divider */}
			<div className={styles.divider}>
				<span>OR</span>
			</div>

			{/* Paste Area */}
			<div className={styles.pasteArea}>
				<Textarea
					label="Paste JSON"
					onChange={(e) => setPastedContent(e.target.value)}
					placeholder={`{\n  "$collections": {...},\n  "tokens": {...}\n}`}
					rows={8}
					value={pastedContent}
				/>
				<Button
					variant="primary"
					disabled={!pastedContent.trim() || isLoading}
					onClick={handlePaste}
				>
					<FileText size={14} />
					Parse Tokens
				</Button>
			</div>

			{/* Example */}
			<div className={styles.example}>
				<details>
					<summary>View example formats</summary>
					<div className={styles.exampleSection}>
						<h4>Multi-Collection Format:</h4>
						<pre>{`{
  "$collections": {
    "primitives": { "name": "Primitives", "modes": ["Default"] },
    "semantic": { "name": "Semantic", "modes": ["Light", "Dark"] }
  },
  "tokens": {
    "primitives": {
      "blue": { "value": "oklch(0.623 0.214 259.815)", "type": "color" }
    },
    "semantic": {
      "background": {
        "type": "color",
        "modes": {
          "Light": "{primitives.blue}",
          "Dark": "#000000"
        }
      }
    }
  }
}`}</pre>
					</div>
					<div className={styles.exampleSection}>
						<h4>Simple Format (Legacy):</h4>
						<pre>{`{
  "colors": {
    "primary": "#3B82F6",
    "gray-100": "#F3F4F6"
  },
  "spacing": {
    "xs": 4,
    "md": 16
  }
}`}</pre>
					</div>
				</details>
			</div>
		</div>
	);
}
