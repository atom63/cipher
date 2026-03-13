import { Minus, Plus } from "lucide-react";
import { forwardRef, useCallback, useRef } from "react";
import styles from "./NumberField.module.css";

interface NumberFieldProps {
	className?: string;
	disabled?: boolean;
	id?: string;
	max?: number;
	min?: number;
	onBlur?: () => void;
	onChange: (value: number) => void;
	placeholder?: string;
	size?: "sm" | "md";
	step?: number;
	value: number;
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
					aria-label="Decrease"
					className={`${styles.button} ${styles.decrement}`}
					disabled={disabled || atMin}
					onClick={decrement}
					tabIndex={-1}
					type="button"
				>
					<Minus />
				</button>
				<input
					autoComplete="off"
					className={styles.input}
					disabled={disabled}
					id={id}
					max={max}
					min={min}
					onBlur={onBlur}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					ref={(node) => {
						inputRef.current = node;
						if (typeof ref === "function") ref(node);
						else if (ref) ref.current = node;
					}}
					step={step}
					type="number"
					value={value}
				/>
				<button
					aria-label="Increase"
					className={`${styles.button} ${styles.increment}`}
					disabled={disabled || atMax}
					onClick={increment}
					tabIndex={-1}
					type="button"
				>
					<Plus />
				</button>
			</div>
		);
	},
);
