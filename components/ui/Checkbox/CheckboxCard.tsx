import type { ReactNode } from "react";
import { Checkbox } from "./Checkbox";
import styles from "./CheckboxCard.module.css";

interface CheckboxCardProps {
	id: string;
	label: string;
	description?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	icon?: ReactNode;
	className?: string;
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
			htmlFor={id}
			className={`${styles.card} ${checked ? styles.checked : ""} ${disabled ? styles.disabled : ""} ${hasIcon ? styles.withIcon : ""} ${className}`}
		>
			{/* Checkbox on left when no icon */}
			{!hasIcon && (
				<Checkbox
					id={id}
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					disabled={disabled}
					aria-describedby={description ? `${id}-description` : undefined}
				/>
			)}

			{/* Icon (if provided) */}
			{icon && <div className={styles.icon}>{icon}</div>}

			{/* Content */}
			<div className={styles.content}>
				<span className={styles.label}>{label}</span>
				{description && (
					<span id={`${id}-description`} className={styles.description}>
						{description}
					</span>
				)}
			</div>

			{/* Checkbox on right when icon exists */}
			{hasIcon && (
				<Checkbox
					id={id}
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					disabled={disabled}
					aria-describedby={description ? `${id}-description` : undefined}
				/>
			)}
		</label>
	);
}
