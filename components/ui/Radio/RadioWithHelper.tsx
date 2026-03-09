import { Radio } from "./Radio";
import styles from "./RadioWithHelper.module.css";

interface RadioWithHelperProps {
	checked?: boolean;
	disabled?: boolean;
	helper?: string;
	id: string;
	label: string;
	name: string;
	onChange: (value: string) => void;
	value: string;
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
				checked={checked}
				className={helper ? styles["radio-align"] : ""}
				disabled={disabled}
				id={id}
				name={name}
				onChange={(e) => onChange(e.target.value)}
				value={value}
			/>
			<div className={styles["content"]}>
				<label className={styles["label"]}htmlFor={id} >
					{label}
				</label>
				{helper && <span className={styles["helper"]}>{helper}</span>}
			</div>
		</div>
	);
}
