import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { Button } from "../Button";
import styles from "./Toast.module.css";

// ============================================================================
// TYPES
// ============================================================================

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface Toast {
	action?: ToastAction;
	duration?: number;
	id: string;
	message: string;
	variant: ToastVariant;
}

interface ToastContextValue {
	addToast: (
		message: string,
		variant?: ToastVariant,
		duration?: number,
		action?: ToastAction,
	) => void;
	removeToast: (id: string) => void;
	showError: (message: string) => void;
	showInfo: (message: string) => void;
	showSuccess: (message: string, action?: ToastAction) => void;
	showWarning: (message: string) => void;
	toasts: Toast[];
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access toast notifications
 *
 * @example
 * ```tsx
 * const { showError, showSuccess } = useToast()
 *
 * const handleSubmit = async () => {
 *   try {
 *     await saveData()
 *     showSuccess('Data saved successfully')
 *   } catch (error) {
 *     showError('Failed to save data')
 *   }
 * }
 * ```
 */
export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

const DEFAULT_DURATION = 5000; // 5 seconds

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const addToast = useCallback(
		(
			message: string,
			variant: ToastVariant = "info",
			duration = DEFAULT_DURATION,
			action?: ToastAction,
		) => {
			const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
			const toast: Toast = { id, message, variant, duration, action };

			setToasts((prev) => [...prev, toast]);

			// Auto-remove after duration (longer if there's an action)
			const timeout = action ? Math.max(duration, 8000) : duration;
			if (timeout > 0) {
				setTimeout(() => removeToast(id), timeout);
			}
		},
		[removeToast],
	);

	const showError = useCallback(
		(message: string) => addToast(message, "error"),
		[addToast],
	);

	const showSuccess = useCallback(
		(message: string, action?: ToastAction) =>
			addToast(message, "success", DEFAULT_DURATION, action),
		[addToast],
	);

	const showWarning = useCallback(
		(message: string) => addToast(message, "warning"),
		[addToast],
	);

	const showInfo = useCallback(
		(message: string) => addToast(message, "info"),
		[addToast],
	);

	return (
		<ToastContext.Provider
			value={{
				toasts,
				addToast,
				removeToast,
				showError,
				showSuccess,
				showWarning,
				showInfo,
			}}
		>
			{children}
			<ToastContainer onDismiss={removeToast} toasts={toasts} />
		</ToastContext.Provider>
	);
}

// ============================================================================
// COMPONENTS
// ============================================================================

const icons = {
	info: <Info aria-hidden="true" size={16} />,
	success: <CheckCircle aria-hidden="true" size={16} />,
	warning: <AlertTriangle aria-hidden="true" size={16} />,
	error: <AlertCircle aria-hidden="true" size={16} />,
};

interface ToastItemProps {
	onDismiss: (id: string) => void;
	toast: Toast;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
	return (
		<div
			aria-live={toast.variant === "error" ? "assertive" : "polite"}
			className={`${styles.toast} ${styles[toast.variant]}`}
			role="alert"
		>
			<span className={styles.icon}>{icons[toast.variant]}</span>
			<span className={styles.message}>{toast.message}</span>
			{toast.action && (
				<Button
					className={styles.actionButton}
					onClick={() => {
						toast.action?.onClick();
						onDismiss(toast.id);
					}}
					size="sm"
					variant="soft"
				>
					{toast.action.label}
				</Button>
			)}
			<Button
				aria-label="Dismiss"
				className={styles.dismissButton}
				onClick={() => onDismiss(toast.id)}
				size="icon-xs"
				variant="ghost"
			>
				<X aria-hidden="true" size={12} />
			</Button>
		</div>
	);
}

interface ToastContainerProps {
	onDismiss: (id: string) => void;
	toasts: Toast[];
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
	if (toasts.length === 0) return null;

	return (
		<div className={styles.container}>
			{toasts.map((toast) => (
				<ToastItem key={toast.id} onDismiss={onDismiss} toast={toast} />
			))}
		</div>
	);
}
