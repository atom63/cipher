import type React from "react";
import { forwardRef } from "react";
import styles from "./Separator.module.css";

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
	orientation?: "horizontal" | "vertical";
}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(
	function Separator(
		{ orientation = "horizontal", className = "", ...props },
		ref,
	) {
		return (
			<hr
				aria-orientation={
					orientation === "vertical" ? orientation : undefined
				}
				className={`${styles.separator} ${styles[orientation]} ${className}`}
				ref={ref}
				{...props}
			/>
		);
	},
);
