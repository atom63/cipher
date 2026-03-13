import type { PluginSettings } from "../types/messages";

const THEME_STYLE_ID = "cipher-theme-override";

const LIGHT_TOKENS = `
:root:root {
  --background: var(--color-gray-light-2);
  --foreground: var(--color-gray-light-12);
  --card: var(--color-gray-light-1);
  --card-foreground: var(--color-gray-light-12);
  --popover: var(--color-gray-light-1);
  --popover-foreground: var(--color-gray-light-12);
  --primary: var(--color-accent-primary-500);
  --primary-foreground: var(--color-gray-light-1);
  --secondary: var(--color-gray-light-3);
  --secondary-foreground: var(--color-gray-light-11);
  --muted: var(--color-gray-light-3);
  --muted-foreground: color-mix(in srgb, var(--color-gray-light-11), transparent 10%);
  --accent: color-mix(in srgb, var(--color-gray-light-4), transparent 20%);
  --accent-foreground: var(--color-gray-light-12);
  --destructive: var(--color-accent-status-danger-500);
  --destructive-foreground: var(--color-gray-light-1);
  --success: var(--color-accent-status-success-500);
  --success-foreground: var(--color-gray-light-1);
  --warning: var(--color-accent-status-warning-500);
  --warning-foreground: var(--color-gray-light-12);
  --info: var(--color-accent-status-info-500);
  --info-foreground: var(--color-gray-light-12);
  --border: var(--color-gray-light-4);
  --input: var(--color-gray-light-5);
  --ring: var(--color-gray-light-6);
  --muted-foreground-light: var(--color-gray-light-9);
  --border-light: var(--color-gray-light-3);
  --success-light: color-mix(in srgb, var(--color-accent-status-success-500), transparent 90%);
  --error: var(--destructive);
  --error-light: color-mix(in srgb, var(--color-accent-status-danger-500), transparent 90%);
  color-scheme: light;
}`;

const DARK_TOKENS = `
:root:root {
  --background: var(--color-gray-dark-1);
  --foreground: color-mix(in srgb, var(--color-gray-dark-12), transparent 10%);
  --card: var(--color-gray-dark-2);
  --card-foreground: var(--color-gray-dark-12);
  --popover: var(--color-gray-dark-4);
  --popover-foreground: var(--color-gray-dark-12);
  --primary: var(--color-accent-primary-500);
  --primary-foreground: var(--color-gray-dark-12);
  --secondary: var(--color-gray-dark-3);
  --secondary-foreground: color-mix(in srgb, var(--color-gray-dark-10), transparent 10%);
  --muted: var(--color-gray-dark-3);
  --muted-foreground: color-mix(in srgb, var(--color-gray-dark-11), transparent 10%);
  --accent: color-mix(in srgb, var(--color-gray-dark-6), transparent 20%);
  --accent-foreground: var(--color-gray-dark-12);
  --destructive: var(--color-accent-status-danger-500);
  --destructive-foreground: var(--color-gray-dark-12);
  --success: var(--color-accent-status-success-500);
  --success-foreground: var(--color-gray-dark-12);
  --warning: var(--color-accent-status-warning-500);
  --warning-foreground: var(--color-gray-dark-12);
  --info: var(--color-accent-status-info-500);
  --info-foreground: var(--color-gray-dark-12);
  --border: var(--color-gray-dark-6);
  --input: var(--color-gray-dark-7);
  --ring: var(--color-gray-dark-8);
  --muted-foreground-light: var(--color-gray-dark-9);
  --border-light: var(--color-gray-dark-4);
  --success-light: color-mix(in srgb, var(--color-accent-status-success-500), transparent 90%);
  --error: var(--destructive);
  --error-light: color-mix(in srgb, var(--color-accent-status-danger-500), transparent 90%);
  color-scheme: dark;
}`;

/**
 * Apply theme by injecting/removing a <style> tag that overrides CSS variables.
 *
 * Uses `:root:root` doubled selector for higher specificity than any single
 * `:root`, `.figma-dark`, or media query rule — guaranteed to win.
 * The style tag is appended to <head> AFTER all other styles, so it also
 * wins by source order.
 *
 * - "system": removes override, Figma's .figma-dark / prefers-color-scheme applies
 * - "light": injects light tokens, overrides .figma-dark
 * - "dark": injects dark tokens, forces dark mode
 */
export function applyTheme(theme: PluginSettings["theme"]) {
	let styleEl = document.getElementById(
		THEME_STYLE_ID,
	) as HTMLStyleElement | null;

	if (theme === "system") {
		// Remove override — let Figma/OS handle it
		styleEl?.remove();
		return;
	}

	if (!styleEl) {
		styleEl = document.createElement("style");
		styleEl.id = THEME_STYLE_ID;
		document.head.appendChild(styleEl);
	}

	styleEl.textContent = theme === "light" ? LIGHT_TOKENS : DARK_TOKENS;
}
