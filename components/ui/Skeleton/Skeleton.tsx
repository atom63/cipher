import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

// ============================================================================
// SKELETON BASE
// ============================================================================

export interface SkeletonProps {
	/** Width of skeleton (number = px, string = any CSS value) */
	width?: number | string;
	/** Height of skeleton (number = px, string = any CSS value) */
	height?: number | string;
	/** Border radius variant */
	radius?: "none" | "sm" | "md" | "lg" | "full";
	/** Animation style */
	animation?: "pulse" | "shimmer" | "none";
	className?: string;
}

export function Skeleton({
	width,
	height,
	radius = "md",
	animation = "shimmer",
	className = "",
}: SkeletonProps) {
	const style: CSSProperties = {
		width: typeof width === "number" ? `${width}px` : width,
		height: typeof height === "number" ? `${height}px` : height,
	};

	return (
		<div
			className={`${styles.skeleton} ${styles[radius]} ${styles[animation]} ${className}`}
			style={style}
			aria-hidden="true"
		/>
	);
}

