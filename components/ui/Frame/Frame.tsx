import type React from "react";
import { forwardRef } from "react";
import styles from "./Frame.module.css";

export const Frame = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function Frame({ className = "", ...props }, ref) {
	return (
		<div
			className={`${styles.frame} ${className}`}
			ref={ref}
			{...props}
		/>
	);
});

export const FramePanel = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function FramePanel({ className = "", ...props }, ref) {
	return (
		<div
			className={`${styles.panel} ${className}`}
			ref={ref}
			{...props}
		/>
	);
});

export const FrameHeader = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function FrameHeader({ className = "", ...props }, ref) {
	return (
		<div
			className={`${styles.header} ${className}`}
			ref={ref}
			{...props}
		/>
	);
});

export const FrameFooter = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(function FrameFooter({ className = "", ...props }, ref) {
	return (
		<div
			className={`${styles.footer} ${className}`}
			ref={ref}
			{...props}
		/>
	);
});
