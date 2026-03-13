import { useEffect, useState } from "react";

/**
 * Toggle debug mode with Ctrl+Shift+D (or Cmd+Shift+D on Mac).
 * Adds/removes the `debug-mode` class on `document.body`.
 */
export function useDebugMode() {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "D" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				setEnabled((prev) => !prev);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	useEffect(() => {
		document.body.classList.toggle("debug-mode", enabled);
	}, [enabled]);

	return enabled;
}
