import { Checkbox } from "./Checkbox";
import styles from "./CheckboxWithDescription.module.css";

interface CheckboxWithDescriptionProps {
	checked: boolean;
	description?: string;
	disabled?: boolean;
	id: string;
	label: string;
	onChange: (checked: boolean) => void;
}

export function CheckboxWithDescription({
	id,
	label,
	description,
	checked,
	onChange,
	disabled = false,
}: CheckboxWithDescriptionProps) {
	return (
		<div className={styles.wrapper}>
			<div className={styles.checkboxContainer}>
				<Checkbox
					aria-describedby={description ? `${id}-description` : undefined}
					checked={checked}
					disabled={disabled}
					id={id}
					onChange={(e) => onChange(e.target.checked)}
				/>
			</div>
			<div className={styles.content}>
				<label className={styles.label}htmlFor={id} >
					{label}
				</label>
				{description && (
					<p className={styles.description}id={`${id}-description`} >
						{description}
					</p>
				)}
			</div>
		</div>
	);
}
