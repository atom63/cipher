import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "../Button";
import styles from "./Dialog.module.css";

export interface DialogProps {
	/** Dialog content */
	children: ReactNode;
	className?: string;
	/** Close on Escape key (default: true) */
	closeOnEscape?: boolean;
	/** Close on overlay click (default: true) */
	closeOnOverlayClick?: boolean;
	/** Footer content (usually actions) */
	footer?: ReactNode;
	/** Whether dialog is open */
	isOpen: boolean;
	/** Max width variant */
	maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
	/** Remove content padding for full-bleed layouts like tables */
	noPadding?: boolean;
	/** Called when dialog should close */
	onClose: () => void;
	/** Show close button (default: true) */
	showCloseButton?: boolean;
	/** Dialog title */
	title: string;
	/** Visual variant for special dialogs */
	variant?: "default" | "danger" | "success";
}

export function Dialog({
	isOpen,
	onClose,
	title,
	children,
	footer,
	maxWidth = "md",
	variant = "default",
	closeOnOverlayClick = true,
	closeOnEscape = true,
	showCloseButton = true,
	noPadding = false,
	className = "",
}: DialogProps) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	// Stable refs for callbacks to avoid effect re-runs
	const onCloseRef = useRef(onClose);
	const closeOnEscapeRef = useRef(closeOnEscape);
	onCloseRef.current = onClose;
	closeOnEscapeRef.current = closeOnEscape;

	// Add/remove listeners + focus management
	useEffect(() => {
		if (!isOpen) return;

		previousFocusRef.current = document.activeElement as HTMLElement;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && closeOnEscapeRef.current) {
				onCloseRef.current();
			}
		};

		const handleFocusTrap = (e: KeyboardEvent) => {
			if (e.key !== "Tab" || !dialogRef.current) return;

			const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
			);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable.at(-1);

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", handleEscape);
		document.addEventListener("keydown", handleFocusTrap);
		document.body.style.overflow = "hidden";

		// Focus the first focusable element on open
		requestAnimationFrame(() => {
			const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
				"button:not([disabled]), [href], input:not([disabled])",
			);
			firstFocusable?.focus();
		});

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.removeEventListener("keydown", handleFocusTrap);
			document.body.style.overflow = "";
			previousFocusRef.current?.focus();
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const handleOverlayClick = () => {
		if (closeOnOverlayClick) {
			onClose();
		}
	};

	return (
		<div
			aria-labelledby="dialog-title"
			aria-modal="true"
			className={styles.overlay}
			onClick={handleOverlayClick}
			role="dialog"
		>
			<div
				className={`${styles.dialog} ${styles[`maxWidth-${maxWidth}`]} ${className}`}
				data-variant={variant !== "default" ? variant : undefined}
				onClick={(e) => e.stopPropagation()}
				ref={dialogRef}
			>
				<div className={styles.header}>
					<h3 id="dialog-title">{title}</h3>
					{showCloseButton && (
						<button
							aria-label="Close dialog"
							className={styles.closeButton}
							onClick={onClose}
							type="button"
						>
							<X aria-hidden="true" size={18} />
						</button>
					)}
				</div>
				<div
					className={`${styles.content} ${noPadding ? styles.noPadding : ""}`}
				>
					{children}
				</div>
				{footer && <div className={styles.footer}>{footer}</div>}
			</div>
		</div>
	);
}

// ============================================================================
// DIALOG ACTIONS
// ============================================================================

export interface DialogActionsProps {
	align?: "left" | "center" | "right" | "between";
	children: ReactNode;
	className?: string;
}

export function DialogActions({
	children,
	align = "right",
	className = "",
}: DialogActionsProps) {
	return (
		<div
			className={`${styles.actions} ${styles[`align-${align}`]} ${className}`}
		>
			{children}
		</div>
	);
}

// ============================================================================
// CONFIRM DIALOG - Preset for confirmations
// ============================================================================

export interface ConfirmDialogProps {
	cancelText?: string;
	confirmText?: string;
	isOpen: boolean;
	loading?: boolean;
	message: string;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	variant?: "default" | "danger";
}

export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	variant = "default",
	loading = false,
}: ConfirmDialogProps) {
	return (
		<Dialog
			footer={
				<DialogActions>
					<Button disabled={loading}onClick={onClose} variant="outline" >
						{cancelText}
					</Button>
					<Button
						loading={loading}
						onClick={onConfirm}
						variant={variant === "danger" ? "destructive" : "primary"}
					>
						{confirmText}
					</Button>
				</DialogActions>
			}
			isOpen={isOpen}
			maxWidth="sm"
			onClose={onClose}
			title={title}
			variant={variant}
		>
			<p style={{ margin: 0, color: "var(--muted-foreground)" }}>{message}</p>
		</Dialog>
	);
}
