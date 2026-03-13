import type React from "react";
import { forwardRef } from "react";
import styles from "./Radio.module.css";

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
	checked?: boolean;
	id: string;
	name: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	value: string;
}

/**
 * Custom styled Radio Input Component
 * Matches the Checkbox pattern: hidden native input + styled visual element
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
	{
		id,
		name,
		value,
		checked = false,
		onChange,
		disabled = false,
		className = "",
		...props
	},
	ref,
) {
	return (
		<div className={`${styles.radioWrapper} ${className}`}>
			<input
				checked={checked}
				className={styles.radioInput}
				disabled={disabled}
				id={id}
				name={name}
				onChange={onChange}
				ref={ref}
				type="radio"
				value={value}
				{...props}
			/>
			<div
				className={`${styles.radioCircle} ${checked ? styles.checked : ""} ${disabled ? styles.disabled : ""}`}
			>
				{checked && <div className={styles.radioDot} />}
			</div>
		</div>
	);
});
