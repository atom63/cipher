/**
 * Cipher - Figma Plugin
 * Author: You Zhang (ATOM63)
 * Build configuration for the Figma plugin
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes("--watch");

// CSS Modules plugin
const cssModulesPlugin = {
	name: "css-modules",
	setup(build) {
		// Helper function for CSS Modules processing
		const hashCode = (str) => {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				hash = (hash << 5) - hash + str.charCodeAt(i);
				hash &= hash;
			}
			return Math.abs(hash).toString(36).substring(0, 6);
		};

		const processCssModule = (css, filePath) => {
			const hash = hashCode(filePath);

			// Extract class names and create mapping
			const classNames = {};
			const scopedCss = css.replace(
				/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g,
				(_match, className) => {
					const scopedName = `${className}_${hash}`;
					classNames[className] = scopedName;
					return `.${scopedName}`;
				},
			);

			return {
				contents: `
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(scopedCss)};
          document.head.appendChild(style);
          export default ${JSON.stringify(classNames)};
        `,
				loader: "js",
			};
		};

		// Handle .module.scss files
		build.onLoad({ filter: /\.module\.scss$/ }, async (args) => {
			const sass = await import("sass");
			const result = sass.compile(args.path);
			return processCssModule(result.css, args.path);
		});

		// Handle .module.css files
		build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
			const fs = await import("node:fs/promises");
			const css = await fs.readFile(args.path, "utf-8");
			return processCssModule(css, args.path);
		});
	},
};

// Ensure dist directory exists
const distDir = resolve(__dirname, "dist");
if (!existsSync(distDir)) {
	mkdirSync(distDir, { recursive: true });
}

// Build the plugin code (runs in Figma's sandbox)
const codeContext = await esbuild.context({
	entryPoints: [resolve(__dirname, "src/code.ts")],
	bundle: true,
	outfile: resolve(__dirname, "dist/code.js"),
	platform: "node",
	target: "es2017",
	logLevel: "info",
	minify: !isDev,
});

// Build the UI (React app)
const uiContext = await esbuild.context({
	entryPoints: [resolve(__dirname, "src/ui.tsx")],
	bundle: true,
	outfile: resolve(__dirname, "dist/ui.js"),
	platform: "browser",
	target: "es2020",
	loader: {
		".tsx": "tsx",
		".ts": "ts",
	},
	logLevel: "info",
	minify: !isDev,
	jsx: "automatic",
	format: "iife",
	plugins: [cssModulesPlugin],
});

// Build the UI SCSS separately
const cssPlugin = {
	name: "scss",
	setup(build) {
		build.onLoad({ filter: /\.scss$/ }, async (args) => {
			const sass = await import("sass");
			const result = sass.compile(args.path);
			return {
				contents: result.css,
				loader: "css",
			};
		});
	},
};

const cssContext = await esbuild.context({
	entryPoints: [resolve(__dirname, "src/ui.scss")],
	bundle: true,
	outfile: resolve(__dirname, "dist/ui.css"),
	logLevel: "info",
	minify: !isDev,
	plugins: [cssPlugin],
});

// Generate the HTML file with INLINED JavaScript (Figma requires this)
function generateHTML() {
	// Read the compiled JavaScript
	const jsContent = readFileSync(resolve(__dirname, "dist/ui.js"), "utf-8");
	const cssContent = readFileSync(resolve(__dirname, "dist/ui.css"), "utf-8");

	const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cipher</title>
  <style>
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    ${jsContent}
  </script>
</body>
</html>`;

	writeFileSync(resolve(__dirname, "dist/ui.html"), html);
}

if (isDev) {
	// Watch and rebuild
	await codeContext.watch();
	await uiContext.watch();
	await cssContext.watch();

	// Generate HTML once at start
	generateHTML();

	console.log("👀 Watching for changes...");
	console.log("💡 Reload the plugin in Figma after making changes");

	// Set up manual rebuild detection for HTML generation
	let lastBuildTime = Date.now();
	setInterval(async () => {
		try {
			const uiJsPath = resolve(__dirname, "dist/ui.js");
			const uiCssPath = resolve(__dirname, "dist/ui.css");
			const fs = await import("node:fs/promises");

			const [jsStats, cssStats] = await Promise.all([
				fs.stat(uiJsPath).catch(() => null),
				fs.stat(uiCssPath).catch(() => null),
			]);

			const newestTime = Math.max(
				jsStats?.mtimeMs || 0,
				cssStats?.mtimeMs || 0,
			);

			if (newestTime > lastBuildTime) {
				lastBuildTime = newestTime;
				generateHTML();
				console.log("✅ Rebuilt at", new Date().toLocaleTimeString());
			}
		} catch (_error) {
			// Ignore errors
		}
	}, 500);

	// Keep the process alive
	process.stdin.on("data", () => {});
} else {
	await Promise.all([
		codeContext.rebuild(),
		uiContext.rebuild(),
		cssContext.rebuild(),
	]);

	generateHTML();

	await Promise.all([
		codeContext.dispose(),
		uiContext.dispose(),
		cssContext.dispose(),
	]);
}
