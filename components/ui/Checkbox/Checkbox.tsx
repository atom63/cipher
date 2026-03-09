import { Check } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	/** Checked state */
	checked?: boolean;
	/** Error state */
	error?: boolean;
	/** Unique identifier */
	id: string;
	/** Indeterminate state (for parent checkboxes) */
	indeterminate?: boolean;
	/** Change handler */
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** Size variant */
	size?: "sm" | "md" | "lg";
}

/**
 * Checkbox Input Component
 * Custom styled checkbox with animations and accessibility
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	function Checkbox(
		{
			id,
			checked = false,
			indeterminate = false,
			size = "md",
			error = false,
			onChange,
			disabled = false,
			className = "",
			...props
		},
		ref,
	) {
		const sizeClass = size !== "md" ? styles[size] : "";
		const iconSize = size === "sm" ? 10 : size === "lg" ? 16 : 12;

		return (
			<div
				className={`${styles.checkboxWrapper} ${sizeClass} ${className}`}
				data-error={error || undefined}
			>
				<input
					aria-checked={indeterminate ? "mixed" : checked}
					checked={checked}
					className={styles.checkboxInput}
					disabled={disabled}
					id={id}
					onChange={onChange}
					ref={ref}
					type="checkbox"
					{...props}
				/>
				<div
					className={`
            ${styles.checkboxBox}
            ${checked ? styles.checked : ""}
            ${indeterminate ? styles.indeterminate : ""}
            ${disabled ? styles.disabled : ""}
          `}
				>
					{checked && !indeterminate && (
						<Check
							className={styles.checkIcon}
							size={iconSize}
							strokeWidth={3}
						/>
					)}
					{indeterminate && <div className={styles.indeterminateIcon} />}
				</div>
			</div>
		);
	},
);
