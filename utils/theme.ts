import type { PluginSettings } from "../types/messages";

const THEME_STYLE_ID = "cipher-theme-override";

const LIGHT_TOKENS = `
:root:root {
  --background: var(--color-zinc-50);
  --foreground: var(--color-zinc-950);
  --card: var(--color-zinc-50);
  --card-foreground: var(--color-zinc-950);
  --popover: var(--color-zinc-50);
  --popover-foreground: var(--color-zinc-950);
  --primary: var(--color-emerald-600);
  --primary-foreground: var(--color-zinc-50);
  --secondary: var(--color-zinc-200);
  --secondary-foreground: var(--color-zinc-700);
  --muted: var(--color-zinc-100);
  --muted-foreground: var(--color-zinc-500);
  --accent: color-mix(in srgb, var(--color-emerald-500), transparent 90%);
  --accent-foreground: var(--color-zinc-900);
  --destructive: var(--color-rose-500);
  --destructive-foreground: var(--color-zinc-50);
  --success: var(--color-emerald-500);
  --success-foreground: var(--color-zinc-50);
  --warning: var(--color-amber-500);
  --warning-foreground: var(--color-zinc-950);
  --info: var(--color-blue-500);
  --info-foreground: var(--color-zinc-50);
  --border: var(--color-zinc-200);
  --input: var(--color-zinc-400);
  --ring: var(--color-emerald-500);
  --muted-foreground-light: var(--color-zinc-400);
  --border-light: var(--color-zinc-100);
  --success-light: var(--color-emerald-50);
  --error: var(--destructive);
  --error-light: var(--color-rose-500);
  color-scheme: light;
}`;

const DARK_TOKENS = `
:root:root {
  --background: var(--color-zinc-950);
  --foreground: var(--color-zinc-50);
  --card: var(--color-zinc-900);
  --card-foreground: var(--color-zinc-50);
  --popover: var(--color-zinc-900);
  --popover-foreground: var(--color-zinc-50);
  --primary: var(--color-emerald-500);
  --primary-foreground: var(--color-zinc-50);
  --secondary: var(--color-zinc-700);
  --secondary-foreground: var(--color-zinc-300);
  --muted: var(--color-zinc-800);
  --muted-foreground: var(--color-zinc-400);
  --accent: color-mix(in srgb, var(--color-emerald-500), transparent 20%);
  --accent-foreground: var(--color-zinc-50);
  --destructive: var(--color-rose-500);
  --destructive-foreground: var(--color-zinc-50);
  --success: var(--color-emerald-500);
  --success-foreground: var(--color-zinc-50);
  --warning: var(--color-amber-500);
  --warning-foreground: var(--color-zinc-950);
  --info: var(--color-blue-500);
  --info-foreground: var(--color-zinc-50);
  --border: var(--color-zinc-800);
  --input: var(--color-zinc-700);
  --ring: var(--color-emerald-500);
  --muted-foreground-light: var(--color-zinc-500);
  --border-light: var(--color-zinc-900);
  --success-light: var(--color-emerald-950);
  --error: var(--destructive);
  --error-light: var(--color-rose-500);
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
	let styleEl = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;

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
