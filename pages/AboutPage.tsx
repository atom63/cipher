import { AnimatedLogo } from "../components/common/icon/cipher/app-logo";
import { SectionHeader } from "../components/ui";
import styles from "./AboutPage.module.css";

export function AboutPage() {
	return (
		<div className={styles.about}>
			<SectionHeader title="About" variant="primary" />

			<div className={styles.hero}>
				<AnimatedLogo colored height={32} />
				<span className={styles.version}>v1.0.0</span>
				<p className={styles.tagline}>
					A design system token manager for Figma. Generate, customize,
					and sync token systems without leaving your design workflow.
				</p>
			</div>

			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>Details</h3>
				<div className={styles.infoList}>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>Author</span>
						<span className={styles.infoValue}>You Zhang (ATOM63)</span>
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

			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>Stack</h3>
				<div className={styles.infoList}>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>UI</span>
						<span className={styles.infoValueMono}>React 18 + TypeScript</span>
					</div>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>Bundler</span>
						<span className={styles.infoValueMono}>esbuild</span>
					</div>
					<div className={styles.infoRow}>
						<span className={styles.infoLabel}>Icons</span>
						<span className={styles.infoValueMono}>Lucide</span>
					</div>
				</div>
			</div>

			<div className={styles.footer}>
				Made with precision by ATOM63
			</div>
		</div>
	);
}
