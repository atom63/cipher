import { Palette, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { Badge, Button } from "../../components/ui";
import type { ColorValue, DesignToken } from "../../types/tokens";
import styles from "./FirstRunWizard.module.css";

export interface FirstRunWizardProps {
	/** Create starter tokens directly */
	onCreateTokens: (tokens: DesignToken[]) => void;
	/** Navigate to another page (e.g. "generate" or "import") */
	onNavigate: (page: string) => void;
}

// ── Starter Kit token definitions ──────────────────────────────────────────

function hex(r: number, g: number, b: number): ColorValue {
	return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
}

const STARTER_COLORS: { name: string; value: ColorValue; hex: string }[] = [
	{ name: "primary", value: hex(59, 130, 246), hex: "#3B82F6" },
	{ name: "secondary", value: hex(100, 116, 139), hex: "#64748B" },
	{ name: "accent", value: hex(168, 85, 247), hex: "#A855F7" },
	{ name: "destructive", value: hex(239, 68, 68), hex: "#EF4444" },
	{ name: "muted", value: hex(148, 163, 184), hex: "#94A3B8" },
];

const STARTER_SPACING: { name: string; value: number }[] = [
	{ name: "sm", value: 4 },
	{ name: "md", value: 8 },
	{ name: "lg", value: 16 },
	{ name: "xl", value: 32 },
];

const STARTER_RADIUS: { name: string; value: number }[] = [
	{ name: "sm", value: 4 },
	{ name: "md", value: 8 },
	{ name: "lg", value: 16 },
];

function buildStarterTokens(): DesignToken[] {
	const tokens: DesignToken[] = [];
	let id = 0;

	for (const c of STARTER_COLORS) {
		tokens.push({
			id: `starter-color-${id++}`,
			name: `brand/${c.name}`,
			figmaName: `brand/${c.name}`,
			value: c.value,
			originalValue: c.hex,
			type: "color",
			category: "colors",
			action: "import",
		});
	}

	for (const s of STARTER_SPACING) {
		tokens.push({
			id: `starter-spacing-${id++}`,
			name: `spacing/${s.name}`,
			figmaName: `spacing/${s.name}`,
			value: s.value,
			originalValue: `${s.value}`,
			type: "spacing",
			category: "spacing",
			action: "import",
		});
	}

	for (const r of STARTER_RADIUS) {
		tokens.push({
			id: `starter-radius-${id++}`,
			name: `radius/${r.name}`,
			figmaName: `radius/${r.name}`,
			value: r.value,
			originalValue: `${r.value}`,
			type: "borderRadius",
			category: "radius",
			action: "import",
		});
	}

	return tokens;
}

// ── Templates ──────────────────────────────────────────────────────────────

type TemplateId = "starter" | "full" | "import";

interface TemplateOption {
	badge?: string;
	description: string;
	icon: React.ReactNode;
	id: TemplateId;
	meta?: string;
	title: string;
}

const TEMPLATES: TemplateOption[] = [
	{
		id: "starter",
		icon: <Palette size={18} />,
		title: "Starter Kit",
		description: "5 brand colors, spacing scale, border radius",
		badge: "Quick start",
		meta: "12 variables",
	},
	{
		id: "full",
		icon: <Sparkles size={18} />,
		title: "Generate System",
		description:
			"Build a complete token system from Radix or Tailwind palettes",
		badge: "Recommended",
		meta: "100+ variables",
	},
	{
		id: "import",
		icon: <Upload size={18} />,
		title: "Import Tokens",
		description: "Import from a JSON or CSS file",
	},
];

// ── Component ──────────────────────────────────────────────────────────────

export function FirstRunWizard({
	onNavigate,
	onCreateTokens,
}: FirstRunWizardProps) {
	const [selected, setSelected] = useState<TemplateId | null>(null);
	const [creating, setCreating] = useState(false);

	function handleConfirm() {
		if (!selected) return;

		switch (selected) {
			case "starter": {
				setCreating(true);
				const tokens = buildStarterTokens();
				onCreateTokens(tokens);
				break;
			}
			case "full":
				onNavigate("generate");
				break;
			case "import":
				onNavigate("import");
				break;
		}
	}

	return (
		<div className={styles.wizard}>
			<div className={styles.header}>
				<h3 className={styles.title}>Get Started</h3>
				<p className={styles.subtitle}>
					No variables yet. Choose how to set up your design system.
				</p>
			</div>

			<div className={styles.templates}>
				{TEMPLATES.map((tpl) => (
					<div
						className={styles.template}
						data-selected={selected === tpl.id}
						key={tpl.id}
						onClick={() => setSelected(tpl.id)}
					>
						<div className={styles.templateIcon}>{tpl.icon}</div>
						<div className={styles.templateBody}>
							<div className={styles.templateTitle}>
								{tpl.title}
								{tpl.badge && (
									<Badge
										size="sm"
										variant={tpl.id === "full" ? "info" : "secondary"}
									>
										{tpl.badge}
									</Badge>
								)}
							</div>
							<p className={styles.templateDesc}>{tpl.description}</p>
							{tpl.meta && (
								<span className={styles.templateMeta}>{tpl.meta}</span>
							)}
						</div>
					</div>
				))}
			</div>

			<Button
				className={styles.confirm}
				disabled={!selected || creating}
				loading={creating}
				onClick={handleConfirm}
				style={{ alignSelf: "stretch" }}
				variant="primary"
			>
				{!selected
					? "Choose a template"
					: selected === "starter"
						? "Create Starter Tokens"
						: selected === "full"
							? "Open Generator"
							: "Open Import"}
			</Button>
		</div>
	);
}
