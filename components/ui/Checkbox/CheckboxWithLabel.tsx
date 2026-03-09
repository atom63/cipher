import { Checkbox } from "./Checkbox";
import styles from "./CheckboxWithLabel.module.css";

interface CheckboxWithLabelProps {
	checked: boolean;
	disabled?: boolean;
	id: string;
	label: string;
	onChange: (checked: boolean) => void;
}

export function CheckboxWithLabel({
	id,
	label,
	checked,
	onChange,
	disabled = false,
}: CheckboxWithLabelProps) {
	return (
		<div className={styles["wrapper"]}>
			<Checkbox
				checked={checked}
				disabled={disabled}
				id={id}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<label className={styles["label"]}htmlFor={id} >
				{label}
			</label>
		</div>
	);
}
