import styles from "./AppLogo.module.css";
import {
	SYMBOL_L_SVG,
	SYMBOL_R_SVG,
	SYMBOL_SVG,
	WORDMARK_SVG,
} from "./primitives";

function LogoSymbol() {
	return (
		<g>
			<path d={SYMBOL_SVG.path} fill="currentColor" />
		</g>
	);
}

function LogoWordmark() {
	return (
		<g>
			<path d={WORDMARK_SVG.path} fill="currentColor" />
		</g>
	);
}

interface AnimatedSymbolProps {
	className?: string;
	colored?: boolean;
	height?: number;
}

export function AnimatedSymbol({
	height = 80,
	colored = false,
	className,
}: AnimatedSymbolProps) {
	const halfWidth = height * (43 / 80);
	const gap = height * (4 / 80);
	const shift = halfWidth + gap;

	return (
		<div
			className={`${styles.logo} ${colored ? styles.colored : ""} ${className || ""}`}
			style={{ gap, "--symbol-shift": `${shift}px` } as React.CSSProperties}
		>
			<div className={styles.spinWrapper} style={{ gap }}>
				<svg
					className={styles.symbolLeft}
					fill="none"
					height={height}
					viewBox={SYMBOL_L_SVG.viewBox}
					width={halfWidth}
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Symbol Left</title>
					<path d={SYMBOL_L_SVG.path} fill="currentColor" />
				</svg>
				<svg
					className={styles.symbolRight}
					fill="none"
					height={height}
					viewBox={SYMBOL_R_SVG.viewBox}
					width={halfWidth}
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Symbol Right</title>
					<path d={SYMBOL_R_SVG.path} fill="currentColor" />
				</svg>
			</div>
		</div>
	);
}

interface AnimatedLogoProps {
	className?: string;
	colored?: boolean;
	height?: number;
	variant?: "horizontal" | "vertical";
}

export function AnimatedLogo({
	height = 32,
	colored = false,
	className,
	variant = "horizontal",
}: AnimatedLogoProps) {
	const halfWidth = height * (43 / 80);
	const symbolGap = height * (4 / 80);
	const shift = halfWidth + symbolGap;
	const isVertical = variant === "vertical";
	const wordmarkHeight = isVertical ? height * 0.35 : height * (80 / 120);
	const logoGap = isVertical ? height * 0.3 : height / 3;

	return (
		<div
			className={`${styles.logo} ${isVertical ? styles.logoVertical : ""} ${className || ""}`}
			style={
				{
					gap: logoGap,
					"--symbol-shift": `${shift}px`,
				} as React.CSSProperties
			}
		>
			<div className={styles.spinWrapper} style={{ gap: symbolGap }}>
				<svg
					className={`${colored ? styles.colored : ""} ${styles.symbolLeft}`}
					fill="none"
					height={height}
					viewBox={SYMBOL_L_SVG.viewBox}
					width={halfWidth}
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Symbol Left</title>
					<path d={SYMBOL_L_SVG.path} fill="currentColor" />
				</svg>
				<svg
					className={`${colored ? styles.colored : ""} ${styles.symbolRight}`}
					fill="none"
					height={height}
					viewBox={SYMBOL_R_SVG.viewBox}
					width={halfWidth}
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Symbol Right</title>
					<path d={SYMBOL_R_SVG.path} fill="currentColor" />
				</svg>
			</div>
			<svg
				fill="none"
				height={wordmarkHeight}
				viewBox={WORDMARK_SVG.viewBox}
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>Wordmark</title>
				<LogoWordmark />
			</svg>
		</div>
	);
}

interface AppLogoProps {
	className?: string;
	/** Apply --primary color to the symbol mark */
	colored?: boolean;
	height?: number;
	variant?: "horizontal" | "vertical" | "symbol" | "wordmark";
}

export function AppLogo({
	variant = "horizontal",
	height = 32,
	colored = false,
	className,
}: AppLogoProps) {
	switch (variant) {
		case "horizontal": {
			const wordmarkHeight = height * (80 / 120);
			const gap = height / 3;
			return (
				<div className={`${styles.logo} ${className || ""}`} style={{ gap }}>
					<svg
						className={colored ? styles.colored : undefined}
						fill="none"
						height={height}
						viewBox={SYMBOL_SVG.viewBox}
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Symbol</title>
						<LogoSymbol />
					</svg>
					<svg
						fill="none"
						height={wordmarkHeight}
						viewBox={WORDMARK_SVG.viewBox}
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Wordmark</title>
						<LogoWordmark />
					</svg>
				</div>
			);
		}

		case "vertical": {
			const wordmarkHeight = height * 0.35;
			const gap = height * 0.3;
			return (
				<div
					className={`${styles.logo} ${styles.logoVertical} ${className || ""}`}
					style={{ gap }}
				>
					<svg
						className={colored ? styles.colored : undefined}
						fill="none"
						height={height}
						viewBox={SYMBOL_SVG.viewBox}
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Symbol</title>
						<LogoSymbol />
					</svg>
					<svg
						fill="none"
						height={wordmarkHeight}
						viewBox={WORDMARK_SVG.viewBox}
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Wordmark</title>
						<LogoWordmark />
					</svg>
				</div>
			);
		}

		case "symbol":
			return (
				<svg
					className={`${colored ? styles.colored : ""} ${className || ""}`}
					fill="none"
					height={height}
					viewBox={SYMBOL_SVG.viewBox}
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Symbol</title>
					<LogoSymbol />
				</svg>
			);

		case "wordmark":
			return (
				<svg
					className={className}
					fill="none"
					height={height}
					viewBox={WORDMARK_SVG.viewBox}
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Wordmark</title>
					<LogoWordmark />
				</svg>
			);

		default:
			return null;
	}
}
