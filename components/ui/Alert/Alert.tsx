import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Alert.module.css";

export interface AlertProps {
	children: ReactNode;
	className?: string;
	icon?: ReactNode;
	showIcon?: boolean;
	title?: string;
	variant?: "info" | "success" | "warning" | "error";
}

const defaultIcons = {
	info: <Info aria-hidden="true" size={16} />,
	success: <CheckCircle aria-hidden="true" size={16} />,
	warning: <AlertTriangle aria-hidden="true" size={16} />,
	error: <AlertCircle aria-hidden="true" size={16} />,
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
			aria-live={
				variant === "error" || variant === "warning" ? "assertive" : "polite"
			}
			className={`${styles.alert} ${variantClass} ${className}`}
			role="alert"
		>
			{showIcon && <div className={styles.alertIcon}>{displayIcon}</div>}
			<div className={styles.alertContent}>
				{title && <div className={styles.alertTitle}>{title}</div>}
				<div className={styles.alertDescription}>{children}</div>
			</div>
		</div>
	);
}
