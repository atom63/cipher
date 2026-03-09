import { Radio } from "./Radio";
import styles from "./RadioWithLabel.module.css";

interface RadioWithLabelProps {
	checked?: boolean;
	disabled?: boolean;
	id: string;
	label: string;
	name: string;
	onChange: (value: string) => void;
	value: string;
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
				checked={checked}
				disabled={disabled}
				id={id}
				name={name}
				onChange={(e) => onChange(e.target.value)}
				value={value}
			/>
			<label className={styles["label"]}htmlFor={id} >
				{label}
			</label>
		</div>
	);
}
