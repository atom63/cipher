import type React from "react";
import { forwardRef } from "react";
import styles from "./Radio.module.css";

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
	id: string;
	name: string;
	value: string;
	checked?: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Custom styled Radio Input Component
 * Matches the Checkbox pattern: hidden native input + styled visual element
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
	function Radio(
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
					ref={ref}
					id={id}
					type="radio"
					name={name}
					value={value}
					checked={checked}
					onChange={onChange}
					disabled={disabled}
					className={styles.radioInput}
					{...props}
				/>
				<div
					className={`${styles.radioCircle} ${checked ? styles.checked : ""} ${disabled ? styles.disabled : ""}`}
				>
					{checked && <div className={styles.radioDot} />}
				</div>
			</div>
		);
	},
);
