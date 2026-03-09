// Token type definitions for Cipher

// Extensible token types - allows any string while providing common types for autocomplete
export type TokenType =
	| "color"
	| "spacing"
	| "sizing"
	| "fontSize"
	| "fontFamily"
	| "fontWeight"
	| "lineHeight"
	| "borderRadius"
	| "borderWidth"
	| "shadow"
	| "opacity"
	| "dimension"
	| "number"
	| "string"
	| "text"
	| "reference"
	| (string & {}); // Allows any string while keeping autocomplete

// Extensible token categories - allows any string while providing common categories
export type TokenCategory =
	| "colors"
	| "typography"
	| "spacing"
	| "effects"
	| "borders"
	| "primitives"
	| "abstractions"
	| "semantic"
	| "semantics" // Alternative spelling used in some token files
	| "radius"
	| "sizes"
	| "font" // Font family tokens
	| "brand" // Brand color tokens
	| "other"
	| (string & {}); // Allows any string while keeping autocomplete

export type TokenAction = "import" | "skip" | "overwrite";

export interface ColorValue {
	r: number; // 0-1
	g: number; // 0-1
	b: number; // 0-1
	a?: number; // 0-1
}

export interface ShadowValue {
	x: number;
	y: number;
	blur: number;
	spread: number;
	color: string | ColorValue;
}

export interface TypographyValue {
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;
	lineHeight?: number | string;
	letterSpacing?: number | string;
}

export type TokenValue =
	| string
	| number
	| ColorValue
	| ShadowValue
	| TypographyValue;

export interface ConflictInfo {
	existingId: string;
	existingName: string;
	existingValue: any;
	resolution: TokenAction;
}

export interface DesignToken {
	id: string;
	name: string; // Original name from source
	figmaName: string; // Transformed name for Figma
	value: TokenValue;
	originalValue: string; // Original string value from source
	type: TokenType;
	category: TokenCategory;
	description?: string;
	metadata?: Record<string, any>;
	action: TokenAction;
	conflict?: ConflictInfo;
}

export interface ParsedTokens {
	tokens: DesignToken[];
	stats: {
		total: number;
		byCategory: Record<string, number>; // Flexible to support any category
		conflicts: number;
		errors: number;
	};
	errors: ParseError[];
	/** Styles section from combined JSON export (paint, text, effect, grid) */
	styles?: any;
}

export interface ParseError {
	line?: number;
	token?: string;
	message: string;
	severity: "error" | "warning";
}

/** Snapshot of a variable for import undo */
export interface ImportUndoEntry {
	/** Variable ID in Figma */
	variableId: string;
	/** What the import did */
	action: "created" | "updated";
	/** For "updated": previous values by modeId */
	previousValues?: Record<string, any>;
	/** For "updated": previous description */
	previousDescription?: string;
}

/** Results from import operations (variables or styles) */
export interface ImportResults {
	success: number;
	failed: number;
	errors: string[];
	skipped: number;
	changes: Array<{
		name: string;
		type: string;
		action: "created" | "updated" | "unchanged";
		oldValue?: string;
		newValue: string;
	}>;
	/** Undo data for reverting the import */
	undoData?: ImportUndoEntry[];
}

// Simple token format for MVP
export interface SimpleTokens {
	colors?: Record<string, string>;
	spacing?: Record<string, string | number>;
	radius?: Record<string, string | number>;
	sizes?: Record<string, string | number>;
	typography?: {
		fontFamily?: Record<string, string>;
		fontSize?: Record<string, string | number>;
		fontWeight?: Record<string, string | number>;
		lineHeight?: Record<string, string | number>;
	};
}

// ============================================================================
// LEGACY MESSAGE TYPES - DEPRECATED
// Use types/messages.ts for type-safe message handling instead
// These are kept for backwards compatibility
// ============================================================================

/** @deprecated Use UIToMainMessageType or MainToUIMessageType from types/messages.ts */
export type MessageType =
	| "parse-tokens"
	| "tokens-parsed"
	| "create-variables"
	| "variables-created"
	| "progress-update"
	| "error";

export interface Message {
	type: MessageType;
	data?: any;
}

export interface ParseTokensMessage extends Message {
	type: "parse-tokens";
	data: {
		content: string;
		format: "json" | "css";
	};
}

export interface TokensParsedMessage extends Message {
	type: "tokens-parsed";
	data: ParsedTokens;
}

export interface CreateVariablesMessage extends Message {
	type: "create-variables";
	data: {
		tokens: DesignToken[];
		collectionName: string;
		importMode?: "import" | "override";
		selectedCollections?: string[];
		/** Styles section from combined JSON export — imported after variables */
		stylesData?: any;
	};
}

export interface VariablesCreatedMessage extends Message {
	type: "variables-created";
	data: {
		success: number;
		failed: number;
		errors: string[];
	};
}

export interface ProgressUpdateMessage extends Message {
	type: "progress-update";
	data: {
		current: number;
		total: number;
		message: string;
	};
}

export interface ErrorMessage extends Message {
	type: "error";
	data: {
		message: string;
		details?: any;
	};
}
