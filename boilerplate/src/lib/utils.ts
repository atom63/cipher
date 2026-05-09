import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function preventBodyAriaHidden() {
  const observer = new MutationObserver(() => {
    if (document.body.hasAttribute('aria-hidden')) {
      document.body.removeAttribute('aria-hidden')
    }
  })
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-hidden'],
  })
}
