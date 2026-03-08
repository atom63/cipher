import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
	value: string;
	label: string;
	icon?: ReactNode;
	disabled?: boolean;
	danger?: boolean;
	onClick?: () => void;
}

export interface DropdownProps {
	trigger: ReactNode | ((isOpen: boolean) => ReactNode);
	options: DropdownOption[];
	align?: "left" | "right" | "center";
	width?: "auto" | "trigger" | number;
	disabled?: boolean;
	onSelect?: (value: string) => void;
	className?: string;
	variant?: "primary" | "secondary" | "ghost";
	size?: "sm" | "md" | "lg";
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

	const handleSelect = (option: DropdownOption) => {
		if (!option.disabled) {
			option.onClick?.();
			onSelect?.(option.value);
			setIsOpen(false);
			triggerRef.current?.focus();
		}
	};

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
	}, [isOpen, activeIndex, options]);

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
		<div ref={dropdownRef} className={`${styles.dropdown} ${className}`}>
			<Button
				ref={triggerRef}
				onClick={handleToggle}
				disabled={disabled}
				variant={variant}
				size={size}
				className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
				aria-haspopup="menu"
				aria-expanded={isOpen}
			>
				{typeof trigger === "function" ? trigger(isOpen) : trigger}
			</Button>

			{isOpen && (
				<div
					className={`${styles.menu} ${styles[`align-${align}`]}`}
					style={{ width: getMenuWidth() }}
					role="menu"
					aria-orientation="vertical"
					aria-activedescendant={
						activeIndex >= 0
							? `menuitem-${options[activeIndex]?.value}`
							: undefined
					}
				>
					<ul className={styles.menuList}>
						{options.map((option, index) => (
							<li key={option.value} role="none">
								<button
									type="button"
									role="menuitem"
									id={`menuitem-${option.value}`}
									disabled={option.disabled}
									onClick={() => handleSelect(option)}
									data-active={index === activeIndex || undefined}
									className={`${styles.menuItem} ${
										option.disabled ? styles.menuItemDisabled : ""
									} ${option.danger ? styles.menuItemDanger : ""}`}
								>
									{option.icon && (
										<span className={styles.menuItemIcon} aria-hidden="true">{option.icon}</span>
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
