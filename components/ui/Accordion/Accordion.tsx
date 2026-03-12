import { ChevronRight } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import styles from "./Accordion.module.css";

/* --- Accordion Root --- */

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	variant?: "default" | "flat";
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
	function Accordion({ className = "", variant = "default", ...props }, ref) {
		return (
			<div
				className={`${styles.accordion} ${className}`}
				data-variant={variant}
				ref={ref}
				role="presentation"
				{...props}
			/>
		);
	},
);

/* --- Accordion Item --- */

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	expanded?: boolean;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
	function AccordionItem({ className = "", expanded, ...props }, ref) {
		return (
			<div
				className={`${styles.item} ${className}`}
				data-expanded={expanded || undefined}
				ref={ref}
				{...props}
			/>
		);
	},
);

/* --- Accordion Trigger --- */

interface AccordionTriggerProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	expanded?: boolean;
}

export const AccordionTrigger = forwardRef<
	HTMLButtonElement,
	AccordionTriggerProps
>(function AccordionTrigger(
	{ className = "", expanded, children, ...props },
	ref,
) {
	return (
		<button
			aria-expanded={expanded}
			className={`${styles.trigger} ${className}`}
			data-expanded={expanded || undefined}
			ref={ref}
			type="button"
			{...props}
		>
			<ChevronRight
				className={styles.chevron}
				data-expanded={expanded || undefined}
				size={14}
			/>
			{children}
		</button>
	);
});

/* --- Accordion Panel --- */

interface AccordionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	expanded?: boolean;
}

export const AccordionPanel = forwardRef<HTMLDivElement, AccordionPanelProps>(
	function AccordionPanel({ className = "", expanded, children, ...props }, ref) {
		return (
			<div
				className={`${styles.panel} ${className}`}
				data-expanded={expanded || undefined}
				ref={ref}
				role="region"
				{...props}
			>
				<div className={styles.panelInner}>{children}</div>
			</div>
		);
	},
);
