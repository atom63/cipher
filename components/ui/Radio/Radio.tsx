import type React from "react";
import styles from "./Radio.module.css";

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
	id: string;
	name: string;
	value: string;
	checked?: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Primitive Radio Input Component
 * This is the base radio circle that can be composed into other components
 */
export function Radio({
	id,
	name,
	value,
	checked = false,
	onChange,
	disabled = false,
	className = "",
	...props
}: RadioProps) {
	return (
		<input
			id={id}
			type="radio"
			name={name}
			value={value}
			checked={checked}
			onChange={onChange}
			disabled={disabled}
			className={`${styles["radio"]} ${className}`}
			{...props}
		/>
	);
}
