import type React from "react";
import { forwardRef } from "react";
import styles from "./ScrollArea.module.css";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Scroll direction */
	orientation?: "vertical" | "horizontal" | "both";
	/** Fade edges when content overflows */
	scrollFade?: boolean;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
	function ScrollArea(
		{
			className = "",
			orientation = "vertical",
			scrollFade = false,
			children,
			...props
		},
		ref,
	) {
		const orientationClass =
			orientation === "horizontal"
				? styles.horizontal
				: orientation === "both"
					? styles.both
					: styles.vertical;

		return (
			<div
				className={`${styles.root} ${orientationClass} ${scrollFade ? styles.fade : ""} ${className}`}
				ref={ref}
				{...props}
			>
				{children}
			</div>
		);
	},
);
