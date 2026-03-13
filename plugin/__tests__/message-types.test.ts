import { describe, expect, test } from "vitest";
import { isMainToUIMessage, isUIToMainMessage } from "../src/types/messages";

describe("isUIToMainMessage", () => {
	const uiToMainTypes = [
		"parse-tokens",
		"get-collections",
		"get-styles",
		"get-variables",
		"create-variables",
		"export-variables",
		"export-styles",
		"export-css",
		"get-style-details",
		"import-styles",
		"delete-styles",
		"rename-styles",
		"duplicate-styles",
		"edit-styles",
		"rename-variables",
		"check-dependencies",
		"delete-variables",
		"restore-variables",
		"move-variables",
		"duplicate-variables",
		"update-variable-values",
		"scan-rebind",
		"apply-rebind",
		"undo-rebind",
		"undo-import",
		"swap-references",
		"scale-variable-values",
		"check-import-conflicts",
		"resize-window",
		"load-settings",
		"save-settings",
		"close",
	];

	test("recognizes all UI→Main message types", () => {
		for (const type of uiToMainTypes) {
			expect(isUIToMainMessage({ type })).toBe(true);
		}
	});

	test("rejects Main→UI message types", () => {
		expect(isUIToMainMessage({ type: "tokens-parsed" })).toBe(false);
		expect(isUIToMainMessage({ type: "collections-list" })).toBe(false);
		expect(isUIToMainMessage({ type: "export-complete" })).toBe(false);
	});

	test("rejects invalid inputs", () => {
		expect(isUIToMainMessage(null)).toBe(false);
		expect(isUIToMainMessage(undefined)).toBe(false);
		expect(isUIToMainMessage("string")).toBe(false);
		expect(isUIToMainMessage(42)).toBe(false);
		expect(isUIToMainMessage({})).toBe(false);
		expect(isUIToMainMessage({ type: "nonexistent" })).toBe(false);
	});
});

describe("isMainToUIMessage", () => {
	const mainToUITypes = [
		"tokens-parsed",
		"collections-list",
		"styles-list",
		"variables-list",
		"variables-created",
		"variables-renamed",
		"variables-deleted",
		"variables-restored",
		"variables-moved",
		"variables-duplicated",
		"variable-values-updated",
		"import-complete",
		"export-complete",
		"styles-export-complete",
		"css-export-complete",
		"style-details-list",
		"styles-deleted",
		"styles-renamed",
		"styles-duplicated",
		"styles-edited",
		"rebind-suggestions",
		"rebind-applied",
		"rebind-undone",
		"import-undone",
		"references-swapped",
		"variable-values-scaled",
		"import-conflicts-result",
		"dependency-check-result",
		"export-error",
		"progress-update",
		"error",
		"settings-loaded",
	];

	test("recognizes all Main→UI message types", () => {
		for (const type of mainToUITypes) {
			expect(isMainToUIMessage({ type })).toBe(true);
		}
	});

	test("rejects UI→Main message types", () => {
		expect(isMainToUIMessage({ type: "parse-tokens" })).toBe(false);
		expect(isMainToUIMessage({ type: "create-variables" })).toBe(false);
	});

	test("rejects invalid inputs", () => {
		expect(isMainToUIMessage(null)).toBe(false);
		expect(isMainToUIMessage(undefined)).toBe(false);
		expect(isMainToUIMessage({})).toBe(false);
	});
});

describe("message type symmetry", () => {
	test("no message type belongs to both unions", () => {
		const allTypes = [
			"parse-tokens",
			"get-collections",
			"create-variables",
			"close",
			"tokens-parsed",
			"collections-list",
			"variables-created",
			"error",
		];

		for (const type of allTypes) {
			const msg = { type };
			const isUI = isUIToMainMessage(msg);
			const isMain = isMainToUIMessage(msg);
			// A message should only belong to one direction
			expect(isUI && isMain).toBe(false);
		}
	});
});
