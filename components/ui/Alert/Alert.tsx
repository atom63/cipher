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
	info: <Info size={16} />,
	success: <CheckCircle size={16} />,
	warning: <AlertTriangle size={16} />,
	error: <AlertCircle size={16} />,
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
		>
			{showIcon && <div className={styles.alertIcon}>{displayIcon}</div>}
			<div className={styles.alertContent}>
				{title && <div className={styles.alertTitle}>{title}</div>}
				<div className={styles.alertDescription}>{children}</div>
			</div>
		</div>
	);
}
