import { Radio } from "./Radio";
import styles from "./RadioWithLabel.module.css";

interface RadioWithLabelProps {
	id: string;
	name: string;
	value: string;
	checked?: boolean;
	onChange: (value: string) => void;
	label: string;
	disabled?: boolean;
}

export function RadioWithLabel({
	id,
	name,
	value,
	checked = false,
	onChange,
	label,
	disabled = false,
}: RadioWithLabelProps) {
	return (
		<div className={styles["wrapper"]}>
			<Radio
				id={id}
				name={name}
				value={value}
				checked={checked}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
			/>
			<label htmlFor={id} className={styles["label"]}>
				{label}
			</label>
		</div>
	);
}
