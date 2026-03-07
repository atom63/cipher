import { AlertCircle, CheckCircle } from "lucide-react";
import type React from "react";
import { forwardRef, type ReactNode } from "react";
import styles from "./Input.module.css";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	/** Label text */
	label?: string;
	/** Helper description below label */
	description?: string;
	/** Error message (also sets error state) */
	error?: string;
	/** Success message (also sets success state) */
	success?: string;
	/** Hint text below input */
	hint?: string;
	/** Icon/element on the left side */
	leftIcon?: ReactNode;
	/** Icon/element on the right side */
	rightIcon?: ReactNode;
	/** Size variant */
	inputSize?: "sm" | "md" | "lg";
	/** Full width */
	fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{
		label,
		description,
		error,
		success,
		hint,
		leftIcon,
		rightIcon,
		inputSize = "md",
		fullWidth = true,
		id,
		className = "",
		disabled,
		...props
	},
	ref,
) {
	const inputId =
		id ||
		(label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
	const hasError = Boolean(error);
	const hasSuccess = Boolean(success) && !hasError;
	const showHint = hint && !error && !success;

	return (
		<div
			className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ""} ${className}`}
			data-disabled={disabled || undefined}
		>
			{label && (
				<label htmlFor={inputId} className={styles.labelWrapper}>
					<span className={styles.label}>{label}</span>
					{description && (
						<span className={styles.description}>{description}</span>
					)}
				</label>
			)}

			<div
				className={`${styles.inputWrapper} ${styles[inputSize]}`}
				data-error={hasError || undefined}
				data-success={hasSuccess || undefined}
				data-disabled={disabled || undefined}
			>
				{leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
				<input
					ref={ref}
					id={inputId}
					className={styles.input}
					disabled={disabled}
					aria-invalid={hasError || undefined}
					aria-describedby={
						error
							? `${inputId}-error`
							: success
								? `${inputId}-success`
								: hint
									? `${inputId}-hint`
									: undefined
					}
					{...props}
				/>
				{rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
				{hasError && !rightIcon && (
					<span className={styles.stateIcon}>
						<AlertCircle size={16} />
					</span>
				)}
				{hasSuccess && !rightIcon && (
					<span className={styles.stateIcon}>
						<CheckCircle size={16} />
					</span>
				)}
			</div>

			{error && (
				<span id={`${inputId}-error`} className={styles.error} role="alert">
					{error}
				</span>
			)}
			{success && !error && (
				<span id={`${inputId}-success`} className={styles.success}>
					{success}
				</span>
			)}
			{showHint && (
				<span id={`${inputId}-hint`} className={styles.hint}>
					{hint}
				</span>
			)}
		</div>
	);
});
