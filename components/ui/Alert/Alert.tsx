import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Alert.module.css";

export interface AlertProps {
	children: ReactNode;
	variant?: "info" | "success" | "warning" | "error";
	title?: string;
	icon?: ReactNode;
	showIcon?: boolean;
	className?: string;
}

const defaultIcons = {
	info: <Info size={16} aria-hidden="true" />,
	success: <CheckCircle size={16} aria-hidden="true" />,
	warning: <AlertTriangle size={16} aria-hidden="true" />,
	error: <AlertCircle size={16} aria-hidden="true" />,
};

export function Alert({
	children,
	variant = "info",
	title,
	icon,
	showIcon = true,
	className = "",
}: AlertProps) {
	const variantClass = styles[variant];
	const displayIcon = icon || defaultIcons[variant];

	return (
		<div
			className={`${styles.alert} ${variantClass} ${className}`}
			role="alert"
			aria-live={variant === "error" || variant === "warning" ? "assertive" : "polite"}
		>
			{showIcon && <div className={styles.alertIcon}>{displayIcon}</div>}
			<div className={styles.alertContent}>
				{title && <div className={styles.alertTitle}>{title}</div>}
				<div className={styles.alertDescription}>{children}</div>
			</div>
		</div>
	);
}
