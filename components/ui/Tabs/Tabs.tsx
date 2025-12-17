import type React from 'react'
import { useState } from 'react'
import styles from './Tabs.module.css'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  activeTab?: string
  onTabChange?: (tabId: string) => void
  children: React.ReactNode
}

export function Tabs({ tabs, defaultTab, activeTab: controlledActiveTab, onTabChange, children }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id || '')
  
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab
  
  const handleTabClick = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId)
    }
    onTabChange?.(tabId)
  }

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabList} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {children}
      </div>
    </div>
  )
}

interface TabPanelProps {
  id: string
  activeTab: string
  children: React.ReactNode
}

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) return null
  
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={styles.tabPanel}
    >
      {children}
    </div>
  )
}

