import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Prevents aria-hidden from being set on the body element inappropriately
 * This is important for accessibility as hiding the body hides the entire accessibility tree
 * However, we allow it when legitimate dialogs/sheets are open
 */
export function preventBodyAriaHidden() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "aria-hidden"
      ) {
        const target = mutation.target as HTMLElement;
        handleAriaHiddenChange(target);
      }
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["aria-hidden"],
  });

  return () => observer.disconnect();
}

function handleAriaHiddenChange(target: HTMLElement) {
  if (target !== document.body) {
    return;
  }

  const isAriaHidden = target.getAttribute("aria-hidden") === "true";

  if (isAriaHidden) {
    handleBodyAriaHiddenSet(target);
  } else {
    handleBodyAriaHiddenRemoved();
  }
}

function handleBodyAriaHiddenSet(target: HTMLElement) {
  if (hasLegitimateModal()) {
    if (!document.body.hasAttribute("data-modal-context")) {
      document.body.setAttribute("data-modal-context", "dialog-open");
    }
  } else {
    console.warn(
      "aria-hidden was set on body element without open dialogs - removing for accessibility"
    );
    target.removeAttribute("aria-hidden");
  }
}

function handleBodyAriaHiddenRemoved() {
  document.body.removeAttribute("data-modal-context");
}

function hasLegitimateModal(): boolean {
  const hasSheetOpen = document.body.hasAttribute("data-sheet-open");
  const openDialogs = document.querySelectorAll(
    '[data-radix-dialog-root][data-state="open"]'
  );
  const openSheets = document.querySelectorAll(
    '[data-slot="sheet"][data-state="open"]'
  );
  const openAlertDialogs = document.querySelectorAll(
    '[data-radix-alert-dialog-root][data-state="open"]'
  );

  return (
    hasSheetOpen ||
    openDialogs.length > 0 ||
    openSheets.length > 0 ||
    openAlertDialogs.length > 0
  );
}
