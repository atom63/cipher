import { forwardRef } from "react";
import styles from "./PageLayout.module.css";

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
	function PageLayout({ className = "", ...props }, ref) {
		return (
			<div
				className={`${styles.page} ${className}`}
				ref={ref}
				{...props}
			/>
		);
	},
);

interface PageBodyProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export const PageBody = forwardRef<HTMLDivElement, PageBodyProps>(
	function PageBody({ className = "", ...props }, ref) {
		return (
			<div
				className={`${styles.body} ${className}`}
				ref={ref}
				{...props}
			/>
		);
	},
);

interface PageFooterProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export const PageFooter = forwardRef<HTMLDivElement, PageFooterProps>(
	function PageFooter({ className = "", ...props }, ref) {
		return (
			<div
				className={`${styles.footer} ${className}`}
				ref={ref}
				{...props}
			/>
		);
	},
);
