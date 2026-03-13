import { forwardRef, useMemo } from "react";
import { tokenizeCSS } from "../../../utils/css-highlight";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
	children: string;
	language?: "css";
}

export const CodeBlock = forwardRef<HTMLPreElement, CodeBlockProps>(
	function CodeBlock({ className = "", children, language = "css", ...props }, ref) {
		const tokens = useMemo(() => {
			if (language === "css") {
				return tokenizeCSS(children);
			}
			return [{ text: children, type: "plain" as const }];
		}, [children, language]);

		return (
			<pre
				className={`${styles.pre} ${className}`}
				ref={ref}
				{...props}
			>
				<code className={styles.code}>
					{tokens.map((token, i) => (
						<span className={styles[token.type]} key={`${token.type}-${i}`}>
							{token.text}
						</span>
					))}
				</code>
			</pre>
		);
	},
);
