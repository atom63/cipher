import { Check, Copy } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { copyText } from "../../../utils/clipboard";
import { useToast } from "../Toast";
import { Button } from "../Button";
import styles from "./CopyButton.module.css";

interface CopyButtonProps {
	/** The text to copy, or a function that returns it (for lazy evaluation) */
	text: string | (() => string);
	/** Toast label shown after copying (e.g. "CSS", "all CSS") */
	label?: string;
	/** Button variant — defaults to ghost */
	variant?: "ghost" | "outline" | "soft";
	/** Button size — defaults to md */
	size?: "sm" | "md" | "icon-xs" | "icon-sm" | "icon";
	/** Optional children for labeled buttons. If omitted, renders icon-only. */
	children?: React.ReactNode;
	/** Additional class name */
	className?: string;
	/** Whether the button is disabled */
	disabled?: boolean;
	/** Icon size in px */
	iconSize?: number;
	/** onClick passthrough (e.g. for stopPropagation) */
	onClick?: (e: React.MouseEvent) => void;
}

const CHECK_DURATION = 1500;

export function CopyButton({
	text,
	label,
	variant = "ghost",
	size,
	children,
	className,
	disabled,
	iconSize,
	onClick,
}: CopyButtonProps) {
	const [copied, setCopied] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout>>();
	const { showSuccess, showError } = useToast();

	const resolvedIconSize = iconSize ?? (size?.startsWith("icon") ? 12 : 14);
	const resolvedSize = size ?? (children ? "md" : "icon-sm");

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			onClick?.(e);
			const value = typeof text === "function" ? text() : text;
			if (!value) return;

			copyText(value)
				.then(() => {
					setCopied(true);
					showSuccess(`Copied${label ? ` ${label}` : ""}`);
					clearTimeout(timerRef.current);
					timerRef.current = setTimeout(() => setCopied(false), CHECK_DURATION);
				})
				.catch(() => showError("Failed to copy"));
		},
		[text, label, onClick, showSuccess, showError],
	);

	return (
		<Button
			className={`${styles.copyButton} ${copied ? styles.copied : ""} ${className ?? ""}`}
			disabled={disabled}
			onClick={handleClick}
			size={resolvedSize}
			variant={variant}
		>
			<span className={styles.iconWrap}>
				<Copy className={styles.iconCopy} size={resolvedIconSize} />
				<Check className={styles.iconCheck} size={resolvedIconSize} />
			</span>
			{children}
		</Button>
	);
}
