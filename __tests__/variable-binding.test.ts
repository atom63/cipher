import { beforeEach, describe, expect, test } from "vitest";
import { isVariableAlias } from "../src/libraries/variable-binding";

// Mock the figma global for functions that need it
const mockVariables = new Map<string, Record<string, unknown>>();
const mockCollections = new Map<string, Record<string, unknown>>();

beforeEach(() => {
	mockVariables.clear();
	mockCollections.clear();

	(globalThis as unknown as { figma: unknown }).figma = {
		variables: {
			getVariableById: (id: string) => mockVariables.get(id) ?? null,
			getVariableCollectionById: (id: string) =>
				mockCollections.get(id) ?? null,
		},
	};
});

// Helper to set up a mock variable + collection
function addMockVariable(
	id: string,
	name: string,
	collectionId: string,
	collectionName: string,
) {
	mockVariables.set(id, {
		id,
		name,
		variableCollectionId: collectionId,
	});
	if (!mockCollections.has(collectionId)) {
		mockCollections.set(collectionId, {
			id: collectionId,
			name: collectionName,
		});
	}
}

describe("isVariableAlias", () => {
	test("identifies valid variable alias", () => {
		expect(
			isVariableAlias({ type: "VARIABLE_ALIAS", id: "VariableID:1:1" }),
		).toBe(true);
	});

	test("rejects non-alias objects", () => {
		expect(isVariableAlias({ type: "OTHER", id: "123" })).toBe(false);
		expect(isVariableAlias({ type: "VARIABLE_ALIAS" })).toBe(false); // no id
		expect(isVariableAlias(null)).toBe(false);
		expect(isVariableAlias(undefined)).toBe(false);
		expect(isVariableAlias("string")).toBe(false);
		expect(isVariableAlias(42)).toBe(false);
		expect(isVariableAlias({})).toBe(false);
	});
});

describe("getBoundVariable", () => {
	// Import dynamically after mock is set up
	test("resolves bound variable from paint", async () => {
		addMockVariable("VariableID:1:1", "color/primary", "col:1", "primitives");

		const { getBoundVariable } = await import("../src/libraries/variable-binding");
		const paint = {
			boundVariables: {
				color: { type: "VARIABLE_ALIAS", id: "VariableID:1:1" },
			},
		};

		const result = getBoundVariable(paint, "color");
		expect(result).not.toBeNull();
		expect(result?.variableName).toBe("color/primary");
		expect(result?.collectionName).toBe("primitives");
		expect(result?.variableId).toBe("VariableID:1:1");
	});

	test("returns null for unbound paint", async () => {
		const { getBoundVariable } = await import("../src/libraries/variable-binding");
		const paint = { boundVariables: {} };
		expect(getBoundVariable(paint, "color")).toBeNull();
	});

	test("returns null for null input", async () => {
		const { getBoundVariable } = await import("../src/libraries/variable-binding");
		expect(getBoundVariable(null, "color")).toBeNull();
		expect(getBoundVariable(undefined, "color")).toBeNull();
	});

	test("returns null when variable not found", async () => {
		const { getBoundVariable } = await import("../src/libraries/variable-binding");
		const paint = {
			boundVariables: {
				color: { id: "VariableID:999:999" },
			},
		};
		expect(getBoundVariable(paint, "color")).toBeNull();
	});
});

describe("resolveVariableReference", () => {
	test("resolves to token path format", async () => {
		addMockVariable("VariableID:1:1", "color/zinc/50", "col:1", "primitives");

		const { resolveVariableReference } = await import(
			"../src/libraries/variable-binding"
		);
		const result = resolveVariableReference("VariableID:1:1");
		expect(result).toBe("{primitives.color.zinc.50}");
	});

	test("returns null for unknown variable", async () => {
		const { resolveVariableReference } = await import(
			"../src/libraries/variable-binding"
		);
		expect(resolveVariableReference("VariableID:999:999")).toBeNull();
	});

	test("handles variables with slashes in name", async () => {
		addMockVariable("VariableID:2:1", "spacing/padding/lg", "col:2", "tokens");

		const { resolveVariableReference } = await import(
			"../src/libraries/variable-binding"
		);
		const result = resolveVariableReference("VariableID:2:1");
		expect(result).toBe("{tokens.spacing.padding.lg}");
	});
});

describe("getAllBoundVariables", () => {
	test("returns all bound properties", async () => {
		addMockVariable("VariableID:1:1", "shadow/color", "col:1", "tokens");
		addMockVariable("VariableID:2:1", "shadow/radius", "col:1", "tokens");

		const { getAllBoundVariables } = await import(
			"../src/libraries/variable-binding"
		);
		const effect = {
			boundVariables: {
				color: { id: "VariableID:1:1" },
				radius: { id: "VariableID:2:1" },
			},
		};

		const result = getAllBoundVariables(effect, ["color", "radius", "spread"]);
		expect(result.color).toBeDefined();
		expect(result.radius).toBeDefined();
		expect(result.spread).toBeUndefined();
	});
});
