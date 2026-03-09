import type React from "react";
import { Radio } from "./Radio";
import styles from "./RadioCard.module.css";

interface RadioCardProps {
	badge?: string; // For "Free", "$5.00", etc.
	checked?: boolean;
	description?: string;
	disabled?: boolean;
	icon?: React.ReactNode; // Optional icon to display before title
	id: string;
	name: string;
	onChange: (value: string) => void;
	title: string;
	value: string;
}

export function RadioCard({
	id,
	name,
	value,
	checked = false,
	onChange,
	title,
	description,
	badge,
	icon,
	disabled = false,
}: RadioCardProps) {
	return (
		<label
			className={`${styles["card"]} ${checked ? styles["checked"] : ""} ${disabled ? styles["disabled"] : ""} ${description ? styles["has-description"] : ""}`}
			htmlFor={id}
		>
			<Radio
				checked={checked}
				className={description ? styles["radio-align"] : ""}
				disabled={disabled}
				id={id}
				name={name}
				onChange={(e) => onChange(e.target.value)}
				value={value}
			/>
			<div className={styles["content"]}>
				<div className={styles["header"]}>
					{icon && <span className={styles["icon"]}>{icon}</span>}
					<span className={styles["title"]}>{title}</span>
					{badge && <span className={styles["badge"]}>{badge}</span>}
				</div>
				{description && (
					<span className={styles["description"]}>{description}</span>
				)}
			</div>
		</label>
	);
}
