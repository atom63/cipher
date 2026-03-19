import { describe, expect, test } from "vitest";
import {
	parseColorRamp,
	rampsToTokens,
} from "../src/parsers/color-ramp-parser";

// =========================================================================
// CSS: Radix-style ramps
// =========================================================================

describe("parseColorRamp — Radix CSS", () => {
	test("parses basic Radix ramp (--red-1 through --red-12)", () => {
		const css = `
			:root {
				--red-1: #fefcfb;
				--red-2: #fff5f1;
				--red-9: #f06b32;
				--red-12: #562e1e;
			}
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].name).toBe("red");
		expect(result.ramps[0].steps).toHaveLength(4);
		expect(result.ramps[0].steps[0].step).toBe("1");
		expect(result.ramps[0].steps[0].color).toBeDefined();
	});

	test("skips Radix alpha steps and extras", () => {
		const css = `
			:root {
				--red-1: #fefcfb;
				--red-9: #f06b32;
				--red-a1: #c0400004;
				--red-a2: #ff49000e;
				--red-contrast: #fff;
				--red-surface: #fff3eecc;
				--red-indicator: #f06b32;
				--red-track: #f06b32;
			}
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		const steps = result.ramps[0].steps.map((s) => s.step);
		// Only numeric steps
		expect(steps).toContain("1");
		expect(steps).toContain("9");
		// No alpha or extras
		expect(steps).not.toContain("a1");
		expect(steps).not.toContain("a2");
		expect(steps).not.toContain("contrast");
		expect(steps).not.toContain("surface");
		expect(result.ramps[0].steps).toHaveLength(2);
	});

	test("groups multiple ramps from one CSS block", () => {
		const css = `
			:root {
				--red-1: #fefcfb;
				--red-2: #fff5f1;
				--blue-1: #fbfdff;
				--blue-2: #f4faff;
			}
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(2);
		const names = result.ramps.map((r) => r.name).sort();
		expect(names).toEqual(["blue", "red"]);
	});

	test("prefers @supports oklch values over base hex", () => {
		const css = `
			:root {
				--red-1: #fefcfb;
				--red-9: #f06b32;
			}
			@supports (color: color(display-p3 1 1 1)) {
				@media (color-gamut: p3) {
					:root {
						--red-1: oklch(99.2% 0.0025 41.64);
						--red-9: oklch(68.2% 0.1781 41.64);
					}
				}
			}
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		const step1 = result.ramps[0].steps.find((s) => s.step === "1");
		// Should use the oklch value, not the hex
		expect(step1?.value).toContain("oklch");
	});

	test("parses full Radix light paste with @supports block", () => {
		const css = `:root, .light, .light-theme {
  --gray-1: #fefdfb;
  --gray-2: #fbf9f7;
  --gray-9: #98897f;
  --gray-12: #271e18;

  --gray-a1: #c0800004;
  --gray-a12: #110700e7;

  --gray-contrast: #FFFFFF;
  --gray-surface: #ffffffcc;
  --gray-indicator: #98897f;
  --gray-track: #98897f;
}

@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    :root, .light, .light-theme {
      --gray-1: oklch(99.4% 0.0025 57.21);
      --gray-2: oklch(98.2% 0.0033 57.21);
      --gray-9: oklch(64.1% 0.023 57.21);
      --gray-12: oklch(24.3% 0.0178 57.21);

      --gray-a1: color(display-p3 0.7569 0.5137 0.0235 / 0.016);
      --gray-a12: color(display-p3 0.0549 0.0235 0 / 0.902);

      --gray-contrast: #FFFFFF;
      --gray-surface: color(display-p3 1 1 1 / 80%);
      --gray-indicator: oklch(64.1% 0.023 57.21);
      --gray-track: oklch(64.1% 0.023 57.21);
    }
  }
}`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].name).toBe("gray");
		// Only numeric steps (1, 2, 9, 12) — alpha and extras stripped
		expect(result.ramps[0].steps).toHaveLength(4);
		// Numeric steps should prefer oklch from @supports
		const step1 = result.ramps[0].steps.find((s) => s.step === "1");
		expect(step1?.value).toContain("oklch");
		// Alpha steps should be excluded
		expect(result.ramps[0].steps.find((s) => s.step === "a1")).toBeUndefined();
		expect(result.ramps[0].steps.find((s) => s.step === "contrast")).toBeUndefined();
		// Should NOT detect multiple modes (all selectors are light)
		expect(result.ramps[0].modes).toBeUndefined();
	});

	test("detects light/dark modes from selectors", () => {
		const css = `
			:root, .light, .light-theme {
				--gray-1: #fefdfb;
				--gray-9: #98897f;
				--gray-12: #271e18;
			}
			.dark, .dark-theme {
				--gray-1: #0f1118;
				--gray-9: #676d8b;
				--gray-12: #eceef5;
			}
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].name).toBe("gray");
		expect(result.ramps[0].modes).toBeDefined();
		expect(result.ramps[0].modes).toHaveLength(2);
		const modeNames = result.ramps[0].modes!.map((m) => m.name).sort();
		expect(modeNames).toEqual(["dark", "light"]);

		// Light mode should have light values
		const lightMode = result.ramps[0].modes!.find((m) => m.name === "light")!;
		const lightStep1 = lightMode.steps.find((s) => s.step === "1");
		expect(lightStep1?.value).toBe("#fefdfb");

		// Dark mode should have dark values
		const darkMode = result.ramps[0].modes!.find((m) => m.name === "dark")!;
		const darkStep1 = darkMode.steps.find((s) => s.step === "1");
		expect(darkStep1?.value).toBe("#0f1118");
	});

	test("light/dark with @supports P3 overrides per mode", () => {
		const css = `
			:root {
				--red-1: #fefcfb;
			}
			.dark {
				--red-1: #1a0000;
			}
			@supports (color: oklch(0 0 0)) {
				:root {
					--red-1: oklch(99% 0.01 40);
				}
				.dark {
					--red-1: oklch(10% 0.01 40);
				}
			}
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].modes).toHaveLength(2);

		const light = result.ramps[0].modes!.find((m) => m.name === "light")!;
		expect(light.steps[0].value).toContain("oklch");

		const dark = result.ramps[0].modes!.find((m) => m.name === "dark")!;
		expect(dark.steps[0].value).toContain("oklch");
	});
});

// =========================================================================
// CSS: Tailwind-style ramps
// =========================================================================

describe("parseColorRamp — Tailwind CSS", () => {
	test("parses --color-blue-ribbon-50 through --color-blue-ribbon-950", () => {
		const css = `
			--color-blue-ribbon-50: #edf7ff;
			--color-blue-ribbon-500: #2390ff;
			--color-blue-ribbon-950: #0f2a5c;
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].name).toBe("blue-ribbon");
		expect(result.ramps[0].steps).toHaveLength(3);
	});

	test("parses simple --color-blue-500 pattern", () => {
		const css = `
			--color-blue-50: #eff6ff;
			--color-blue-500: #3b82f6;
			--color-blue-900: #1e3a5f;
		`;
		const result = parseColorRamp(css);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].name).toBe("blue");
	});
});

// =========================================================================
// JSON
// =========================================================================

describe("parseColorRamp — JSON", () => {
	test("parses nested JSON: { red: { 1: '#fff' } }", () => {
		const json = JSON.stringify({
			red: { "1": "#fefcfb", "2": "#fff5f1", "9": "#f06b32" },
		});
		const result = parseColorRamp(json);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].name).toBe("red");
		expect(result.ramps[0].steps).toHaveLength(3);
	});

	test("parses flat JSON: { 'red-1': '#fff' }", () => {
		const json = JSON.stringify({
			"red-1": "#fefcfb",
			"red-2": "#fff5f1",
			"blue-500": "#3b82f6",
		});
		const result = parseColorRamp(json);
		expect(result.ramps).toHaveLength(2);
	});

	test("handles --prefixed keys in flat JSON", () => {
		const json = JSON.stringify({
			"--color-red-500": "#ef4444",
			"--color-red-600": "#dc2626",
		});
		const result = parseColorRamp(json);
		expect(result.ramps).toHaveLength(1);
		expect(result.ramps[0].name).toBe("red");
	});
});

// =========================================================================
// Edge cases
// =========================================================================

describe("parseColorRamp — edge cases", () => {
	test("returns error for empty input", () => {
		const result = parseColorRamp("");
		expect(result.ramps).toHaveLength(0);
		expect(result.errors).toHaveLength(1);
	});

	test("returns error for invalid JSON", () => {
		const result = parseColorRamp("{ invalid json");
		expect(result.ramps).toHaveLength(0);
		expect(result.errors.some((e) => e.severity === "error")).toBe(true);
	});

	test("handles CSS with no custom properties", () => {
		const result = parseColorRamp("body { color: red; }");
		expect(result.ramps).toHaveLength(0);
	});

	test("warns on unparseable color values", () => {
		const css = "--red-1: notacolor;";
		const result = parseColorRamp(css);
		expect(result.errors.some((e) => e.severity === "warning")).toBe(true);
	});
});

// =========================================================================
// rampsToTokens
// =========================================================================

describe("rampsToTokens", () => {
	test("converts ramps to DesignToken[] with correct figmaName", () => {
		const result = parseColorRamp(`
			--red-1: #fefcfb;
			--red-9: #f06b32;
		`);
		const tokens = rampsToTokens(result.ramps);
		expect(tokens).toHaveLength(2);
		expect(tokens[0].figmaName).toBe("color/red/1");
		expect(tokens[1].figmaName).toBe("color/red/9");
		expect(tokens[0].category).toBe("primitives");
		expect(tokens[0].type).toBe("color");
		expect(tokens[0].action).toBe("import");
	});

	test("applies name overrides", () => {
		const result = parseColorRamp("--red-1: #fefcfb;");
		const overrides = new Map([["red", "brand-primary"]]);
		const tokens = rampsToTokens(result.ramps, overrides);
		expect(tokens[0].figmaName).toBe("color/brand-primary/1");
	});

	test("skips steps with unparseable colors", () => {
		const result = parseColorRamp("--red-1: notacolor; --red-2: #ff0000;");
		const tokens = rampsToTokens(result.ramps);
		expect(tokens).toHaveLength(1);
		expect(tokens[0].figmaName).toBe("color/red/2");
	});

	test("multi-mode ramps produce separate tokens per mode", () => {
		const css = `
			:root { --gray-1: #ffffff; }
			.dark { --gray-1: #000000; }
		`;
		const result = parseColorRamp(css);
		const tokens = rampsToTokens(result.ramps);
		expect(tokens).toHaveLength(2);
		expect(tokens.find((t) => t.figmaName === "color/gray/light/1")).toBeDefined();
		expect(tokens.find((t) => t.figmaName === "color/gray/dark/1")).toBeDefined();
	});
});
