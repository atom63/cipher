import type { ReactNode } from "react";
import styles from "./Spinner.module.css";

// ============================================================================
// SPINNER
// ============================================================================

export interface SpinnerProps {
	className?: string;
	size?: "sm" | "md" | "lg" | "xl";
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
	return (
		<output
			aria-label="Loading"
			className={`${styles.spinner} ${styles[size]} ${className}`}
		/>
	);
}

// ============================================================================
// LOADING STATE
// ============================================================================

export interface LoadingStateProps {
	children?: ReactNode;
	hint?: string;
	message?: string;
	size?: "sm" | "md" | "lg";
}

export function LoadingState({
	message,
	hint,
	size = "md",
	children,
}: LoadingStateProps) {
	return (
		<div className={styles.loadingState}>
			{children || <Spinner size={size} />}
			{message && <p className={styles.message}>{message}</p>}
			{hint && <p className={styles.hint}>{hint}</p>}
		</div>
	);
}
