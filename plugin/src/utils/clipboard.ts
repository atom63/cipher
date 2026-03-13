/**
 * Copy text to clipboard.
 * Falls back to execCommand for environments where the Clipboard API
 * is unavailable (e.g. Figma plugin iframes).
 */
export function copyText(text: string): Promise<void> {
	// Try modern API first
	if (navigator.clipboard?.writeText) {
		return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
	}
	return fallbackCopy(text);
}

function fallbackCopy(text: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		// Keep off-screen to avoid flicker
		textarea.style.position = "fixed";
		textarea.style.left = "-9999px";
		textarea.style.top = "-9999px";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.select();
		try {
			document.execCommand("copy");
			resolve();
		} catch {
			reject(new Error("Copy failed"));
		} finally {
			document.body.removeChild(textarea);
		}
	});
}
