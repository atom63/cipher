import { Radio } from "./Radio";
import styles from "./RadioWithHelper.module.css";

interface RadioWithHelperProps {
	id: string;
	name: string;
	value: string;
	checked?: boolean;
	onChange: (value: string) => void;
	label: string;
	helper?: string;
	disabled?: boolean;
}

export function RadioWithHelper({
	id,
	name,
	value,
	checked = false,
	onChange,
	label,
	helper,
	disabled = false,
}: RadioWithHelperProps) {
	return (
		<div className={styles["wrapper"]}>
			<Radio
				id={id}
				name={name}
				value={value}
				checked={checked}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className={helper ? styles["radio-align"] : ""}
			/>
			<div className={styles["content"]}>
				<label htmlFor={id} className={styles["label"]}>
					{label}
				</label>
				{helper && <span className={styles["helper"]}>{helper}</span>}
			</div>
		</div>
	);
}
