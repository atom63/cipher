import type React from "react";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
	action?: React.ReactNode;
	description?: string;
	title: string;
	variant?: "primary" | "secondary";
}

export function SectionHeader({
	title,
	description,
	action,
	variant = "primary",
}: SectionHeaderProps) {
	return (
		<div className={`${styles.header} ${styles[variant]}`}>
			<div className={styles.content}>
				<h2 className={styles.title}>{title}</h2>
				{description && <p className={styles.description}>{description}</p>}
			</div>
			{action && <div className={styles.action}>{action}</div>}
		</div>
	);
}
