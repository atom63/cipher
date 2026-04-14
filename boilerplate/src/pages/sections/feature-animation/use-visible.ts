import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref and a boolean indicating whether the element is visible
 * in the viewport. Animation loops should check this to pause when off-screen,
 * avoiding unnecessary state updates and re-renders.
 */
export function useVisible<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
