import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "../Button";
import styles from "./Dialog.module.css";

export interface DialogProps {
	/** Whether dialog is open */
	isOpen: boolean;
	/** Called when dialog should close */
	onClose: () => void;
	/** Dialog title */
	title: string;
	/** Dialog content */
	children: ReactNode;
	/** Footer content (usually actions) */
	footer?: ReactNode;
	/** Max width variant */
	maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
	/** Visual variant for special dialogs */
	variant?: "default" | "danger" | "success";
	/** Close on overlay click (default: true) */
	closeOnOverlayClick?: boolean;
	/** Close on Escape key (default: true) */
	closeOnEscape?: boolean;
	/** Show close button (default: true) */
	showCloseButton?: boolean;
	className?: string;
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
			const last = focusable[focusable.length - 1];

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
				'button:not([disabled]), [href], input:not([disabled])',
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
			className={styles.overlay}
			onClick={handleOverlayClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
		>
			<div
				ref={dialogRef}
				className={`${styles.dialog} ${styles[`maxWidth-${maxWidth}`]} ${className}`}
				onClick={(e) => e.stopPropagation()}
				data-variant={variant !== "default" ? variant : undefined}
			>
				<div className={styles.header}>
					<h3 id="dialog-title">{title}</h3>
					{showCloseButton && (
						<button
							type="button"
							className={styles.closeButton}
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X size={18} aria-hidden="true" />
						</button>
					)}
				</div>
				<div className={styles.content}>{children}</div>
				{footer && <div className={styles.footer}>{footer}</div>}
			</div>
		</div>
	);
}

// ============================================================================
// DIALOG ACTIONS
// ============================================================================

export interface DialogActionsProps {
	children: ReactNode;
	align?: "left" | "center" | "right" | "between";
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
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "default" | "danger";
	loading?: boolean;
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
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			variant={variant}
			maxWidth="sm"
			footer={
				<DialogActions>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={loading}
					>
						{cancelText}
					</Button>
					<Button
						variant={variant === "danger" ? "destructive" : "primary"}
						onClick={onConfirm}
						loading={loading}
					>
						{confirmText}
					</Button>
				</DialogActions>
			}
		>
			<p style={{ margin: 0, color: "var(--muted-foreground)" }}>{message}</p>
		</Dialog>
	);
}
