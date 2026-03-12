import { describe, expect, test } from "vitest";
import { parseCSS } from "../parsers/css-parser";

describe("parseCSS", () => {
	describe("basic declarations", () => {
		test("parses simple :root color variables", () => {
			const css = `:root {
				--color-primary: #3B82F6;
				--color-secondary: #10B981;
			}`;

			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(2);
			expect(result.errors).toHaveLength(0);
			expect(result.tokens[0].figmaName).toContain("primary");
			expect(result.tokens[0].type).toBe("color");
			expect(result.tokens[1].figmaName).toContain("secondary");
		});

		test("parses numeric values with units", () => {
			const css = `:root {
				--spacing-sm: 4px;
				--spacing-md: 8px;
				--spacing-lg: 16px;
			}`;

			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(3);
			expect(result.tokens[0].type).toBe("number");
			expect(result.tokens[0].value).toBe(4);
		});

		test("parses string values", () => {
			const css = `:root {
				--brand-tagline: "Design with precision";
			}`;

			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
			expect(result.tokens[0].type).toBe("string");
		});

		test("parses font-family values", () => {
			const css = `:root {
				--font-family-body: "Inter", sans-serif;
			}`;

			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
			expect(result.tokens[0].type).toBe("fontFamily");
		});
	});

	describe("color formats", () => {
		test("parses hex colors", () => {
			const css = ":root { --color-red: #ff0000; }";
			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
			expect(result.tokens[0].type).toBe("color");
		});

		test("parses rgb colors", () => {
			const css = ":root { --color-blue: rgb(59, 130, 246); }";
			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
			expect(result.tokens[0].type).toBe("color");
		});

		test("parses oklch colors", () => {
			const css = ":root { --color-brand: oklch(0.623 0.214 259.815); }";
			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
			expect(result.tokens[0].type).toBe("color");
		});

		test("parses hsl colors", () => {
			const css = ":root { --color-accent: hsl(217, 91%, 60%); }";
			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
			expect(result.tokens[0].type).toBe("color");
		});
	});

	describe("var() references", () => {
		test("parses var() references as reference type", () => {
			const css = `:root {
				--color-primary: #3B82F6;
			}
			.dark {
				--color-background: var(--color-primary);
			}`;

			const result = parseCSS(css);
			const refToken = result.tokens.find((t) => t.type === "reference");
			expect(refToken).toBeDefined();
			expect(refToken?.originalValue).toContain("var(--color-primary)");
		});
	});

	describe("multiple selectors", () => {
		test("parses .dark selector as semantics category", () => {
			const css = `.dark {
				--color-bg: #000000;
				--color-fg: #ffffff;
			}`;

			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(2);
			expect(result.tokens[0].category).toBe("semantics");
		});

		test("parses :root and .dark selectors together", () => {
			const css = `:root {
				--color-primary: #3B82F6;
			}
			.dark {
				--color-primary: #60A5FA;
			}`;

			const result = parseCSS(css);
			expect(result.tokens.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("type inference", () => {
		test("infers color from hex value", () => {
			const css = ":root { --background: #ffffff; }";
			const result = parseCSS(css);
			expect(result.tokens[0].type).toBe("color");
		});

		test("infers number from px value", () => {
			const css = ":root { --spacing-4: 16px; }";
			const result = parseCSS(css);
			expect(result.tokens[0].type).toBe("number");
			expect(result.tokens[0].value).toBe(16);
		});

		test("infers number from rem value", () => {
			const css = ":root { --size-lg: 1.5rem; }";
			const result = parseCSS(css);
			expect(result.tokens[0].type).toBe("number");
		});
	});

	describe("edge cases", () => {
		test("returns empty for CSS with no custom properties", () => {
			const css = "body { color: red; font-size: 16px; }";
			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(0);
		});

		test("returns empty for empty string", () => {
			const result = parseCSS("");
			expect(result.tokens).toHaveLength(0);
		});

		test("handles comments in CSS", () => {
			const css = `:root {
				/* Brand colors */
				--color-primary: #3B82F6;
			}`;
			const result = parseCSS(css);
			expect(result.tokens).toHaveLength(1);
		});

		test("stats track declaration counts", () => {
			const css = `:root {
				--color-a: #111;
				--color-b: #222;
				--color-c: #333;
			}`;
			const result = parseCSS(css);
			expect(result.stats.totalDeclarations).toBe(3);
			expect(result.stats.parsed).toBe(3);
		});
	});
});
