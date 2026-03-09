import type React from "react";
import { forwardRef } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	loading?: boolean;
	size?: "sm" | "md" | "lg" | "icon-xs" | "icon-sm" | "icon" | "icon-lg";
	variant?:
		| "default"
		| "primary"
		| "secondary"
		| "ghost"
		| "destructive"
		| "destructive-ghost"
		| "destructive-soft"
		| "outline"
		| "link"
		| "soft";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	function Button(
		{
			variant = "default",
			size = "md",
			loading = false,
			className = "",
			children,
			disabled,
			...props
		},
		ref,
	) {
		const baseStyles = styles.button;
		const variantStyles = {
			default: styles.default,
			primary: styles.primary,
			secondary: styles.secondary,
			ghost: styles.ghost,
			destructive: styles.destructive,
			"destructive-ghost": styles.destructiveGhost,
			"destructive-soft": styles.destructiveSoft,
			outline: styles.outline,
			link: styles.link,
			soft: styles.soft,
		};
		const sizeStyles = {
			sm: styles.sm,
			md: styles.md,
			lg: styles.lg,
			"icon-xs": styles.iconXs,
			"icon-sm": styles.iconSm,
			icon: styles.icon,
			"icon-lg": styles.iconLg,
		};

		const classes = [
			baseStyles,
			variantStyles[variant],
			sizeStyles[size],
			loading ? styles.loading : "",
			className,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<button
				aria-busy={loading || undefined}
				className={classes}
				data-loading={loading || undefined}
				disabled={disabled || loading}
				ref={ref}
				type="button"
				{...props}
			>
				{loading ? (
					<span className={styles.loadingContent}>{children}</span>
				) : (
					children
				)}
			</button>
		);
	},
);
