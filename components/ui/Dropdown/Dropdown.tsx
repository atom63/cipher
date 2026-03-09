import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Button } from "../Button";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
	danger?: boolean;
	disabled?: boolean;
	icon?: ReactNode;
	label: string;
	onClick?: () => void;
	value: string;
}

export interface DropdownProps {
	align?: "left" | "right" | "center";
	className?: string;
	disabled?: boolean;
	onSelect?: (value: string) => void;
	options: DropdownOption[];
	size?: "sm" | "md" | "lg";
	trigger: ReactNode | ((isOpen: boolean) => ReactNode);
	variant?: "primary" | "secondary" | "ghost";
	width?: "auto" | "trigger" | number;
}

export function Dropdown({
	trigger,
	options,
	align = "left",
	width = "auto",
	disabled = false,
	onSelect,
	className = "",
	variant = "secondary",
	size = "md",
}: DropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Close on Escape key
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isOpen) {
				setIsOpen(false);
				triggerRef.current?.focus();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	const [activeIndex, setActiveIndex] = useState(-1);

	const handleToggle = () => {
		if (!disabled) {
			setIsOpen(!isOpen);
			if (!isOpen) setActiveIndex(-1);
		}
	};

	const handleSelect = useCallback(
		(option: DropdownOption) => {
			if (!option.disabled) {
				option.onClick?.();
				onSelect?.(option.value);
				setIsOpen(false);
				triggerRef.current?.focus();
			}
		},
		[onSelect],
	);

	// Arrow key navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			const enabledOptions = options.filter((o) => !o.disabled);
			if (enabledOptions.length === 0) return;

			switch (e.key) {
				case "ArrowDown": {
					e.preventDefault();
					setActiveIndex((prev) => {
						const next = prev + 1;
						return next >= options.length ? 0 : next;
					});
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					setActiveIndex((prev) => {
						const next = prev - 1;
						return next < 0 ? options.length - 1 : next;
					});
					break;
				}
				case "Home": {
					e.preventDefault();
					setActiveIndex(0);
					break;
				}
				case "End": {
					e.preventDefault();
					setActiveIndex(options.length - 1);
					break;
				}
				case "Enter":
				case " ": {
					e.preventDefault();
					if (activeIndex >= 0 && activeIndex < options.length) {
						handleSelect(options[activeIndex]);
					}
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, activeIndex, options, handleSelect]);

	const getMenuWidth = () => {
		if (width === "auto") {
			return "auto";
		}
		if (width === "trigger" && triggerRef.current) {
			return `${triggerRef.current.offsetWidth}px`;
		}
		if (typeof width === "number") {
			return `${width}px`;
		}
		return "auto";
	};

	return (
		<div className={`${styles.dropdown} ${className}`}ref={dropdownRef} >
			<Button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
				disabled={disabled}
				onClick={handleToggle}
				ref={triggerRef}
				size={size}
				variant={variant}
			>
				{typeof trigger === "function" ? trigger(isOpen) : trigger}
			</Button>

			{isOpen && (
				<div
					aria-activedescendant={
						activeIndex >= 0
							? `menuitem-${options[activeIndex]?.value}`
							: undefined
					}
					aria-orientation="vertical"
					className={`${styles.menu} ${styles[`align-${align}`]}`}
					role="menu"
					style={{ width: getMenuWidth() }}
					tabIndex={-1}
				>
					<ul className={styles.menuList}>
						{options.map((option, index) => (
							<li key={option.value} role="none">
								<button
									className={`${styles.menuItem} ${
										option.disabled ? styles.menuItemDisabled : ""
									} ${option.danger ? styles.menuItemDanger : ""}`}
									data-active={index === activeIndex || undefined}
									disabled={option.disabled}
									id={`menuitem-${option.value}`}
									onClick={() => handleSelect(option)}
									role="menuitem"
									type="button"
								>
									{option.icon && (
										<span aria-hidden="true"className={styles.menuItemIcon} >
											{option.icon}
										</span>
									)}
									<span className={styles.menuItemLabel}>{option.label}</span>
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
