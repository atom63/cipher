import { X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export interface BadgeProps {
	children: ReactNode;
	className?: string;
	/** Show dot indicator */
	dot?: boolean;
	/** Animate the dot (pulse effect, limited to 3 cycles) */
	dotAnimated?: boolean;
	/** Dot color (defaults to variant color) */
	dotColor?: string;
	/** Icon before text */
	icon?: ReactNode;
	/** Called when remove button clicked */
	onRemove?: () => void;
	/** Pill shape (fully rounded) */
	pill?: boolean;
	/** Make badge removable */
	removable?: boolean;
	/** Size */
	size?: "sm" | "md" | "lg";
	/** Color variant */
	variant?:
		| "default"
		| "secondary"
		| "destructive"
		| "success"
		| "warning"
		| "info"
		| "outline";
}

export function Badge({
	children,
	variant = "default",
	size = "md",
	pill = false,
	dot = false,
	dotAnimated = false,
	dotColor,
	removable = false,
	onRemove,
	icon,
	className = "",
}: BadgeProps) {
	const variantClass = styles[variant];
	const pillClass = pill ? styles.pill : "";

	return (
		<span
			className={`${styles.badge} ${variantClass} ${styles[size]} ${pillClass} ${className}`}
		>
			{dot && (
				<span
					aria-hidden="true"
					className={`${styles.dot} ${dotAnimated ? styles.dotAnimated : ""}`}
					style={dotColor ? { backgroundColor: dotColor } : undefined}
				/>
			)}
			{icon && (
				<span aria-hidden="true"className={styles.icon} >
					{icon}
				</span>
			)}
			<span className={styles.text}>{children}</span>
			{removable && (
				<button
					aria-label={`Remove ${typeof children === "string" ? children : ""}`}
					className={styles.removeButton}
					onClick={(e) => {
						e.stopPropagation();
						onRemove?.();
					}}
					type="button"
				>
					<X size={12} />
				</button>
			)}
		</span>
	);
}

// ============================================================================
// STATUS BADGE - Preset for common status indicators
// ============================================================================

export type StatusType =
	| "online"
	| "offline"
	| "busy"
	| "away"
	| "pending"
	| "active"
	| "inactive";

const statusConfig: Record<
	StatusType,
	{ variant: BadgeProps["variant"]; label: string; animated?: boolean }
> = {
	online: { variant: "success", label: "Online", animated: true },
	offline: { variant: "secondary", label: "Offline" },
	busy: { variant: "destructive", label: "Busy" },
	away: { variant: "warning", label: "Away" },
	pending: { variant: "warning", label: "Pending", animated: true },
	active: { variant: "success", label: "Active", animated: true },
	inactive: { variant: "secondary", label: "Inactive" },
};

export function StatusBadge({
	status,
	showDot = true,
	className = "",
}: {
	status: StatusType;
	showDot?: boolean;
	className?: string;
}) {
	const config = statusConfig[status];
	return (
		<Badge
			className={className}
			dot={showDot}
			dotAnimated={config.animated}
			pill
			size="sm"
			variant={config.variant}
		>
			{config.label}
		</Badge>
	);
}

// ============================================================================
// COUNT BADGE - For notification counts
// ============================================================================

export function CountBadge({
	count,
	max = 99,
	variant = "destructive",
	className = "",
}: {
	count: number;
	max?: number;
	variant?: BadgeProps["variant"];
	className?: string;
}) {
	const displayCount = count > max ? `${max}+` : String(count);

	if (count <= 0) return null;

	return (
		<Badge
			className={`${styles.countBadge} ${className}`}
			pill
			size="sm"
			variant={variant}
		>
			{displayCount}
		</Badge>
	);
}
