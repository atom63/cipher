import { useState } from "react";
import { AnimatedLogo } from "../components/common/icon/cipher/app-logo";
import { ScrollArea } from "../components/ui";
import styles from "./AboutPage.module.css";

const PRIVACY_POLICY = `Cipher is a local-only beta plugin. It does not require accounts, collect personal information, or transmit design data to external servers.

No analytics, tracking, or telemetry is used.

Cipher does not sell personal data. This policy will be updated if features such as accounts, cloud sync, or analytics are introduced.

For questions, contact yz.atom63@gmail.com`;

const TERMS_OF_USE = `By using Cipher, you agree to these terms. Cipher is a Figma plugin for importing, exporting, and synchronizing design tokens, provided as a beta product.

Cipher is provided as-is. Features may change or be removed at any time. You are responsible for reviewing outputs and maintaining your own backups.

Cipher is not affiliated with or endorsed by Figma. To the maximum extent permitted by law, Cipher and its creator are not liable for indirect, incidental, or consequential damages.

For questions, contact yz.atom63@gmail.com`;

type LegalView = null | "privacy" | "terms";

export function AboutPage() {
	const [legalView, setLegalView] = useState<LegalView>(null);

	return (
		<div className={styles.about}>
			<div className={styles.hero}>
				<AnimatedLogo colored height={48} variant="vertical" />
				<span className={styles.version}>v1.0.0-beta</span>
				<p className={styles.tagline}>
					A highly opinionated token system for Figma. Import, export,
					and sync design tokens with clarity and structure.
				</p>
			</div>

			<div className={styles.section}>
				<div className={styles.infoList}>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>Author</span>
						<a className={styles.infoLink} href="https://atom63.io" rel="noopener noreferrer" target="_blank">You Zhang (ATOM63)</a>
					</div>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>Contact</span>
						<a className={styles.infoLink} href="mailto:yz.atom63@gmail.com">yz.atom63@gmail.com</a>
					</div>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>Platform</span>
						<span className={styles.infoValue}>Figma Plugin</span>
					</div>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>License</span>
						<span className={styles.infoValue}>MIT</span>
					</div>
				</div>
			</div>

			<div className={styles.legalSection}>
				<div className={styles.legalLinks}>
					<button
						className={`${styles.legalLink} ${legalView === "privacy" ? styles.legalLinkActive : ""}`}
						onClick={() => setLegalView(legalView === "privacy" ? null : "privacy")}
						type="button"
					>
						Privacy Policy
					</button>
					<span className={styles.legalDot} />
					<button
						className={`${styles.legalLink} ${legalView === "terms" ? styles.legalLinkActive : ""}`}
						onClick={() => setLegalView(legalView === "terms" ? null : "terms")}
						type="button"
					>
						Terms of Use
					</button>
				</div>

				{legalView && (
					<ScrollArea className={styles.legalContent}>
						<p className={styles.legalText}>
							{legalView === "privacy" ? PRIVACY_POLICY : TERMS_OF_USE}
						</p>
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
