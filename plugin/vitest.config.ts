import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["__tests__/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: [
				"src/parsers/**/*.ts",
				"src/libraries/color-converters.ts",
				"src/libraries/variable-binding.ts",
				"src/types/messages.ts",
			],
			reporter: ["text", "text-summary"],
		},
	},
});
