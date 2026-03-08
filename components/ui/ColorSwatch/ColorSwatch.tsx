import styles from "./ColorSwatch.module.css";

interface ColorSwatchProps {
	/** CSS color value (hex, rgb, oklch, etc.) */
	color: string;
	/** Optional opacity (0–1) applied to the color fill */
	opacity?: number;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	className?: string;
	title?: string;
}

export function ColorSwatch({
	color,
	opacity,
	size = "md",
	className,
	title,
}: ColorSwatchProps) {
	return (
		<span
			className={`${styles.swatch} ${styles[size]} ${className || ""}`}
			title={title}
		>
			<span
				className={styles.fill}
				style={{ backgroundColor: color, opacity }}
			/>
		</span>
	);
}

interface GradientSwatchProps {
	/** CSS gradient string (e.g. "linear-gradient(90deg, #f00, #00f)") */
	gradient: string;
	/** Optional opacity */
	opacity?: number;
	size?: "sm" | "md" | "lg";
	className?: string;
	title?: string;
}

export function GradientSwatch({
	gradient,
	opacity,
	size = "md",
	className,
	title,
}: GradientSwatchProps) {
	return (
		<span
			className={`${styles.swatch} ${styles[size]} ${className || ""}`}
			title={title}
		>
			<span
				className={styles.fill}
				style={{ background: gradient, opacity }}
			/>
		</span>
	);
}
