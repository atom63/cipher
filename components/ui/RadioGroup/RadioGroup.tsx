import type React from "react";
import { Radio, RadioCard } from "../Radio";
import styles from "./RadioGroup.module.css";

export interface RadioOption {
	value: string;
	label: string;
	description?: string;
	icon?: React.ReactNode; // Optional icon for card variant
	badge?: string; // Optional badge for card variant
	disabled?: boolean; // Optional disabled state
}

interface RadioGroupProps {
	label?: string;
	description?: string;
	options: RadioOption[];
	value: string;
	onChange: (value: string) => void;
	name: string;
	variant?: "card" | "inline";
}

export function RadioGroup({
	label,
	description,
	options,
	value,
	onChange,
	name,
	variant = "card",
}: RadioGroupProps) {
	// Inline variant
	if (variant === "inline") {
		return (
			<div className={styles.wrapper}>
				{label && (
					<label>
						<span className={styles.label}>{label}</span>
						{description && (
							<span className={styles.description}>{description}</span>
						)}
					</label>
				)}
				<div className={styles.inline}>
					{options.map((option) => (
						<div key={option.value} className={styles["inline-item"]}>
							<Radio
								id={`${name}-${option.value}`}
								name={name}
								value={option.value}
								checked={value === option.value}
								onChange={(e) => onChange(e.target.value)}
								disabled={option.disabled}
							/>
							<label
								htmlFor={`${name}-${option.value}`}
								className={styles["inline-label"]}
							>
								{option.label}
							</label>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Card variant (uses RadioCard component for consistency)
	return (
		<div className={styles.wrapper}>
			{label && (
				<label>
					<span className={styles.label}>{label}</span>
					{description && (
						<span className={styles.description}>{description}</span>
					)}
				</label>
			)}
			<div className={styles.vertical}>
				{options.map((option) => (
					<RadioCard
						key={option.value}
						id={`${name}-${option.value}`}
						name={name}
						value={option.value}
						checked={value === option.value}
						onChange={onChange}
						title={option.label}
						description={option.description}
						icon={option.icon}
						badge={option.badge}
						disabled={option.disabled}
					/>
				))}
			</div>
		</div>
	);
}
