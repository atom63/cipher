import { Minus, Plus } from "lucide-react";
import { forwardRef, useCallback, useRef } from "react";
import styles from "./NumberField.module.css";

interface NumberFieldProps {
	value: number;
	onChange: (value: number) => void;
	onBlur?: () => void;
	min?: number;
	max?: number;
	step?: number;
	size?: "sm" | "md";
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	id?: string;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
	function NumberField(
		{
			value,
			onChange,
			onBlur,
			min,
			max,
			step = 1,
			size = "md",
			disabled = false,
			placeholder,
			className = "",
			id,
		},
		ref,
	) {
		const inputRef = useRef<HTMLInputElement | null>(null);

		const clamp = useCallback(
			(v: number) => {
				if (min !== undefined && v < min) return min;
				if (max !== undefined && v > max) return max;
				return v;
			},
			[min, max],
		);

		const increment = useCallback(() => {
			onChange(clamp(value + step));
		}, [value, step, onChange, clamp]);

		const decrement = useCallback(() => {
			onChange(clamp(value - step));
		}, [value, step, onChange, clamp]);

		const handleInputChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const raw = e.target.value;
				if (raw === "" || raw === "-") return;
				const v = Number(raw);
				if (!Number.isNaN(v)) {
					onChange(v);
				}
			},
			[onChange],
		);

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent) => {
				if (e.key === "ArrowUp") {
					e.preventDefault();
					increment();
				} else if (e.key === "ArrowDown") {
					e.preventDefault();
					decrement();
				}
			},
			[increment, decrement],
		);

		const groupClasses = [
			styles.group,
			size === "sm" ? styles.sm : "",
			className,
		]
			.filter(Boolean)
			.join(" ");

		const atMin = min !== undefined && value <= min;
		const atMax = max !== undefined && value >= max;

		return (
			<div className={groupClasses} data-disabled={disabled || undefined}>
				<button
					type="button"
					className={`${styles.button} ${styles.decrement}`}
					onClick={decrement}
					disabled={disabled || atMin}
					tabIndex={-1}
					aria-label="Decrease"
				>
					<Minus />
				</button>
				<input
					ref={(node) => {
						inputRef.current = node;
						if (typeof ref === "function") ref(node);
						else if (ref) ref.current = node;
					}}
					id={id}
					type="number"
					className={styles.input}
					value={value}
					onChange={handleInputChange}
					onBlur={onBlur}
					onKeyDown={handleKeyDown}
					min={min}
					max={max}
					step={step}
					disabled={disabled}
					placeholder={placeholder}
					autoComplete="off"
				/>
				<button
					type="button"
					className={`${styles.button} ${styles.increment}`}
					onClick={increment}
					disabled={disabled || atMax}
					tabIndex={-1}
					aria-label="Increase"
				>
					<Plus />
				</button>
			</div>
		);
	},
);
