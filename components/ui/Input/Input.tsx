import { AlertCircle, CheckCircle } from "lucide-react";
import type React from "react";
import { forwardRef, type ReactNode } from "react";
import styles from "./Input.module.css";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	/** Helper description below label */
	description?: string;
	/** Error message (also sets error state) */
	error?: string;
	/** Full width */
	fullWidth?: boolean;
	/** Hint text below input */
	hint?: string;
	/** Size variant */
	inputSize?: "sm" | "md" | "lg";
	/** Label text */
	label?: string;
	/** Icon/element on the left side */
	leftIcon?: ReactNode;
	/** Icon/element on the right side */
	rightIcon?: ReactNode;
	/** Success message (also sets success state) */
	success?: string;
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
				<label className={styles.labelWrapper}htmlFor={inputId} >
					<span className={styles.label}>{label}</span>
					{description && (
						<span className={styles.description}>{description}</span>
					)}
				</label>
			)}

			<div
				className={`${styles.inputWrapper} ${styles[inputSize]}`}
				data-disabled={disabled || undefined}
				data-error={hasError || undefined}
				data-success={hasSuccess || undefined}
			>
				{leftIcon && (
					<span aria-hidden="true"className={styles.leftIcon} >
						{leftIcon}
					</span>
				)}
				<input
					aria-describedby={
						error
							? `${inputId}-error`
							: success
								? `${inputId}-success`
								: hint
									? `${inputId}-hint`
									: undefined
					}
					aria-invalid={hasError || undefined}
					className={styles.input}
					disabled={disabled}
					id={inputId}
					ref={ref}
					{...props}
				/>
				{rightIcon && (
					<span aria-hidden="true"className={styles.rightIcon} >
						{rightIcon}
					</span>
				)}
				{hasError && !rightIcon && (
					<span aria-hidden="true"className={styles.stateIcon} >
						<AlertCircle size={16} />
					</span>
				)}
				{hasSuccess && !rightIcon && (
					<span aria-hidden="true"className={styles.stateIcon} >
						<CheckCircle size={16} />
					</span>
				)}
			</div>

			{error && (
				<span className={styles.error} id={`${inputId}-error`} role="alert">
					{error}
				</span>
			)}
			{success && !error && (
				<span className={styles.success}id={`${inputId}-success`} >
					{success}
				</span>
			)}
			{showHint && (
				<span className={styles.hint}id={`${inputId}-hint`} >
					{hint}
				</span>
			)}
		</div>
	);
});
