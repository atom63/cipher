import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
	children: ReactNode;
	/** Custom fallback UI - receives error and reset function */
	fallback?: (error: Error, resetError: () => void) => ReactNode;
	/** Called when an error is caught */
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error Boundary component that catches JavaScript errors in child components
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error) => console.error(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={reset}>Try Again</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error for debugging
		console.error("[ErrorBoundary] Caught error:", error, errorInfo);

		// Call optional error handler
		this.props.onError?.(error, errorInfo);
	}

	resetError = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		const { hasError, error } = this.state;
		const { children, fallback } = this.props;

		if (hasError && error) {
			// Use custom fallback if provided
			if (fallback) {
				return fallback(error, this.resetError);
			}

			// Default fallback UI
			return <DefaultErrorFallback error={error} onReset={this.resetError} />;
		}

		return children;
	}
}

// ============================================================================
// DEFAULT FALLBACK UI
// ============================================================================

interface DefaultErrorFallbackProps {
	error: Error;
	onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
	return (
		<div className={styles.errorContainer}>
			<div className={styles.errorIcon}>
				<AlertTriangle size={32} />
			</div>
			<h3 className={styles.errorTitle}>Something went wrong</h3>
			<p className={styles.errorMessage}>{error.message}</p>
			<button type="button" className={styles.resetButton} onClick={onReset}>
				<RefreshCw size={14} />
				Try Again
			</button>
			<details className={styles.errorDetails}>
				<summary>Technical Details</summary>
				<pre>{error.stack}</pre>
			</details>
		</div>
	);
}

// ============================================================================
// PAGE-LEVEL ERROR BOUNDARY
// ============================================================================

interface PageErrorBoundaryProps {
	children: ReactNode;
	pageName?: string;
}

/**
 * Error boundary wrapper for page-level components
 * Provides consistent error handling across all pages
 */
export function PageErrorBoundary({
	children,
	pageName,
}: PageErrorBoundaryProps) {
	const handleError = (error: Error, errorInfo: ErrorInfo) => {
		console.error(`[${pageName ?? "Page"}] Error:`, error, errorInfo);
	};

	return (
		<ErrorBoundary
			onError={handleError}
			fallback={(error, reset) => (
				<div className={styles.pageError}>
					<div className={styles.errorIcon}>
						<AlertTriangle size={24} />
					</div>
					<h3 className={styles.errorTitle}>
						{pageName ? `${pageName} failed to load` : "Page failed to load"}
					</h3>
					<p className={styles.errorMessage}>{error.message}</p>
					<button type="button" className={styles.resetButton} onClick={reset}>
						<RefreshCw size={14} />
						Reload Page
					</button>
				</div>
			)}
		>
			{children}
		</ErrorBoundary>
	);
}
