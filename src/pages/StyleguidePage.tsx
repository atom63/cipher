import {
	Bell,
	Cog,
	Copy,
	FolderPlus,
	Home,
	Package,
	Pencil,
	Search as SearchIcon,
	Settings,
	Shield,
	Star,
	Trash2,
	User,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Checkbox,
	CheckboxCard,
	CheckboxWithDescription,
	CheckboxWithLabel,
	ConfirmDialog,
	CountBadge,
	Dialog,
	DialogActions,
	Dropdown,
	EmptyState,
	Input,
	LoadingState,
	Radio,
	RadioCard,
	RadioGroup,
	RadioWithHelper,
	RadioWithLabel,
	SectionHeader,
	Skeleton,
	Spinner,
	StatusBadge,
	TabPanel,
	Tabs,
	Textarea,
	useToast,
} from "../components/ui";
import styles from "./StyleguidePage.module.css";

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	const full =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	return [
		Number.parseInt(full.slice(0, 2), 16),
		Number.parseInt(full.slice(2, 4), 16),
		Number.parseInt(full.slice(4, 6), 16),
	];
}

function getRelativeLuminance(r: number, g: number, b: number): number {
	const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
		c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
	);
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string): number {
	const [r1, g1, b1] = hexToRgb(hex1);
	const [r2, g2, b2] = hexToRgb(hex2);
	const l1 = getRelativeLuminance(r1, g1, b1);
	const l2 = getRelativeLuminance(r2, g2, b2);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

export function StyleguidePage() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [radioValue, setRadioValue] = useState("option1");
	const [radioGroupValue, setRadioGroupValue] = useState("medium");
	const [radioHelperValue, setRadioHelperValue] = useState("standard");
	const [radioCardValue, setRadioCardValue] = useState("basic");
	const [checkbox1, setCheckbox1] = useState(false);
	const [checkbox2, setCheckbox2] = useState(true);
	const [checkbox3, setCheckbox3] = useState(false);
	const [checkboxCard1, setCheckboxCard1] = useState(true);
	const [checkboxCard2, setCheckboxCard2] = useState(false);
	const [checkboxCard3, setCheckboxCard3] = useState(true);
	const [activeTab, setActiveTab] = useState("home");
	const { showSuccess, showError, showWarning, showInfo } = useToast();

	// --- Token Visualization: read CSS custom properties ---
	const colorTokenGroups = useMemo(
		() => [
			{
				label: "Backgrounds",
				tokens: [
					"--background",
					"--background-secondary",
					"--card",
					"--popover",
					"--muted",
				],
			},
			{
				label: "Foregrounds",
				tokens: [
					"--foreground",
					"--foreground-secondary",
					"--card-foreground",
					"--popover-foreground",
					"--muted-foreground",
				],
			},
			{
				label: "Accents",
				tokens: [
					"--primary",
					"--primary-foreground",
					"--secondary",
					"--secondary-foreground",
					"--accent",
					"--accent-foreground",
				],
			},
			{
				label: "Status",
				tokens: [
					"--destructive",
					"--destructive-foreground",
					"--success",
					"--warning",
					"--info",
				],
			},
		],
		[],
	);

	const [resolvedColors, setResolvedColors] = useState<Record<string, string>>(
		{},
	);

	useEffect(() => {
		const root = document.documentElement;
		const computed = getComputedStyle(root);
		const colors: Record<string, string> = {};
		for (const group of colorTokenGroups) {
			for (const token of group.tokens) {
				const value = computed.getPropertyValue(token).trim();
				if (value) colors[token] = value;
			}
		}
		setResolvedColors(colors);
	}, [colorTokenGroups]);

	const spacingScale = [4, 8, 12, 16, 24, 32, 48, 64];
	const typeScale = [12, 14, 16, 18, 20, 24, 32, 48];

	// --- WCAG Contrast Checker ---
	const [contrastFg, setContrastFg] = useState("#000000");
	const [contrastBg, setContrastBg] = useState("#ffffff");

	// Initialize from CSS variables
	useEffect(() => {
		const computed = getComputedStyle(document.documentElement);
		const fg = computed.getPropertyValue("--foreground").trim();
		const bg = computed.getPropertyValue("--background").trim();
		if (fg) setContrastFg(fg);
		if (bg) setContrastBg(bg);
	}, []);

	const contrastRatio = useMemo(() => {
		try {
			return getContrastRatio(contrastFg, contrastBg);
		} catch {
			return 0;
		}
	}, [contrastFg, contrastBg]);

	const wcagResults = useMemo(
		() => [
			{ label: "AA Normal", threshold: 4.5 },
			{ label: "AA Large", threshold: 3 },
			{ label: "AAA Normal", threshold: 7 },
			{ label: "AAA Large", threshold: 4.5 },
		],
		[],
	);

	return (
		<div className={styles.styleguide}>
			<SectionHeader
				description="A comprehensive showcase of all UI components and their variants"
				title="UI Component Styleguide"
				variant="primary"
			/>

			{/* Buttons */}
			<section className={styles.section}>
				<SectionHeader
					description="Various button styles, sizes, and states"
					title="Buttons"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Variants</h4>
						<div className={styles.row}>
							<Button variant="default">Default</Button>
							<Button variant="primary">Primary</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="soft">Soft</Button>
							<Button variant="ghost">Ghost</Button>
							<Button variant="destructive">Destructive</Button>
							<Button variant="destructive-ghost">Destructive Ghost</Button>
							<Button variant="destructive-soft">Destructive Soft</Button>
							<Button variant="outline">Outline</Button>
							<Button variant="link">Link</Button>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Sizes</h4>
						<div className={styles.row}>
							<Button size="sm">Small</Button>
							<Button size="md">Medium</Button>
							<Button size="lg">Large</Button>
							<Button size="icon-xs">
								<SearchIcon size={12} />
							</Button>
							<Button size="icon-sm">
								<SearchIcon size={14} />
							</Button>
							<Button size="icon">
								<SearchIcon size={16} />
							</Button>
							<Button size="icon-lg">
								<SearchIcon size={18} />
							</Button>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>States</h4>
						<div className={styles.row}>
							<Button>Default</Button>
							<Button disabled>Disabled</Button>
							<Button loading>Loading</Button>
						</div>
					</div>
				</Card>
			</section>

			{/* Dropdown */}
			<section className={styles.section}>
				<SectionHeader
					description="Dropdown menus with various configurations"
					title="Dropdown"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Variants</h4>
						<div className={styles.row}>
							<Dropdown
								options={[
									{ value: "edit", label: "Edit" },
									{ value: "duplicate", label: "Duplicate" },
									{ value: "delete", label: "Delete", danger: true },
								]}
								trigger="Primary"
								variant="primary"
							/>
							<Dropdown
								options={[
									{ value: "edit", label: "Edit" },
									{ value: "duplicate", label: "Duplicate" },
									{ value: "delete", label: "Delete", danger: true },
								]}
								trigger="Secondary"
								variant="secondary"
							/>
							<Dropdown
								options={[
									{ value: "edit", label: "Edit" },
									{ value: "duplicate", label: "Duplicate" },
									{ value: "delete", label: "Delete", danger: true },
								]}
								trigger="Ghost"
								variant="ghost"
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Sizes</h4>
						<div className={styles.row}>
							<Dropdown
								options={[
									{ value: "1", label: "Option 1" },
									{ value: "2", label: "Option 2" },
								]}
								size="sm"
								trigger="Small"
							/>
							<Dropdown
								options={[
									{ value: "1", label: "Option 1" },
									{ value: "2", label: "Option 2" },
								]}
								size="md"
								trigger="Medium"
							/>
							<Dropdown
								options={[
									{ value: "1", label: "Option 1" },
									{ value: "2", label: "Option 2" },
								]}
								size="lg"
								trigger="Large"
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>With Icons</h4>
						<div className={styles.row}>
							<Dropdown
								options={[
									{ value: "edit", label: "Edit", icon: <Pencil size={14} /> },
									{ value: "copy", label: "Copy", icon: <Copy size={14} /> },
									{
										value: "delete",
										label: "Delete",
										icon: <Trash2 size={14} />,
										danger: true,
									},
								]}
								trigger="Actions"
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Inputs */}
			<section className={styles.section}>
				<SectionHeader
					description="Text inputs and text areas"
					title="Inputs"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Input Variants</h4>
						<div className={styles.column}>
							<Input
								label="Default Input"
								placeholder="Enter text…"
								type="text"
							/>
							<Input
								defaultValue="Sample text"
								label="With Value"
								type="text"
							/>
							<Input
								disabled
								label="Disabled Input"
								placeholder="Disabled"
								type="text"
							/>
							<Input
								description="This is helper text"
								label="With Description"
								type="text"
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Textarea</h4>
						<div className={styles.column}>
							<Textarea label="Description" placeholder="Enter description…" />
							<Textarea
								description="Maximum 500 characters"
								label="With Description"
								placeholder="Type here…"
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Checkboxes */}
			<section className={styles.section}>
				<SectionHeader
					description="Various checkbox styles"
					title="Checkboxes"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Checkbox Variants</h4>
						<div className={styles.column}>
							<Checkbox
								checked={checkbox1}
								id="checkbox1"
								onChange={(e) => setCheckbox1(e.target.checked)}
							/>
							<CheckboxWithLabel
								checked={checkbox2}
								id="checkbox2"
								label="With Label"
								onChange={setCheckbox2}
							/>
							<CheckboxWithDescription
								checked={checkbox3}
								description="This checkbox includes additional description text"
								id="checkbox3"
								label="With Description"
								onChange={setCheckbox3}
							/>
							<CheckboxWithLabel
								checked={false}
								disabled
								id="checkbox4"
								label="Disabled"
								onChange={() => {}}
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Checkbox Cards</h4>
						<p className={styles.componentDescription}>
							Checkbox within a card layout - perfect for selection lists with
							icons and descriptions
						</p>
						<div className={styles.column}>
							<CheckboxCard
								checked={checkboxCard1}
								description="45 color tokens"
								icon={<FolderPlus size={20} />}
								id="card1"
								label="Primitives Collection"
								onChange={setCheckboxCard1}
							/>
							<CheckboxCard
								checked={checkboxCard2}
								description="23 semantic color tokens"
								icon={<Package size={20} />}
								id="card2"
								label="Semantic Tokens"
								onChange={setCheckboxCard2}
							/>
							<CheckboxCard
								checked={checkboxCard3}
								description="Includes experimental and beta features"
								icon={<Settings size={20} />}
								id="card3"
								label="Enable Advanced Features"
								onChange={setCheckboxCard3}
							/>
							<CheckboxCard
								checked={false}
								description="This option is not available"
								disabled
								icon={<Star size={20} />}
								id="card4"
								label="Disabled Option"
								onChange={() => {}}
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Without Icons</h4>
						<div className={styles.column}>
							<CheckboxCard
								checked={true}
								description="Works great without an icon too"
								id="card-no-icon-1"
								label="Simple Card Checkbox"
								onChange={() => {}}
							/>
							<CheckboxCard
								checked={false}
								id="card-no-icon-2"
								label="Another Option"
								onChange={() => {}}
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Radio Buttons */}
			<section className={styles.section}>
				<SectionHeader
					description="Radio buttons and radio groups"
					title="Radio Buttons"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Individual Radio</h4>
						<div className={styles.column}>
							<Radio
								checked={radioValue === "option1"}
								id="radio1"
								name="radio-demo"
								onChange={(e) =>
									setRadioValue((e.target as HTMLInputElement).value)
								}
								value="option1"
							/>
							<RadioWithLabel
								checked={radioValue === "option2"}
								id="radio2"
								label="With Label"
								name="radio-demo"
								onChange={setRadioValue}
								value="option2"
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Radio Group</h4>
						<RadioGroup
							label="Size Selection"
							name="size-group"
							onChange={setRadioGroupValue}
							options={[
								{ value: "small", label: "Small" },
								{ value: "medium", label: "Medium" },
								{ value: "large", label: "Large" },
							]}
							value={radioGroupValue}
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Inline Radio Group</h4>
						<RadioGroup
							label="Display Mode"
							name="display-group"
							onChange={() => {}}
							options={[
								{ value: "list", label: "List" },
								{ value: "grid", label: "Grid" },
								{ value: "table", label: "Table" },
							]}
							value="grid"
							variant="inline"
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Radio with Helper Text</h4>
						<div className={styles.column}>
							<RadioWithHelper
								checked={radioHelperValue === "standard"}
								helper="Basic features for individuals"
								id="radio-helper-1"
								label="Standard Plan"
								name="radio-helper"
								onChange={setRadioHelperValue}
								value="standard"
							/>
							<RadioWithHelper
								checked={radioHelperValue === "premium"}
								helper="Advanced features for teams"
								id="radio-helper-2"
								label="Premium Plan"
								name="radio-helper"
								onChange={setRadioHelperValue}
								value="premium"
							/>
							<RadioWithHelper
								checked={radioHelperValue === "enterprise"}
								helper="Custom solutions for large organizations"
								id="radio-helper-3"
								label="Enterprise Plan"
								name="radio-helper"
								onChange={setRadioHelperValue}
								value="enterprise"
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Radio Cards</h4>
						<p className={styles.componentDescription}>
							Radio buttons within a card layout - great for pricing plans or
							feature selection
						</p>
						<div className={styles.column}>
							<RadioCard
								badge="Free"
								checked={radioCardValue === "basic"}
								description="Perfect for getting started"
								icon={<Package size={20} />}
								id="radio-card-1"
								name="radio-card"
								onChange={setRadioCardValue}
								title="Basic"
								value="basic"
							/>
							<RadioCard
								badge="$9/mo"
								checked={radioCardValue === "pro"}
								description="For professional designers"
								icon={<Shield size={20} />}
								id="radio-card-2"
								name="radio-card"
								onChange={setRadioCardValue}
								title="Pro"
								value="pro"
							/>
							<RadioCard
								badge="$49/mo"
								checked={radioCardValue === "enterprise"}
								description="Advanced features for teams"
								icon={<Zap size={20} />}
								id="radio-card-3"
								name="radio-card"
								onChange={setRadioCardValue}
								title="Enterprise"
								value="enterprise"
							/>
							<RadioCard
								checked={false}
								description="Not available"
								disabled
								icon={<Star size={20} />}
								id="radio-card-4"
								name="radio-card"
								onChange={setRadioCardValue}
								title="Disabled Option"
								value="disabled"
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Alerts */}
			<section className={styles.section}>
				<SectionHeader
					description="Contextual feedback messages"
					title="Alerts"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Variants</h4>
						<div className={styles.column}>
							<Alert variant="info">
								This is an informational message to guide users.
							</Alert>
							<Alert variant="success">
								Your changes have been saved successfully.
							</Alert>
							<Alert variant="warning">
								Please review your changes before continuing.
							</Alert>
							<Alert variant="error">
								An error occurred while processing your request.
							</Alert>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>With Title</h4>
						<div className={styles.column}>
							<Alert title="Did you know?"variant="info" >
								You can export design tokens in multiple formats including
								OKLCH, HEX, and RGBA.
							</Alert>
							<Alert title="Success!"variant="success" >
								Your design tokens have been exported successfully.
							</Alert>
							<Alert title="Warning"variant="warning" >
								Some tokens were skipped during import due to type conflicts.
							</Alert>
							<Alert title="Error"variant="error" >
								Failed to export tokens. Please try again.
							</Alert>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Without Icon</h4>
						<div className={styles.column}>
							<Alert showIcon={false}variant="info" >
								This alert doesn't have an icon, showing only the text content.
							</Alert>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Custom Icon</h4>
						<div className={styles.column}>
							<Alert icon={<Star size={16} />} title="Featured"variant="info" >
								This alert uses a custom icon instead of the default one.
							</Alert>
						</div>
					</div>
				</Card>
			</section>

			{/* Badges */}
			<section className={styles.section}>
				<SectionHeader
					description="Colored labels and badges"
					title="Badges"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Variants</h4>
						<div className={styles.row}>
							<Badge variant="default">Default</Badge>
							<Badge variant="secondary">Secondary</Badge>
							<Badge variant="destructive">Destructive</Badge>
							<Badge variant="success">Success</Badge>
							<Badge variant="warning">Warning</Badge>
							<Badge variant="info">Info</Badge>
							<Badge variant="outline">Outline</Badge>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Sizes</h4>
						<div className={styles.row}>
							<Badge size="sm">Small</Badge>
							<Badge size="md">Medium</Badge>
							<Badge size="lg">Large</Badge>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Features</h4>
						<div className={styles.row}>
							<Badge pill>Pill shape</Badge>
							<Badge dot variant="success">
								With dot
							</Badge>
							<Badge dot dotAnimated variant="warning">
								Animated dot
							</Badge>
							<Badge icon={<Bell size={12} />} variant="info">
								With icon
							</Badge>
							<Badge onRemove={() => {}}removable >
								Removable
							</Badge>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Status Badges</h4>
						<div className={styles.row}>
							<StatusBadge status="online" />
							<StatusBadge status="away" />
							<StatusBadge status="busy" />
							<StatusBadge status="offline" />
							<StatusBadge status="pending" />
							<StatusBadge status="active" />
							<StatusBadge status="inactive" />
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Count Badges</h4>
						<div className={styles.row}>
							<CountBadge count={3} />
							<CountBadge count={42} />
							<CountBadge count={150} />
							<CountBadge count={0} />
						</div>
					</div>
				</Card>
			</section>

			{/* Cards */}
			<section className={styles.section}>
				<SectionHeader
					description="Container components with composition"
					title="Cards"
					variant="secondary"
				/>

				<div className={styles.cardGrid}>
					<Card variant="default">
						<CardHeader>
							<CardTitle>Default Card</CardTitle>
							<CardDescription>With header and description</CardDescription>
						</CardHeader>
						<CardContent>
							<p>
								This is a standard card with default styling using composition.
							</p>
						</CardContent>
					</Card>

					<Card variant="bordered">
						<CardHeader>
							<CardTitle>Card with Actions</CardTitle>
							<CardDescription>Cards can contain any content</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Cards can contain text, buttons, and other components.</p>
						</CardContent>
						<CardFooter>
							<Button size="sm"variant="primary" >
								Action
							</Button>
							<Button size="sm"variant="secondary" >
								Cancel
							</Button>
						</CardFooter>
					</Card>

					<Card variant="elevated">
						<CardHeader>
							<CardTitle>Elevated Card</CardTitle>
						</CardHeader>
						<CardContent>
							<p>
								Cards provide consistent spacing and visual hierarchy with
								shadows.
							</p>
						</CardContent>
					</Card>

					<Card variant="muted">
						<CardContent>
							<p>
								<strong>Muted Variant</strong> - Filled background, no border
							</p>
						</CardContent>
					</Card>

					<Card variant="outline">
						<CardContent>
							<p>
								<strong>Outline Variant</strong> - Transparent with border
							</p>
						</CardContent>
					</Card>

					<Card hover>
						<CardContent>
							<p>
								<strong>Hover Effect</strong> - Lifts on hover with shadow
							</p>
						</CardContent>
					</Card>

					<Card onClick={() => {}} selected>
						<CardContent>
							<p>
								<strong>Interactive + Selected</strong> - Clickable with
								selected state
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Loading States */}
			<section className={styles.section}>
				<SectionHeader
					description="Spinners, skeletons, and loading indicators"
					title="Loading States"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Spinner Sizes</h4>
						<div className={styles.row}>
							<Spinner size="sm" />
							<Spinner size="md" />
							<Spinner size="lg" />
							<Spinner size="xl" />
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Loading State</h4>
						<LoadingState
							hint="This may take a moment"
							message="Loading components…"
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Skeleton</h4>
						<p className={styles.componentDescription}>
							Placeholder shapes for content that hasn't loaded yet
						</p>
						<div className={styles.column}>
							<div className={styles.row}>
								<Skeleton height={40} radius="full" width={40} />
								<div
									className={styles.column}
									style={{ flex: 1, gap: "var(--spacing-sm)" }}
								>
									<Skeleton height={14} radius="sm" width="60%" />
									<Skeleton height={10} radius="sm" width="40%" />
								</div>
							</div>
							<Skeleton height={12} radius="sm" width="100%" />
							<Skeleton height={12} radius="sm" width="100%" />
							<Skeleton height={12} radius="sm" width="70%" />
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Skeleton Animations</h4>
						<div className={styles.row}>
							<div className={styles.column} style={{ flex: 1 }}>
								<p className={styles.componentDescription}>Shimmer (default)</p>
								<Skeleton
									animation="shimmer"
									height={40}
									radius="md"
									width="100%"
								/>
							</div>
							<div className={styles.column} style={{ flex: 1 }}>
								<p className={styles.componentDescription}>Pulse</p>
								<Skeleton
									animation="pulse"
									height={40}
									radius="md"
									width="100%"
								/>
							</div>
							<div className={styles.column} style={{ flex: 1 }}>
								<p className={styles.componentDescription}>None</p>
								<Skeleton
									animation="none"
									height={40}
									radius="md"
									width="100%"
								/>
							</div>
						</div>
					</div>
				</Card>
			</section>

			{/* Empty States */}
			<section className={styles.section}>
				<SectionHeader
					description="Placeholders when content is missing"
					title="Empty States"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Default</h4>
						<EmptyState
							action={<Button variant="primary">Create Item</Button>}
							description="Get started by creating your first item"
							title="No items found"
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Bordered Variant</h4>
						<EmptyState
							action={
								<Button size="sm"variant="primary" >
									Import tokens
								</Button>
							}
							description="Import a design tokens file or generate from a color palette."
							icon={<Package size={32} />}
							title="No tokens yet"
							variant="bordered"
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Compact Variant</h4>
						<EmptyState
							description="Try adjusting your search or filters."
							icon={<SearchIcon size={24} />}
							size="sm"
							title="No results"
							variant="compact"
						/>
					</div>
				</Card>
			</section>

			{/* Toasts */}
			<section className={styles.section}>
				<SectionHeader
					description="Notification messages triggered by actions"
					title="Toasts"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Trigger Toasts</h4>
						<div className={styles.row}>
							<Button
								onClick={() => showSuccess("Changes saved successfully")}
								size="sm"
								variant="primary"
							>
								Success
							</Button>
							<Button
								onClick={() => showError("Failed to delete variable")}
								size="sm"
								variant="destructive"
							>
								Error
							</Button>
							<Button
								onClick={() => showWarning("3 variables will be overwritten")}
								size="sm"
								variant="outline"
							>
								Warning
							</Button>
							<Button
								onClick={() => showInfo("Tip: Use Cmd+Z to undo")}
								size="sm"
								variant="secondary"
							>
								Info
							</Button>
						</div>
					</div>
				</Card>
			</section>

			{/* Dialogs */}
			<section className={styles.section}>
				<SectionHeader
					description="Modal dialogs and confirmation prompts"
					title="Dialogs"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Custom Dialog</h4>
						<Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>

						<Dialog
							footer={
								<DialogActions>
									<Button onClick={() => setDialogOpen(false)}variant="ghost" >
										Cancel
									</Button>
									<Button
										onClick={() => setDialogOpen(false)}
										variant="primary"
									>
										Confirm
									</Button>
								</DialogActions>
							}
							isOpen={dialogOpen}
							onClose={() => setDialogOpen(false)}
							title="Example Dialog"
						>
							<p>
								This is an example dialog with header, content, and action
								buttons.
							</p>
							<p>Dialogs can contain any content and are fully accessible.</p>
						</Dialog>
					</div>

					<div className={styles.componentGroup}>
						<h4>Confirm Dialog</h4>
						<p className={styles.componentDescription}>
							Preset for destructive confirmations with danger styling
						</p>
						<Button
							onClick={() => setConfirmOpen(true)}
							size="sm"
							variant="destructive"
						>
							Delete collection
						</Button>

						<ConfirmDialog
							cancelText="Cancel"
							confirmText="Delete collection"
							isOpen={confirmOpen}
							message="This will permanently delete the collection and all its variables. This can't be undone."
							onClose={() => setConfirmOpen(false)}
							onConfirm={() => setConfirmOpen(false)}
							title="Delete collection?"
							variant="danger"
						/>
					</div>
				</Card>
			</section>

			{/* Tabs */}
			<section className={styles.section}>
				<SectionHeader
					description="Tabbed navigation and content panels"
					title="Tabs"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Basic Tabs</h4>
						<Tabs
							activeTab={activeTab}
							onTabChange={setActiveTab}
							tabs={[
								{
									id: "home",
									label: "Home",
									icon: <Home size={16} />,
								},
								{
									id: "profile",
									label: "Profile",
									icon: <User size={16} />,
								},
								{
									id: "settings",
									label: "Settings",
									icon: <Cog size={16} />,
								},
							]}
						>
							<TabPanel activeTab={activeTab}id="home" >
								<div style={{ padding: "var(--spacing-lg)" }}>
									<h4>Home Tab Content</h4>
									<p>
										This is the content for the Home tab. Tabs help organize
										related information into separate views.
									</p>
								</div>
							</TabPanel>

							<TabPanel activeTab={activeTab}id="profile" >
								<div style={{ padding: "var(--spacing-lg)" }}>
									<h4>Profile Tab Content</h4>
									<p>
										This is the content for the Profile tab. Each tab can
										contain any component or content.
									</p>
								</div>
							</TabPanel>

							<TabPanel activeTab={activeTab}id="settings" >
								<div style={{ padding: "var(--spacing-lg)" }}>
									<h4>Settings Tab Content</h4>
									<p>
										This is the content for the Settings tab. Only the active
										tab's content is rendered.
									</p>
								</div>
							</TabPanel>
						</Tabs>
					</div>

					<div className={styles.componentGroup}>
						<h4>Tabs without Icons</h4>
						<Tabs
							activeTab="tab1"
							onTabChange={() => {}}
							tabs={[
								{ id: "tab1", label: "Overview" },
								{ id: "tab2", label: "Details" },
								{ id: "tab3", label: "Advanced" },
							]}
						>
							<TabPanel activeTab="tab1"id="tab1" >
								<div style={{ padding: "var(--spacing-lg)" }}>
									<p>Tabs can also work without icons for a simpler look.</p>
								</div>
							</TabPanel>

							<TabPanel activeTab="tab1"id="tab2" >
								<div style={{ padding: "var(--spacing-lg)" }}>
									<p>Details content...</p>
								</div>
							</TabPanel>

							<TabPanel activeTab="tab1"id="tab3" >
								<div style={{ padding: "var(--spacing-lg)" }}>
									<p>Advanced content...</p>
								</div>
							</TabPanel>
						</Tabs>
					</div>
				</Card>
			</section>

			{/* Typography & Colors Reference */}
			<section className={styles.section}>
				<SectionHeader
					description="Design tokens and variables"
					title="Typography & Colors"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Text Sizes</h4>
						<div className={styles.column}>
							<p style={{ fontSize: "var(--text-xs)" }}>Extra Small (xs)</p>
							<p style={{ fontSize: "var(--text-sm)" }}>Small (sm)</p>
							<p style={{ fontSize: "var(--text-base)" }}>Base</p>
							<p style={{ fontSize: "var(--text-md)" }}>Medium (md)</p>
							<p style={{ fontSize: "var(--text-lg)" }}>Large (lg)</p>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Font Weights</h4>
						<div className={styles.column}>
							<p style={{ fontWeight: "var(--font-normal)" }}>Normal (400)</p>
							<p style={{ fontWeight: "var(--font-medium)" }}>Medium (500)</p>
							<p style={{ fontWeight: "var(--font-semibold)" }}>
								Semibold (600)
							</p>
							<p style={{ fontWeight: "var(--font-bold)" }}>Bold (700)</p>
						</div>
					</div>
				</Card>
			</section>
			{/* Token Visualization */}
			<section className={styles.section}>
				<SectionHeader
					description="Visual representation of design tokens from CSS custom properties"
					title="Token Visualization"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Color Swatches</h4>
						{colorTokenGroups.map((group) => (
							<div key={group.label} style={{ marginBottom: 16 }}>
								<p className={styles.componentDescription}>{group.label}</p>
								<div
									style={{
										display: "grid",
										gridTemplateColumns:
											"repeat(auto-fill, minmax(140px, 1fr))",
										gap: 8,
									}}
								>
									{group.tokens.map((token) => {
										const value = resolvedColors[token];
										if (!value) return null;
										return (
											<div
												key={token}
												style={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													gap: 4,
													padding: 8,
													borderRadius: 6,
													border: "1px solid var(--border)",
												}}
											>
												<div
													style={{
														width: 48,
														height: 48,
														borderRadius: 6,
														backgroundColor: value,
														border: "1px solid var(--border)",
													}}
												/>
												<span
													style={{
														fontSize: "var(--text-xs)",
														fontWeight: "var(--font-medium)",
														textAlign: "center",
													}}
												>
													{token}
												</span>
												<span
													style={{
														fontSize: "var(--text-xs)",
														color: "var(--muted-foreground)",
													}}
												>
													{value}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>

					<div className={styles.componentGroup}>
						<h4>Spacing Scale</h4>
						<div className={styles.column}>
							{spacingScale.map((size) => (
								<div
									key={size}
									style={{ display: "flex", alignItems: "center", gap: 12 }}
								>
									<span
										style={{
											fontSize: "var(--text-xs)",
											width: 36,
											textAlign: "right",
											color: "var(--muted-foreground)",
										}}
									>
										{size}px
									</span>
									<div
										style={{
											width: size,
											height: 16,
											borderRadius: 3,
											backgroundColor: "var(--primary)",
											transition: "width 0.2s ease",
										}}
									/>
								</div>
							))}
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Typography Scale</h4>
						<div className={styles.column}>
							{typeScale.map((size) => (
								<div
									key={size}
									style={{ display: "flex", alignItems: "baseline", gap: 12 }}
								>
									<span
										style={{
											fontSize: "var(--text-xs)",
											width: 36,
											textAlign: "right",
											color: "var(--muted-foreground)",
										}}
									>
										{size}px
									</span>
									<span style={{ fontSize: size, lineHeight: 1.3 }}>
										The quick brown fox
									</span>
								</div>
							))}
						</div>
					</div>
				</Card>
			</section>

			{/* Contrast Checker */}
			<section className={styles.section}>
				<SectionHeader
					description="WCAG contrast ratio checker for color accessibility"
					title="Contrast Checker"
					variant="secondary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Color Inputs</h4>
						<div className={styles.row}>
							<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
								<label
									style={{
										fontSize: "var(--text-xs)",
										fontWeight: "var(--font-medium)",
									}}
								>
									Foreground
								</label>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<input
										onChange={(e) => setContrastFg(e.target.value)}
										style={{
											width: 36,
											height: 36,
											border: "none",
											cursor: "pointer",
											borderRadius: 4,
										}}
										type="color"
										value={contrastFg}
									/>
									<Input
										onChange={(e) =>
											setContrastFg((e.target as HTMLInputElement).value)
										}
										style={{ width: 100 }}
										type="text"
										value={contrastFg}
									/>
								</div>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
								<label
									style={{
										fontSize: "var(--text-xs)",
										fontWeight: "var(--font-medium)",
									}}
								>
									Background
								</label>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<input
										onChange={(e) => setContrastBg(e.target.value)}
										style={{
											width: 36,
											height: 36,
											border: "none",
											cursor: "pointer",
											borderRadius: 4,
										}}
										type="color"
										value={contrastBg}
									/>
									<Input
										onChange={(e) =>
											setContrastBg((e.target as HTMLInputElement).value)
										}
										style={{ width: 100 }}
										type="text"
										value={contrastBg}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Preview</h4>
						<div
							style={{
								backgroundColor: contrastBg,
								color: contrastFg,
								padding: 24,
								borderRadius: 8,
								border: "1px solid var(--border)",
								textAlign: "center",
							}}
						>
							<p style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
								Large Text Sample
							</p>
							<p style={{ fontSize: 14 }}>
								Normal text sample for contrast testing.
							</p>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Contrast Ratio</h4>
						<p style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
							{contrastRatio > 0 ? `${contrastRatio.toFixed(2)}:1` : "Invalid"}
						</p>
					</div>

					<div className={styles.componentGroup}>
						<h4>WCAG Compliance</h4>
						<div className={styles.row}>
							{wcagResults.map(({ label, threshold }) => {
								const pass = contrastRatio >= threshold;
								return (
									<Badge key={label} variant={pass ? "success" : "destructive"}>
										{label} ({threshold}:1) {pass ? "Pass" : "Fail"}
									</Badge>
								);
							})}
						</div>
					</div>
				</Card>
			</section>
		</div>
	);
}
