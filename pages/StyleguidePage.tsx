import {
	Cog,
	FolderPlus,
	Home,
	Package,
	Settings,
	Shield,
	Star,
	User,
	Zap,
} from "lucide-react";
import { useState } from "react";
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
	Spinner,
	TabPanel,
	Tabs,
	Textarea,
} from "../components/ui";
import styles from "./StyleguidePage.module.css";

export function StyleguidePage() {
	const [dialogOpen, setDialogOpen] = useState(false);
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

	return (
		<div className={styles.styleguide}>
			<div className={styles.header}>
				<h1>UI Component Styleguide</h1>
				<p className={styles.subtitle}>
					A comprehensive showcase of all UI components and their variants
				</p>
			</div>

			{/* Section Headers */}
			<section className={styles.section}>
				<SectionHeader
					title="Section Headers"
					description="Page and section headers with different hierarchy levels"
					variant="primary"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Display Variant</h4>
						<p className={styles.componentDescription}>
							Largest, for major page headers with bottom border
						</p>
						<SectionHeader
							variant="display"
							title="Display Header"
							description="Use for main page titles and major sections. Includes a bottom border for clear separation."
							action={
								<Button variant="primary" size="sm">
									Action
								</Button>
							}
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Primary Variant (Default)</h4>
						<p className={styles.componentDescription}>
							Default size, prominent and clear
						</p>
						<SectionHeader
							variant="primary"
							title="Primary Header"
							description="Default header style, perfect for main sections and important content areas."
							action={
								<Button variant="secondary" size="sm">
									Action
								</Button>
							}
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Secondary Variant</h4>
						<p className={styles.componentDescription}>
							Medium size, for subsections
						</p>
						<SectionHeader
							variant="secondary"
							title="Secondary Header"
							description="Smaller header for subsections and nested content."
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Muted Variant</h4>
						<p className={styles.componentDescription}>
							Subtle and compact, for minor sections
						</p>
						<SectionHeader
							variant="muted"
							title="Muted Header"
							description="Smallest header, uppercase with letter spacing for labels and minor sections."
						/>
					</div>
				</Card>
			</section>

			{/* Buttons */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Buttons"
					description="Various button styles, sizes, and states"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Variants</h4>
						<div className={styles.row}>
							<Button variant="default">Default</Button>
							<Button variant="primary">Primary</Button>
							<Button variant="secondary">Secondary</Button>
							<Button variant="ghost">Ghost</Button>
							<Button variant="destructive">Destructive</Button>
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
							<Button size="icon">🔍</Button>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>States</h4>
						<div className={styles.row}>
							<Button>Default</Button>
							<Button disabled>Disabled</Button>
						</div>
					</div>
				</Card>
			</section>

			{/* Dropdown */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Dropdown"
					description="Dropdown menus with various configurations"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Variants</h4>
						<div className={styles.row}>
							<Dropdown
								trigger="Primary"
								variant="primary"
								options={[
									{ value: "edit", label: "Edit" },
									{ value: "duplicate", label: "Duplicate" },
									{ value: "delete", label: "Delete", danger: true },
								]}
							/>
							<Dropdown
								trigger="Secondary"
								variant="secondary"
								options={[
									{ value: "edit", label: "Edit" },
									{ value: "duplicate", label: "Duplicate" },
									{ value: "delete", label: "Delete", danger: true },
								]}
							/>
							<Dropdown
								trigger="Ghost"
								variant="ghost"
								options={[
									{ value: "edit", label: "Edit" },
									{ value: "duplicate", label: "Duplicate" },
									{ value: "delete", label: "Delete", danger: true },
								]}
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Sizes</h4>
						<div className={styles.row}>
							<Dropdown
								trigger="Small"
								size="sm"
								options={[
									{ value: "1", label: "Option 1" },
									{ value: "2", label: "Option 2" },
								]}
							/>
							<Dropdown
								trigger="Medium"
								size="md"
								options={[
									{ value: "1", label: "Option 1" },
									{ value: "2", label: "Option 2" },
								]}
							/>
							<Dropdown
								trigger="Large"
								size="lg"
								options={[
									{ value: "1", label: "Option 1" },
									{ value: "2", label: "Option 2" },
								]}
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>With Icons</h4>
						<div className={styles.row}>
							<Dropdown
								trigger="Actions"
								options={[
									{ value: "edit", label: "Edit", icon: <span>✏️</span> },
									{ value: "copy", label: "Copy", icon: <span>📋</span> },
									{
										value: "delete",
										label: "Delete",
										icon: <span>🗑️</span>,
										danger: true,
									},
								]}
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Inputs */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Inputs"
					description="Text inputs and text areas"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Input Variants</h4>
						<div className={styles.column}>
							<Input
								label="Default Input"
								placeholder="Enter text..."
								type="text"
							/>
							<Input
								label="With Value"
								defaultValue="Sample text"
								type="text"
							/>
							<Input
								label="Disabled Input"
								disabled
								placeholder="Disabled"
								type="text"
							/>
							<Input
								label="With Description"
								description="This is helper text"
								type="text"
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Textarea</h4>
						<div className={styles.column}>
							<Textarea
								label="Description"
								placeholder="Enter description..."
							/>
							<Textarea
								label="With Description"
								description="Maximum 500 characters"
								placeholder="Type here..."
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Checkboxes */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Checkboxes"
					description="Various checkbox styles"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Checkbox Variants</h4>
						<div className={styles.column}>
							<Checkbox
								id="checkbox1"
								checked={checkbox1}
								onChange={(e) => setCheckbox1(e.target.checked)}
							/>
							<CheckboxWithLabel
								id="checkbox2"
								label="With Label"
								checked={checkbox2}
								onChange={setCheckbox2}
							/>
							<CheckboxWithDescription
								id="checkbox3"
								label="With Description"
								description="This checkbox includes additional description text"
								checked={checkbox3}
								onChange={setCheckbox3}
							/>
							<CheckboxWithLabel
								id="checkbox4"
								label="Disabled"
								checked={false}
								onChange={() => {}}
								disabled
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
								id="card1"
								label="Primitives Collection"
								description="45 color tokens"
								checked={checkboxCard1}
								onChange={setCheckboxCard1}
								icon={<FolderPlus size={20} />}
							/>
							<CheckboxCard
								id="card2"
								label="Semantic Tokens"
								description="23 semantic color tokens"
								checked={checkboxCard2}
								onChange={setCheckboxCard2}
								icon={<Package size={20} />}
							/>
							<CheckboxCard
								id="card3"
								label="Enable Advanced Features"
								description="Includes experimental and beta features"
								checked={checkboxCard3}
								onChange={setCheckboxCard3}
								icon={<Settings size={20} />}
							/>
							<CheckboxCard
								id="card4"
								label="Disabled Option"
								description="This option is not available"
								checked={false}
								onChange={() => {}}
								disabled
								icon={<Star size={20} />}
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Without Icons</h4>
						<div className={styles.column}>
							<CheckboxCard
								id="card-no-icon-1"
								label="Simple Card Checkbox"
								description="Works great without an icon too"
								checked={true}
								onChange={() => {}}
							/>
							<CheckboxCard
								id="card-no-icon-2"
								label="Another Option"
								checked={false}
								onChange={() => {}}
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Radio Buttons */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Radio Buttons"
					description="Radio buttons and radio groups"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Individual Radio</h4>
						<div className={styles.column}>
							<Radio
								id="radio1"
								name="radio-demo"
								value="option1"
								checked={radioValue === "option1"}
								onChange={(e) =>
									setRadioValue((e.target as HTMLInputElement).value)
								}
							/>
							<RadioWithLabel
								id="radio2"
								name="radio-demo"
								value="option2"
								label="With Label"
								checked={radioValue === "option2"}
								onChange={setRadioValue}
							/>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Radio Group</h4>
						<RadioGroup
							label="Size Selection"
							name="size-group"
							value={radioGroupValue}
							onChange={setRadioGroupValue}
							options={[
								{ value: "small", label: "Small" },
								{ value: "medium", label: "Medium" },
								{ value: "large", label: "Large" },
							]}
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Inline Radio Group</h4>
						<RadioGroup
							label="Display Mode"
							name="display-group"
							variant="inline"
							value="grid"
							onChange={() => {}}
							options={[
								{ value: "list", label: "List" },
								{ value: "grid", label: "Grid" },
								{ value: "table", label: "Table" },
							]}
						/>
					</div>

					<div className={styles.componentGroup}>
						<h4>Radio with Helper Text</h4>
						<div className={styles.column}>
							<RadioWithHelper
								id="radio-helper-1"
								name="radio-helper"
								value="standard"
								label="Standard Plan"
								helper="Basic features for individuals"
								checked={radioHelperValue === "standard"}
								onChange={setRadioHelperValue}
							/>
							<RadioWithHelper
								id="radio-helper-2"
								name="radio-helper"
								value="premium"
								label="Premium Plan"
								helper="Advanced features for teams"
								checked={radioHelperValue === "premium"}
								onChange={setRadioHelperValue}
							/>
							<RadioWithHelper
								id="radio-helper-3"
								name="radio-helper"
								value="enterprise"
								label="Enterprise Plan"
								helper="Custom solutions for large organizations"
								checked={radioHelperValue === "enterprise"}
								onChange={setRadioHelperValue}
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
								id="radio-card-1"
								name="radio-card"
								value="basic"
								title="Basic"
								description="Perfect for getting started"
								badge="Free"
								icon={<Package size={20} />}
								checked={radioCardValue === "basic"}
								onChange={setRadioCardValue}
							/>
							<RadioCard
								id="radio-card-2"
								name="radio-card"
								value="pro"
								title="Pro"
								description="For professional designers"
								badge="$9/mo"
								icon={<Shield size={20} />}
								checked={radioCardValue === "pro"}
								onChange={setRadioCardValue}
							/>
							<RadioCard
								id="radio-card-3"
								name="radio-card"
								value="enterprise"
								title="Enterprise"
								description="Advanced features for teams"
								badge="$49/mo"
								icon={<Zap size={20} />}
								checked={radioCardValue === "enterprise"}
								onChange={setRadioCardValue}
							/>
							<RadioCard
								id="radio-card-4"
								name="radio-card"
								value="disabled"
								title="Disabled Option"
								description="Not available"
								disabled
								icon={<Star size={20} />}
								checked={false}
								onChange={setRadioCardValue}
							/>
						</div>
					</div>
				</Card>
			</section>

			{/* Alerts */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Alerts"
					description="Contextual feedback messages"
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
							<Alert variant="info" title="Did you know?">
								You can export design tokens in multiple formats including
								OKLCH, HEX, and RGBA.
							</Alert>
							<Alert variant="success" title="Success!">
								Your design tokens have been exported successfully.
							</Alert>
							<Alert variant="warning" title="Warning">
								Some tokens were skipped during import due to type conflicts.
							</Alert>
							<Alert variant="error" title="Error">
								Failed to export tokens. Please try again.
							</Alert>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Without Icon</h4>
						<div className={styles.column}>
							<Alert variant="info" showIcon={false}>
								This alert doesn't have an icon, showing only the text content.
							</Alert>
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Custom Icon</h4>
						<div className={styles.column}>
							<Alert variant="info" icon={<Star size={16} />} title="Featured">
								This alert uses a custom icon instead of the default one.
							</Alert>
						</div>
					</div>
				</Card>
			</section>

			{/* Badges */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Badges"
					description="Colored labels and badges"
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
				</Card>
			</section>

			{/* Cards */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Cards"
					description="Container components with composition"
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
							<Button variant="primary" size="sm">
								Action
							</Button>
							<Button variant="secondary" size="sm">
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

					<Card variant="outline">
						<CardContent>
							<p>
								<strong>Outline Variant</strong> - Transparent with border
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Loading States */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Loading States"
					description="Spinners and loading indicators"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Spinner</h4>
						<div className={styles.row}>
							<Spinner size="sm" />
							<Spinner size="md" />
							<Spinner size="lg" />
						</div>
					</div>

					<div className={styles.componentGroup}>
						<h4>Loading State</h4>
						<LoadingState message="Loading components..." />
					</div>
				</Card>
			</section>

			{/* Empty States */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Empty States"
					description="Placeholders when content is missing"
				/>

				<Card>
					<EmptyState
						title="No items found"
						description="Get started by creating your first item"
						action={<Button variant="primary">Create Item</Button>}
					/>
				</Card>
			</section>

			{/* Dialogs */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Dialogs"
					description="Modal dialogs and overlays"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<Button onClick={() => setDialogOpen(true)}>Open Dialog</Button>

						<Dialog
							isOpen={dialogOpen}
							onClose={() => setDialogOpen(false)}
							title="Example Dialog"
							footer={
								<DialogActions>
									<Button variant="ghost" onClick={() => setDialogOpen(false)}>
										Cancel
									</Button>
									<Button
										variant="primary"
										onClick={() => setDialogOpen(false)}
									>
										Confirm
									</Button>
								</DialogActions>
							}
						>
							<p>
								This is an example dialog with header, content, and action
								buttons.
							</p>
							<p>Dialogs can contain any content and are fully accessible.</p>
						</Dialog>
					</div>
				</Card>
			</section>

			{/* Tabs */}
			<section className={styles.section}>
				<SectionHeader
					variant="secondary"
					title="Tabs"
					description="Tabbed navigation and content panels"
				/>

				<Card>
					<div className={styles.componentGroup}>
						<h4>Basic Tabs</h4>
						<Tabs
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
							activeTab={activeTab}
							onTabChange={setActiveTab}
						>
							<TabPanel id="home" activeTab={activeTab}>
								<div style={{ padding: "var(--spacing-lg)" }}>
									<h4>Home Tab Content</h4>
									<p>
										This is the content for the Home tab. Tabs help organize
										related information into separate views.
									</p>
								</div>
							</TabPanel>

							<TabPanel id="profile" activeTab={activeTab}>
								<div style={{ padding: "var(--spacing-lg)" }}>
									<h4>Profile Tab Content</h4>
									<p>
										This is the content for the Profile tab. Each tab can
										contain any component or content.
									</p>
								</div>
							</TabPanel>

							<TabPanel id="settings" activeTab={activeTab}>
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
							tabs={[
								{ id: "tab1", label: "Overview" },
								{ id: "tab2", label: "Details" },
								{ id: "tab3", label: "Advanced" },
							]}
							activeTab="tab1"
							onTabChange={() => {}}
						>
							<TabPanel id="tab1" activeTab="tab1">
								<div style={{ padding: "var(--spacing-lg)" }}>
									<p>Tabs can also work without icons for a simpler look.</p>
								</div>
							</TabPanel>

							<TabPanel id="tab2" activeTab="tab1">
								<div style={{ padding: "var(--spacing-lg)" }}>
									<p>Details content...</p>
								</div>
							</TabPanel>

							<TabPanel id="tab3" activeTab="tab1">
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
					variant="secondary"
					title="Typography & Colors"
					description="Design tokens and variables"
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
		</div>
	);
}
