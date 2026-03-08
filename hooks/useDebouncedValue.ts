import { useEffect, useState } from "react";

/**
 * Returns a debounced version of the provided value.
 * The returned value only updates after the specified delay
 * has elapsed since the last change.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}
