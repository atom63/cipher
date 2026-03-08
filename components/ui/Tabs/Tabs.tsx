import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
	size?: "sm" | "md";
	className?: string;
	children?: React.ReactNode;
}

export function Tabs({
	tabs,
	defaultTab,
	activeTab: controlledActiveTab,
	onTabChange,
	size = "md",
	className = "",
	children,
}: TabsProps) {
	const [internalActiveTab, setInternalActiveTab] = useState(
		defaultTab || tabs[0]?.id || "",
	);

	const tabListRef = useRef<HTMLDivElement>(null);
	const indicatorRef = useRef<HTMLDivElement>(null);

	const activeTab =
		controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

	const handleTabClick = useCallback(
		(tabId: string) => {
			if (controlledActiveTab === undefined) {
				setInternalActiveTab(tabId);
			}
			onTabChange?.(tabId);
		},
		[controlledActiveTab, onTabChange],
	);

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
		[tabs, activeTab, handleTabClick],
	);

	// Update indicator position when active tab changes
	useEffect(() => {
		const list = tabListRef.current;
		const indicator = indicatorRef.current;
		if (!list || !indicator) return;

		const activeEl = list.querySelector<HTMLElement>(`#tab-${activeTab}`);
		if (!activeEl) return;

		const listRect = list.getBoundingClientRect();
		const tabRect = activeEl.getBoundingClientRect();

		indicator.style.left = `${tabRect.left - listRect.left}px`;
		indicator.style.width = `${tabRect.width}px`;
	}, [activeTab, tabs]);

	const containerClasses = [styles.tabsContainer, className]
		.filter(Boolean)
		.join(" ");

	const listClasses = [styles.tabList, size === "sm" ? styles.listSm : ""]
		.filter(Boolean)
		.join(" ");

	const tabClass = (isActive: boolean) =>
		[styles.tab, size === "sm" ? styles.tabSm : "", isActive ? styles.active : ""]
			.filter(Boolean)
			.join(" ");

	return (
		<div className={containerClasses}>
			<div
				ref={tabListRef}
				className={listClasses}
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
						className={tabClass(activeTab === tab.id)}
						onClick={() => handleTabClick(tab.id)}
						disabled={tab.disabled}
					>
						{tab.icon && (
							<span className={styles.tabIcon} aria-hidden="true">
								{tab.icon}
							</span>
						)}
						<span className={styles.tabLabel}>{tab.label}</span>
					</button>
				))}
				<div ref={indicatorRef} className={styles.indicator} />
			</div>
			{children && <div className={styles.tabContent}>{children}</div>}
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
