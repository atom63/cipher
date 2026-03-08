import { useState } from "react";
import { Palette, Sparkles, Upload } from "lucide-react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	SectionHeader,
} from "../../components/ui";
import type { ColorValue, DesignToken } from "../../types/tokens";

export interface FirstRunWizardProps {
	/** Navigate to another page (e.g. "generate" or "import") */
	onNavigate: (page: string) => void;
	/** Create starter tokens directly */
	onCreateTokens: (tokens: DesignToken[]) => void;
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

// ── Component ──────────────────────────────────────────────────────────────

type TemplateId = "starter" | "full" | "import";

interface TemplateOption {
	id: TemplateId;
	icon: React.ReactNode;
	title: string;
	description: string;
	badge?: string;
	tokenCount?: string;
}

const TEMPLATES: TemplateOption[] = [
	{
		id: "starter",
		icon: <Palette size={20} />,
		title: "Starter Kit",
		description:
			"Essential tokens: 5 colors, spacing scale, border radius",
		badge: "Quick start",
		tokenCount: "~12 variables",
	},
	{
		id: "full",
		icon: <Sparkles size={20} />,
		title: "Full System",
		description:
			"Complete design system with primitives, semantics, and themes",
		badge: "Recommended",
		tokenCount: "100+ variables",
	},
	{
		id: "import",
		icon: <Upload size={20} />,
		title: "Import Existing",
		description: "Import tokens from a JSON or CSS file",
	},
];

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
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				padding: "16px 0",
			}}
		>
			<SectionHeader
				title="Get Started"
				description="No variables yet — let's set up your design system"
			/>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "8px",
				}}
			>
				{TEMPLATES.map((tpl) => (
					<Card
						key={tpl.id}
						variant="bordered"
						padding="md"
						hover
						selected={selected === tpl.id}
						onClick={() => setSelected(tpl.id)}
					>
						<CardHeader>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
								}}
							>
								{tpl.icon}
								<CardTitle>{tpl.title}</CardTitle>
								{tpl.badge && (
									<Badge
										variant={
											tpl.id === "full"
												? "info"
												: "secondary"
										}
										size="sm"
									>
										{tpl.badge}
									</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<CardDescription>
								{tpl.description}
							</CardDescription>
							{tpl.tokenCount && (
								<span
									style={{
										fontSize: "11px",
										color: "var(--figma-color-text-tertiary, #999)",
										marginTop: "4px",
										display: "inline-block",
									}}
								>
									{tpl.tokenCount}
								</span>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<Button
				variant="primary"
				disabled={!selected || creating}
				loading={creating}
				onClick={handleConfirm}
				style={{ alignSelf: "stretch" }}
			>
				{!selected
					? "Choose a template"
					: selected === "starter"
						? "Create Starter Tokens"
						: selected === "full"
							? "Go to Generate"
							: "Go to Import"}
			</Button>
		</div>
	);
}
