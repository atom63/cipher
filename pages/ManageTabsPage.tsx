import { useState } from "react";
import { SectionHeader, TabPanel, Tabs } from "../components/ui";
import { ManagePage } from "./ManagePage";
import { StylesPage } from "./StylesPage";

const TABS = [
	{ id: "variables", label: "Variables" },
	{ id: "styles", label: "Styles" },
];

export function ManageTabsPage({
	onNavigate,
}: {
	onNavigate?: (page: string) => void;
}) {
	const [activeTab, setActiveTab] = useState("variables");

	return (
		<div className="manage-tabs-page">
			<div className="manage-tabs-header">
				<SectionHeader
					description="Browse and edit your variables and styles"
					title="Manage"
					variant="primary"
				/>
				<Tabs
					activeTab={activeTab}
					onTabChange={setActiveTab}
					size="sm"
					tabs={TABS}
				/>
			</div>
			<TabPanel activeTab={activeTab} id="variables">
				<ManagePage onNavigate={onNavigate} />
			</TabPanel>
			<TabPanel activeTab={activeTab} id="styles">
				<StylesPage />
			</TabPanel>
		</div>
	);
}
