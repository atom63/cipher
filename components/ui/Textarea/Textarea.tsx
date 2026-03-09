import type React from "react";
import { forwardRef, useEffect, useState } from "react";
import styles from "./Textarea.module.css";

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	/** Helper description below label */
	description?: string;
	/** Error message (also sets error state) */
	error?: string;
	/** Full width */
	fullWidth?: boolean;
	/** Hint text below textarea */
	hint?: string;
	/** Label text */
	label?: string;
	/** Maximum character count (shows counter) */
	maxLength?: number;
	/** Resize behavior */
	resize?: "none" | "vertical" | "horizontal" | "both";
	/** Show character count even without maxLength */
	showCount?: boolean;
	/** Success message (also sets success state) */
	success?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	function Textarea(
		{
			label,
			description,
			error,
			success,
			hint,
			maxLength,
			showCount = false,
			resize = "vertical",
			fullWidth = true,
			id,
			className = "",
			disabled,
			value,
			defaultValue,
			onChange,
			...props
		},
		ref,
	) {
		const textareaId =
			id ||
			(label
				? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`
				: undefined);
		const hasError = Boolean(error);
		const hasSuccess = Boolean(success) && !hasError;
		const showHint = hint && !error && !success;

		// Track character count
		const [charCount, setCharCount] = useState(0);
		const shouldShowCount = showCount || maxLength !== undefined;

		useEffect(() => {
			const initialValue = value ?? defaultValue ?? "";
			setCharCount(String(initialValue).length);
		}, [value, defaultValue]);

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setCharCount(e.target.value.length);
			onChange?.(e);
		};

		return (
			<div
				className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""} ${className}`}
				data-disabled={disabled || undefined}
			>
				{label && (
					<label className={styles.labelWrapper}htmlFor={textareaId} >
						<span className={styles.label}>{label}</span>
						{description && (
							<span className={styles.description}>{description}</span>
						)}
					</label>
				)}

				<div
					className={styles.textareaWrapper}
					data-disabled={disabled || undefined}
					data-error={hasError || undefined}
					data-success={hasSuccess || undefined}
				>
					<textarea
						aria-describedby={
							error
								? `${textareaId}-error`
								: success
									? `${textareaId}-success`
									: hint
										? `${textareaId}-hint`
										: undefined
						}
						aria-invalid={hasError || undefined}
						className={styles.textarea}
						defaultValue={defaultValue}
						disabled={disabled}
						id={textareaId}
						maxLength={maxLength}
						onChange={handleChange}
						ref={ref}
						style={{ resize }}
						value={value}
						{...props}
					/>
				</div>

				<div className={styles.footer}>
					<div className={styles.messages}>
						{error && (
							<span
								className={styles.error}
								id={`${textareaId}-error`}
								role="alert"
							>
								{error}
							</span>
						)}
						{success && !error && (
							<span className={styles.success}id={`${textareaId}-success`} >
								{success}
							</span>
						)}
						{showHint && (
							<span className={styles.hint}id={`${textareaId}-hint`} >
								{hint}
							</span>
						)}
					</div>

					{shouldShowCount && (
						<span
							className={styles.charCount}
							data-over={
								maxLength !== undefined && charCount > maxLength
									? "true"
									: undefined
							}
						>
							{charCount}
							{maxLength !== undefined && ` / ${maxLength}`}
						</span>
					)}
				</div>
			</div>
		);
	},
);
