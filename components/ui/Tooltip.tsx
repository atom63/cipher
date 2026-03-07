import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipState {
	text: string;
	x: number;
	y: number;
	pos: "top" | "bottom" | "right";
}

/**
 * Global tooltip renderer. Mount once at the app root.
 * Shows tooltips for any element with a `data-tooltip` attribute.
 * Uses position:fixed via portal so overflow:hidden can never clip it.
 */
export function TooltipPortal() {
	const [tip, setTip] = useState<TooltipState | null>(null);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout> | null = null;

		const show = (e: Event) => {
			const target = e.target;
			if (!(target instanceof HTMLElement)) return;
			const el = target.closest("[data-tooltip]") as HTMLElement | null;
			if (!el) return;
			const text = el.getAttribute("data-tooltip");
			if (!text) return;

			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => {
				const rect = el.getBoundingClientRect();
				const pos =
					(el.getAttribute("data-tooltip-pos") as TooltipState["pos"]) || "top";

				let x: number, y: number;
				if (pos === "bottom") {
					x = rect.left + rect.width / 2;
					y = rect.bottom + 6;
				} else if (pos === "right") {
					x = rect.right + 6;
					y = rect.top + rect.height / 2;
				} else {
					x = rect.left + rect.width / 2;
					y = rect.top - 6;
				}
				setTip({ text, x, y, pos });
			}, 400);
		};

		const hide = () => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			setTip(null);
		};

		document.addEventListener("mouseenter", show, true);
		document.addEventListener("mouseleave", hide, true);
		document.addEventListener("mousedown", hide, true);
		document.addEventListener("scroll", hide, true);

		return () => {
			if (timeout) clearTimeout(timeout);
			document.removeEventListener("mouseenter", show, true);
			document.removeEventListener("mouseleave", hide, true);
			document.removeEventListener("mousedown", hide, true);
			document.removeEventListener("scroll", hide, true);
		};
	}, []);

	if (!tip) return null;

	const style: React.CSSProperties = {
		position: "fixed",
		zIndex: 10000,
		padding: "4px 8px",
		fontSize: "11px",
		fontWeight: 500,
		lineHeight: 1.3,
		whiteSpace: "nowrap",
		color: "var(--primary-foreground)",
		background: "var(--foreground)",
		borderRadius: "var(--radius-sm)",
		pointerEvents: "none",
		...(tip.pos === "bottom"
			? { left: tip.x, top: tip.y, transform: "translateX(-50%)" }
			: tip.pos === "right"
				? { left: tip.x, top: tip.y, transform: "translateY(-50%)" }
				: { left: tip.x, top: tip.y, transform: "translate(-50%, -100%)" }),
	};

	return createPortal(
		<div style={style} role="tooltip">
			{tip.text}
		</div>,
		document.body,
	);
}
