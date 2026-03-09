import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
	/** Action button/element */
	action?: ReactNode;
	/** Additional content */
	children?: ReactNode;
	className?: string;
	/** Description text */
	description?: string;
	/** Icon element to display */
	icon?: ReactNode;
	/** Illustration SVG/image (alternative to icon) */
	illustration?: ReactNode;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	/** Main title text */
	title?: string;
	/** Visual variant */
	variant?: "default" | "bordered" | "compact";
}

export function EmptyState({
	icon,
	illustration,
	title,
	description,
	action,
	children,
	size = "md",
	variant = "default",
	className = "",
}: EmptyStateProps) {
	const variantClass = variant !== "default" ? styles[variant] : "";

	return (
		<div
			className={`${styles.emptyState} ${variantClass} ${className}`}
			data-size={size}
		>
			{illustration && (
				<div className={styles.illustration}>{illustration}</div>
			)}
			{icon && !illustration && <div className={styles.icon}>{icon}</div>}
			{title && <h3 className={styles.title}>{title}</h3>}
			{description && <p className={styles.description}>{description}</p>}
			{action && <div className={styles.action}>{action}</div>}
			{children}
		</div>
	);
}
