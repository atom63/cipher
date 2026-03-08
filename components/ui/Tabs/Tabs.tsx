import type React from "react";
import { useCallback, useRef, useState } from "react";
import styles from "./Tabs.module.css";

interface Tab {
	id: string;
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
}

interface TabsProps {
	tabs: Tab[];
	defaultTab?: string;
	activeTab?: string;
	onTabChange?: (tabId: string) => void;
	children: React.ReactNode;
}

export function Tabs({
	tabs,
	defaultTab,
	activeTab: controlledActiveTab,
	onTabChange,
	children,
}: TabsProps) {
	const [internalActiveTab, setInternalActiveTab] = useState(
		defaultTab || tabs[0]?.id || "",
	);

	const tabListRef = useRef<HTMLDivElement>(null);

	const activeTab =
		controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

	const handleTabClick = (tabId: string) => {
		if (controlledActiveTab === undefined) {
			setInternalActiveTab(tabId);
		}
		onTabChange?.(tabId);
	};

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const enabledTabs = tabs.filter((t) => !t.disabled);
			const currentIndex = enabledTabs.findIndex((t) => t.id === activeTab);
			let nextIndex = -1;

			switch (e.key) {
				case "ArrowRight":
				case "ArrowDown":
					e.preventDefault();
					nextIndex = (currentIndex + 1) % enabledTabs.length;
					break;
				case "ArrowLeft":
				case "ArrowUp":
					e.preventDefault();
					nextIndex =
						(currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
					break;
				case "Home":
					e.preventDefault();
					nextIndex = 0;
					break;
				case "End":
					e.preventDefault();
					nextIndex = enabledTabs.length - 1;
					break;
				default:
					return;
			}

			if (nextIndex >= 0) {
				const nextTab = enabledTabs[nextIndex];
				handleTabClick(nextTab.id);
				const tabEl = tabListRef.current?.querySelector<HTMLElement>(
					`#tab-${nextTab.id}`,
				);
				tabEl?.focus();
			}
		},
		[tabs, activeTab],
	);

	return (
		<div className={styles.tabsContainer}>
			<div
				ref={tabListRef}
				className={styles.tabList}
				role="tablist"
				onKeyDown={handleKeyDown}
			>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.id}
						aria-controls={`tabpanel-${tab.id}`}
						id={`tab-${tab.id}`}
						tabIndex={activeTab === tab.id ? 0 : -1}
						className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
						onClick={() => handleTabClick(tab.id)}
						disabled={tab.disabled}
					>
						{tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
						<span className={styles.tabLabel}>{tab.label}</span>
					</button>
				))}
			</div>
			<div className={styles.tabContent}>{children}</div>
		</div>
	);
}

interface TabPanelProps {
	id: string;
	activeTab: string;
	children: React.ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
	if (id !== activeTab) return null;

	return (
		<div
			role="tabpanel"
			id={`tabpanel-${id}`}
			aria-labelledby={`tab-${id}`}
			className={styles.tabPanel}
		>
			{children}
		</div>
	);
}
