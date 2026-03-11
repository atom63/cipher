import { AnimatedLogo } from "../components/common/icon/cipher/app-logo";
import styles from "./AboutPage.module.css";

export function AboutPage() {
	return (
		<div className={styles.about}>
			<div className={styles.hero}>
				<AnimatedLogo colored height={48} variant="vertical" />
				<span className={styles.version}>v1.0.0-beta</span>
				<p className={styles.tagline}>
					A design system token manager for Figma. Generate, customize,
					and sync token systems without leaving your design workflow.
				</p>
			</div>

			<div className={styles.section}>
				<div className={styles.infoList}>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>Author</span>
						<a className={styles.infoLink} href="https://atom63.io" rel="noopener noreferrer" target="_blank">You Zhang (ATOM63)</a>
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
		</div>
	);
}
