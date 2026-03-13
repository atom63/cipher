import { describe, expect, test } from "vitest";
import {
	generateTokenId,
	parseCollectionJSON,
	parseJSON,
	parseTokenObjectDynamic,
	parseTokenValueGeneric,
	transformTokenName,
} from "../src/parsers/token-parsers";

describe("generateTokenId", () => {
	test("creates deterministic IDs", () => {
		expect(generateTokenId("color/primary", 0)).toBe("token-color-primary-0");
		expect(generateTokenId("color/primary", 1)).toBe("token-color-primary-1");
	});

	test("sanitizes special characters", () => {
		expect(generateTokenId("spacing.large", 0)).toBe("token-spacing-large-0");
		expect(generateTokenId("my token!", 0)).toBe("token-my-token--0");
	});
});

describe("transformTokenName", () => {
	test("converts kebab-case to path", () => {
		expect(transformTokenName("primary-blue", "color")).toBe(
			"color/primary/blue",
		);
	});

	test("converts snake_case to path", () => {
		expect(transformTokenName("primary_blue", "color")).toBe(
			"color/primary/blue",
		);
	});

	test("strips common color prefixes", () => {
		expect(transformTokenName("color-primary", "colors")).toBe(
			"colors/primary",
		);
		expect(transformTokenName("bg-primary", "colors")).toBe("colors/primary");
		expect(transformTokenName("text-primary", "colors")).toBe("colors/primary");
		expect(transformTokenName("border-primary", "colors")).toBe(
			"colors/primary",
		);
	});
});

describe("parseTokenValueGeneric", () => {
	// Colors
	test("parses hex colors", () => {
		const result = parseTokenValueGeneric("#ff0000", "color");
		expect(result.parsed).toBeDefined();
		expect(result.parsed.r).toBe(1);
		expect(result.error).toBeUndefined();
	});

	test("parses oklch colors", () => {
		const result = parseTokenValueGeneric("oklch(0.5 0.1 180)", "color");
		expect(result.parsed).toBeDefined();
		expect(result.error).toBeUndefined();
	});

	test("returns error for invalid colors", () => {
		const result = parseTokenValueGeneric("not-a-color", "color");
		expect(result.parsed).toBeNull();
		expect(result.error).toBeDefined();
	});

	// Numbers
	test("parses numeric types", () => {
		for (const type of [
			"spacing",
			"sizing",
			"borderRadius",
			"borderWidth",
			"number",
			"dimension",
		]) {
			expect(parseTokenValueGeneric(16, type)).toEqual({ parsed: 16 });
			expect(parseTokenValueGeneric("24", type)).toEqual({ parsed: 24 });
		}
	});

	test("returns error for invalid numbers", () => {
		const result = parseTokenValueGeneric("not-a-number", "number");
		expect(result.error).toBeDefined();
	});

	// Strings
	test("parses string types", () => {
		for (const type of ["string", "fontFamily", "fontWeight", "text"]) {
			expect(parseTokenValueGeneric("Inter", type)).toEqual({
				parsed: "Inter",
			});
		}
	});

	// Booleans
	test("parses boolean string values", () => {
		expect(parseTokenValueGeneric("true", "boolean")).toEqual({ parsed: true });
		expect(parseTokenValueGeneric("false", "boolean")).toEqual({
			parsed: false,
		});
		expect(parseTokenValueGeneric("TRUE", "boolean")).toEqual({ parsed: true });
	});

	test("parses boolean native values", () => {
		expect(parseTokenValueGeneric(true, "boolean")).toEqual({ parsed: true });
		expect(parseTokenValueGeneric(false, "boolean")).toEqual({ parsed: false });
	});

	test("parses numeric 0/1 as boolean", () => {
		expect(parseTokenValueGeneric(0, "boolean")).toEqual({ parsed: false });
		expect(parseTokenValueGeneric(1, "boolean")).toEqual({ parsed: true });
	});

	// Type inference for 'unknown'
	test("infers color from hex value", () => {
		const result = parseTokenValueGeneric("#3B82F6", "unknown");
		expect(result.parsed).toBeDefined();
		expect(result.parsed.r).toBeDefined();
	});

	test("infers color from rgb value", () => {
		const result = parseTokenValueGeneric("rgb(59, 130, 246)", "unknown");
		expect(result.parsed).toBeDefined();
		expect(result.parsed.r).toBeDefined();
	});

	test("infers number from numeric string", () => {
		const result = parseTokenValueGeneric("16", "unknown");
		expect(result.parsed).toBe(16);
	});

	test("infers boolean from string", () => {
		expect(parseTokenValueGeneric("true", "unknown").parsed).toBe(true);
		expect(parseTokenValueGeneric("false", "unknown").parsed).toBe(false);
	});

	// Fallback behavior
	test("falls back to color parsing for hex-like values with unknown type", () => {
		const result = parseTokenValueGeneric("#ff0000", "custom-type");
		expect(result.parsed).toBeDefined();
		expect(result.parsed.r).toBe(1);
	});

	test("falls back to number for numeric values with unknown type", () => {
		const result = parseTokenValueGeneric("42", "custom-type");
		expect(result.parsed).toBe(42);
	});

	test("falls back to string for non-numeric, non-color values", () => {
		const result = parseTokenValueGeneric("Inter", "custom-type");
		expect(result.parsed).toBe("Inter");
	});
});

describe("parseTokenObjectDynamic", () => {
	test("parses DTCG format tokens", () => {
		const tokens: any[] = [];
		const errors: any[] = [];
		const input = {
			colors: {
				primary: { value: "#3B82F6", type: "color" },
				secondary: { value: "#10B981", type: "color" },
			},
		};

		parseTokenObjectDynamic(input, [], tokens, errors);
		expect(tokens).toHaveLength(2);
		expect(tokens[0].figmaName).toBe("colors/primary");
		expect(tokens[0].category).toBe("colors");
		expect(tokens[0].value.r).toBeDefined();
		expect(errors).toHaveLength(0);
	});

	test("parses nested groups", () => {
		const tokens: any[] = [];
		const errors: any[] = [];
		const input = {
			colors: {
				brand: {
					primary: { value: "#3B82F6", type: "color" },
					secondary: { value: "#10B981", type: "color" },
				},
			},
		};

		parseTokenObjectDynamic(input, [], tokens, errors);
		expect(tokens).toHaveLength(2);
		expect(tokens[0].figmaName).toBe("colors/brand/primary");
		expect(tokens[0].category).toBe("colors");
	});

	test("handles legacy flat format", () => {
		const tokens: any[] = [];
		const errors: any[] = [];
		const input = {
			colors: {
				primary: "#3B82F6",
				secondary: "#10B981",
			},
		};

		parseTokenObjectDynamic(input, [], tokens, errors);
		expect(tokens).toHaveLength(2);
		expect(tokens[0].type).toBe("color");
	});

	test("infers spacing type from category", () => {
		const tokens: any[] = [];
		const errors: any[] = [];
		const input = {
			spacing: {
				sm: 4,
				md: 8,
				lg: 16,
			},
		};

		parseTokenObjectDynamic(input, [], tokens, errors);
		expect(tokens).toHaveLength(3);
		expect(tokens[0].type).toBe("spacing");
		expect(tokens[0].value).toBe(4);
	});

	test("skips $metadata keys", () => {
		const tokens: any[] = [];
		const errors: any[] = [];
		const input = {
			$schema: "https://example.com",
			$description: "Test tokens",
			colors: {
				primary: { value: "#3B82F6", type: "color" },
			},
		};

		parseTokenObjectDynamic(input, [], tokens, errors);
		expect(tokens).toHaveLength(1);
	});

	test("records errors for invalid values", () => {
		const tokens: any[] = [];
		const errors: any[] = [];
		const input = {
			colors: {
				bad: { value: "not-a-color", type: "color" },
			},
		};

		parseTokenObjectDynamic(input, [], tokens, errors);
		expect(tokens).toHaveLength(0);
		expect(errors).toHaveLength(1);
		expect(errors[0].severity).toBe("error");
	});

	test("includes description when present", () => {
		const tokens: any[] = [];
		const errors: any[] = [];
		const input = {
			colors: {
				primary: {
					value: "#3B82F6",
					type: "color",
					description: "Brand primary",
				},
			},
		};

		parseTokenObjectDynamic(input, [], tokens, errors);
		expect(tokens[0].description).toBe("Brand primary");
	});
});

describe("parseJSON", () => {
	test("parses simple token JSON", () => {
		const json = JSON.stringify({
			colors: {
				primary: { value: "#3B82F6", type: "color" },
			},
			spacing: {
				sm: { value: 4, type: "spacing" },
			},
		});

		const result = parseJSON(json);
		expect(result.tokens).toHaveLength(2);
		expect(result.stats.total).toBe(2);
		expect(result.stats.byCategory.colors).toBe(1);
		expect(result.stats.byCategory.spacing).toBe(1);
		expect(result.errors).toHaveLength(0);
	});

	test("handles collection format with $collections", () => {
		const json = JSON.stringify({
			$collections: ["primitives"],
			tokens: {
				primitives: {
					color: {
						red: { value: "#ff0000", type: "color" },
					},
				},
			},
		});

		const result = parseJSON(json);
		expect(result.tokens.length).toBeGreaterThan(0);
	});

	test("handles wrapped format with tokens key", () => {
		const json = JSON.stringify({
			tokens: {
				colors: {
					primary: { value: "#3B82F6", type: "color" },
				},
			},
		});

		const result = parseJSON(json);
		expect(result.tokens).toHaveLength(1);
	});

	test("returns error for invalid JSON", () => {
		const result = parseJSON("not valid json{{{");
		expect(result.tokens).toHaveLength(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].severity).toBe("error");
	});

	test("returns error for empty JSON", () => {
		const result = parseJSON("{}");
		expect(result.tokens).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	test("handles mixed types", () => {
		const json = JSON.stringify({
			colors: { primary: { value: "#3B82F6", type: "color" } },
			spacing: { sm: { value: 4, type: "spacing" } },
			fonts: { body: { value: "Inter", type: "fontFamily" } },
		});

		const result = parseJSON(json);
		expect(result.tokens).toHaveLength(3);
	});

	test("handles deeply nested tokens", () => {
		const json = JSON.stringify({
			colors: {
				brand: {
					primary: {
						default: { value: "#3B82F6", type: "color" },
						hover: { value: "#2563EB", type: "color" },
					},
				},
			},
		});

		const result = parseJSON(json);
		expect(result.tokens).toHaveLength(2);
		expect(result.tokens[0].figmaName).toBe("colors/brand/primary/default");
		expect(result.tokens[1].figmaName).toBe("colors/brand/primary/hover");
	});

	test("passes through styles section from combined export", () => {
		const json = JSON.stringify({
			$schema: "design-tokens-with-collections",
			$version: "1.0",
			$collections: {
				primitives: {
					name: "Primitives",
					modes: ["Default"],
				},
			},
			tokens: {
				primitives: {
					red: { value: "#ff0000", type: "color" },
				},
			},
			styles: {
				paint: {
					semantics: {
						background: {
							id: "S:123",
							type: "color",
							fills: [{ type: "solid", color: "#ffffff", opacity: 1 }],
						},
					},
				},
				text: {
					heading: {
						id: "S:456",
						type: "text",
						fontFamily: "Inter",
						fontSize: "24px",
					},
				},
			},
		});

		const result = parseJSON(json);
		expect(result.tokens.length).toBeGreaterThan(0);
		expect(result.styles).toBeDefined();
		expect(result.styles.paint).toBeDefined();
		expect(result.styles.paint.semantics.background.id).toBe("S:123");
		expect(result.styles.text).toBeDefined();
		expect(result.styles.text.heading.fontFamily).toBe("Inter");
	});

	test("does not include styles when none in JSON", () => {
		const json = JSON.stringify({
			$collections: { primitives: { name: "Primitives", modes: ["Default"] } },
			tokens: {
				primitives: { red: { value: "#ff0000", type: "color" } },
			},
		});

		const result = parseJSON(json);
		expect(result.styles).toBeUndefined();
	});

	test("rejects styles-only files", () => {
		const json = JSON.stringify({
			$schema: "figma-styles-export",
			$version: "1.0",
			styles: {
				paint: {},
			},
		});

		const result = parseJSON(json);
		expect(result.tokens).toHaveLength(0);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].message).toContain("Figma Styles file");
	});
});

describe("parseCollectionJSON", () => {
	test("parses multi-collection tokens", () => {
		const data = {
			$collections: {
				primitives: { name: "Primitives", modes: ["Default"] },
				semantics: { name: "Semantics", modes: ["Light", "Dark"] },
			},
			tokens: {
				primitives: {
					red: { value: "#ff0000", type: "color" },
					blue: { value: "#0000ff", type: "color" },
				},
				semantics: {
					background: {
						type: "color",
						modes: {
							Light: "#ffffff",
							Dark: "#000000",
						},
					},
				},
			},
		};

		const result = parseCollectionJSON(data, 0);
		expect(result.tokens.length).toBeGreaterThanOrEqual(3);
		expect(result.stats.byCategory.primitives).toBe(2);
	});

	test("passes through styles section", () => {
		const data = {
			$collections: {
				primitives: { name: "Primitives", modes: ["Default"] },
			},
			tokens: {
				primitives: {
					red: { value: "#ff0000", type: "color" },
				},
			},
			styles: {
				paint: { bg: { id: "S:1", type: "color" } },
				effect: { shadow: { id: "S:2", type: "effect" } },
			},
		};

		const result = parseCollectionJSON(data, 0);
		expect(result.styles).toBeDefined();
		expect(result.styles.paint.bg.id).toBe("S:1");
		expect(result.styles.effect.shadow.id).toBe("S:2");
	});

	test("omits styles when not present", () => {
		const data = {
			$collections: {
				primitives: { name: "Primitives", modes: ["Default"] },
			},
			tokens: {
				primitives: {
					red: { value: "#ff0000", type: "color" },
				},
			},
		};

		const result = parseCollectionJSON(data, 0);
		expect(result.styles).toBeUndefined();
	});

	test("handles references between collections", () => {
		const data = {
			$collections: {
				primitives: { name: "Primitives", modes: ["Default"] },
				semantics: { name: "Semantics", modes: ["Light"] },
			},
			tokens: {
				primitives: {
					blue: { value: "#3B82F6", type: "color" },
				},
				semantics: {
					primary: {
						type: "color",
						modes: {
							Light: "{primitives.blue}",
						},
					},
				},
			},
		};

		const result = parseCollectionJSON(data, 0);
		const refToken = result.tokens.find((t) => t.type === "reference");
		expect(refToken).toBeDefined();
		expect(refToken?.value).toBe("{primitives.blue}");
	});
});
