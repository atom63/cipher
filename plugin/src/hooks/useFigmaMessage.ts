/**
 * Cipher - Figma Design System Plugin
 * Custom hooks for type-safe Figma message handling
 */

import { useCallback, useEffect, useRef } from "react";
import type {
	MainToUIMessage,
	MainToUIMessageType,
	UIToMainMessage,
} from "../types/messages";

/**
 * Hook to listen for messages from the Figma main thread
 *
 * @param handler - Callback function that receives typed messages
 *
 * @example
 * ```tsx
 * useFigmaMessage((msg) => {
 *   if (msg.type === 'tokens-parsed') {
 *     setTokens(msg.data.tokens)
 *   }
 *   if (msg.type === 'export-complete') {
 *     handleExport(msg.data)
 *   }
 * })
 * ```
 */
export function useFigmaMessage(
	handler: (message: MainToUIMessage) => void,
): void {
	// Use ref to avoid stale closure issues
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			const msg = event.data?.pluginMessage;
			if (msg && typeof msg === "object" && "type" in msg) {
				handlerRef.current(msg as MainToUIMessage);
			}
		};

		window.addEventListener("message", listener);
		return () => window.removeEventListener("message", listener);
	}, []);
}

/**
 * Hook to listen for a specific message type from the Figma main thread
 *
 * @param type - The message type to listen for
 * @param handler - Callback function that receives the message data
 *
 * @example
 * ```tsx
 * useFigmaMessageType('tokens-parsed', (data) => {
 *   // data is typed as ParsedTokens
 *   setTokens(data.tokens)
 * })
 * ```
 */
export function useFigmaMessageType<T extends MainToUIMessageType>(
	type: T,
	handler: (
		data: Extract<MainToUIMessage, { type: T }> extends { data: infer D }
			? D
			: never,
	) => void,
): void {
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			const msg = event.data?.pluginMessage;
			if (msg && typeof msg === "object" && msg.type === type) {
				handlerRef.current(msg.data);
			}
		};

		window.addEventListener("message", listener);
		return () => window.removeEventListener("message", listener);
	}, [type]);
}

/**
 * Hook to send messages to the Figma main thread
 *
 * @returns A memoized function to post messages
 *
 * @example
 * ```tsx
 * const postMessage = usePostMessage()
 *
 * // Send a message with data
 * postMessage({ type: 'parse-tokens', data: { content: jsonString } })
 *
 * // Send a message without data
 * postMessage({ type: 'close' })
 * ```
 */
export function usePostMessage(): (message: UIToMainMessage) => void {
	return useCallback((message: UIToMainMessage) => {
		parent.postMessage({ pluginMessage: message }, "*");
	}, []);
}

/**
 * Hook that provides both message listening and sending capabilities
 *
 * @param handler - Callback function that receives typed messages
 * @returns A memoized function to post messages
 *
 * @example
 * ```tsx
 * const postMessage = useFigmaMessages((msg) => {
 *   if (msg.type === 'collections-list') {
 *     setCollections(msg.data.collections)
 *   }
 * })
 *
 * // Request collections
 * postMessage({ type: 'get-collections' })
 * ```
 */
export function useFigmaMessages(
	handler: (message: MainToUIMessage) => void,
): (message: UIToMainMessage) => void {
	useFigmaMessage(handler);
	return usePostMessage();
}

/**
 * Hook to request data from the main thread on mount
 *
 * @param messageType - The message type to send on mount
 *
 * @example
 * ```tsx
 * // Request collections when component mounts
 * useRequestOnMount('get-collections')
 * ```
 */
export function useRequestOnMount(
	messageType: Extract<
		UIToMainMessage,
		{ type: string; data?: undefined }
	>["type"],
): void {
	const postMessage = usePostMessage();

	useEffect(() => {
		postMessage({ type: messageType } as UIToMainMessage);
	}, [messageType, postMessage]);
}
