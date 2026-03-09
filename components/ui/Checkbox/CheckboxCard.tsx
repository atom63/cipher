import type { ReactNode } from "react";
import { Checkbox } from "./Checkbox";
import styles from "./CheckboxCard.module.css";

interface CheckboxCardProps {
	checked: boolean;
	className?: string;
	description?: string;
	disabled?: boolean;
	icon?: ReactNode;
	id: string;
	label: string;
	onChange: (checked: boolean) => void;
}

/**
 * CheckboxCard - A checkbox within a card/item layout
 *
 * Features:
 * - Full card is clickable
 * - Optional icon on the left
 * - Title and optional description
 * - Hover and active states
 * - Accessible with proper ARIA attributes
 * - Uses custom Check icon from lucide-react
 */
export function CheckboxCard({
	id,
	label,
	description,
	checked,
	onChange,
	disabled = false,
	icon,
	className = "",
}: CheckboxCardProps) {
	// Smart layout: checkbox on right if icon exists, left if no icon
	const hasIcon = !!icon;

	return (
		<label
			className={`${styles.card} ${checked ? styles.checked : ""} ${disabled ? styles.disabled : ""} ${hasIcon ? styles.withIcon : ""} ${className}`}
			htmlFor={id}
		>
			{/* Checkbox on left when no icon */}
			{!hasIcon && (
				<Checkbox
					aria-describedby={description ? `${id}-description` : undefined}
					checked={checked}
					disabled={disabled}
					id={id}
					onChange={(e) => onChange(e.target.checked)}
				/>
			)}

			{/* Icon (if provided) */}
			{icon && <div className={styles.icon}>{icon}</div>}

			{/* Content */}
			<div className={styles.content}>
				<span className={styles.label}>{label}</span>
				{description && (
					<span className={styles.description}id={`${id}-description`} >
						{description}
					</span>
				)}
			</div>

			{/* Checkbox on right when icon exists */}
			{hasIcon && (
				<Checkbox
					aria-describedby={description ? `${id}-description` : undefined}
					checked={checked}
					disabled={disabled}
					id={id}
					onChange={(e) => onChange(e.target.checked)}
				/>
			)}
		</label>
	);
}
