import type React from "react";
import { Radio, RadioCard } from "../Radio";
import styles from "./RadioGroup.module.css";

export interface RadioOption {
	badge?: string; // Optional badge for card variant
	description?: string;
	disabled?: boolean; // Optional disabled state
	icon?: React.ReactNode; // Optional icon for card variant
	label: string;
	value: string;
}

interface RadioGroupProps {
	description?: string;
	label?: string;
	name: string;
	onChange: (value: string) => void;
	options: RadioOption[];
	value: string;
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
						<div className={styles["inline-item"]}key={option.value} >
							<Radio
								checked={value === option.value}
								disabled={option.disabled}
								id={`${name}-${option.value}`}
								name={name}
								onChange={(e) => onChange(e.target.value)}
								value={option.value}
							/>
							<label
								className={styles["inline-label"]}
								htmlFor={`${name}-${option.value}`}
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
						badge={option.badge}
						checked={value === option.value}
						description={option.description}
						disabled={option.disabled}
						icon={option.icon}
						id={`${name}-${option.value}`}
						key={option.value}
						name={name}
						onChange={onChange}
						title={option.label}
						value={option.value}
					/>
				))}
			</div>
		</div>
	);
}
