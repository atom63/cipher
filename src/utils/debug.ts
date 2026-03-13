/**
 * Debug logging utility — gated behind a flag so production builds stay quiet.
 * Set DEBUG = true during development to see verbose import/export logs.
 */

const DEBUG = false;

export const debug = (...args: unknown[]) => {
	if (DEBUG) console.log(...args);
};
