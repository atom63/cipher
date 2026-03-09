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
	a?: number; // 0-1
	b: number; // 0-1
	g: number; // 0-1
	r: number; // 0-1
}

export interface ShadowValue {
	blur: number;
	color: string | ColorValue;
	spread: number;
	x: number;
	y: number;
}

export interface TypographyValue {
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;
	letterSpacing?: number | string;
	lineHeight?: number | string;
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
	action: TokenAction;
	category: TokenCategory;
	conflict?: ConflictInfo;
	description?: string;
	figmaName: string; // Transformed name for Figma
	id: string;
	metadata?: Record<string, any>;
	name: string; // Original name from source
	originalValue: string; // Original string value from source
	type: TokenType;
	value: TokenValue;
}

export interface ParsedTokens {
	errors: ParseError[];
	stats: {
		total: number;
		byCategory: Record<string, number>; // Flexible to support any category
		conflicts: number;
		errors: number;
	};
	/** Styles section from combined JSON export (paint, text, effect, grid) */
	styles?: any;
	tokens: DesignToken[];
}

export interface ParseError {
	line?: number;
	message: string;
	severity: "error" | "warning";
	token?: string;
}

/** Snapshot of a variable for import undo */
export interface ImportUndoEntry {
	/** What the import did */
	action: "created" | "updated";
	/** For "updated": previous description */
	previousDescription?: string;
	/** For "updated": previous values by modeId */
	previousValues?: Record<string, any>;
	/** Variable ID in Figma */
	variableId: string;
}

/** Results from import operations (variables or styles) */
export interface ImportResults {
	changes: Array<{
		name: string;
		type: string;
		action: "created" | "updated" | "unchanged";
		oldValue?: string;
		newValue: string;
	}>;
	errors: string[];
	failed: number;
	skipped: number;
	success: number;
	/** Undo data for reverting the import */
	undoData?: ImportUndoEntry[];
}

// Simple token format for MVP
export interface SimpleTokens {
	colors?: Record<string, string>;
	radius?: Record<string, string | number>;
	sizes?: Record<string, string | number>;
	spacing?: Record<string, string | number>;
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
	data?: any;
	type: MessageType;
}

export interface ParseTokensMessage extends Message {
	data: {
		content: string;
		format: "json" | "css";
	};
	type: "parse-tokens";
}

export interface TokensParsedMessage extends Message {
	data: ParsedTokens;
	type: "tokens-parsed";
}

export interface CreateVariablesMessage extends Message {
	data: {
		tokens: DesignToken[];
		collectionName: string;
		importMode?: "import" | "override";
		selectedCollections?: string[];
		/** Styles section from combined JSON export — imported after variables */
		stylesData?: any;
	};
	type: "create-variables";
}

export interface VariablesCreatedMessage extends Message {
	data: {
		success: number;
		failed: number;
		errors: string[];
	};
	type: "variables-created";
}

export interface ProgressUpdateMessage extends Message {
	data: {
		current: number;
		total: number;
		message: string;
	};
	type: "progress-update";
}

export interface ErrorMessage extends Message {
	data: {
		message: string;
		details?: any;
	};
	type: "error";
}
