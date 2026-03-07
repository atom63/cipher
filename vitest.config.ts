import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["__tests__/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: [
				"parsers/**/*.ts",
				"libraries/color-converters.ts",
				"libraries/variable-binding.ts",
				"types/messages.ts",
			],
			reporter: ["text", "text-summary"],
		},
	},
});
