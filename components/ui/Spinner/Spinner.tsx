import type { ReactNode } from "react";
import styles from "./Spinner.module.css";

// ============================================================================
// SPINNER
// ============================================================================

export interface SpinnerProps {
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
	return (
		<output
			className={`${styles.spinner} ${styles[size]} ${className}`}
			aria-label="Loading"
		/>
	);
}

// ============================================================================
// LOADING STATE
// ============================================================================

export interface LoadingStateProps {
	message?: string;
	hint?: string;
	size?: "sm" | "md" | "lg";
	children?: ReactNode;
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

