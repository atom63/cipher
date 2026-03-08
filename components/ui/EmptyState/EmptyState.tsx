import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
	/** Icon element to display */
	icon?: ReactNode;
	/** Illustration SVG/image (alternative to icon) */
	illustration?: ReactNode;
	/** Main title text */
	title?: string;
	/** Description text */
	description?: string;
	/** Action button/element */
	action?: ReactNode;
	/** Additional content */
	children?: ReactNode;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	/** Visual variant */
	variant?: "default" | "bordered" | "compact";
	className?: string;
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

