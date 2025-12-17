/**
 * ATOM63 Design System Sync - Figma Plugin
 * Author: You Zhang (ATOM63)
 */

import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { type PageId, Sidebar } from './components/layout'
import { ExportPage } from './pages/ExportPage'
import { HelpPage } from './pages/HelpPage'
import { ImportPage } from './pages/ImportPage'
import { SettingsPage } from './pages/SettingsPage'
import { StyleguidePage } from './pages/StyleguidePage'
import { SyncPage } from './pages/SyncPage'

function App() {
  const [activePage, setActivePage] = useState<PageId>('import')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'default' | 'compact'>('default')

  const toggleViewMode = () => {
    const newMode = viewMode === 'default' ? 'compact' : 'default'
    setViewMode(newMode)
    parent.postMessage({ pluginMessage: { type: 'resize-window', data: { mode: newMode } } }, '*')
  }

  const renderPage = () => {
    switch (activePage) {
      case 'import':
        return <ImportPage />
      case 'export':
        return <ExportPage />
      case 'sync':
        return <SyncPage />
      case 'settings':
        return <SettingsPage />
      case 'styleguide':
        return <StyleguidePage />
      case 'help':
        return <HelpPage />
      default:
        return <ImportPage />
    }
  }

  return (
    <div className="plugin-container">
      {/* Header with View Mode Toggle */}
      <div className="view-mode-header">
        <h1>TokenBridge</h1>
        <button
          className="view-mode-toggle"
          onClick={toggleViewMode}
          title={viewMode === 'default' ? 'Switch to Compact Mode' : 'Switch to Default Mode'}
          type="button"
        >
          {viewMode === 'default' ? '◧' : '◨'} {viewMode === 'default' ? 'Compact' : 'Expand'}
        </button>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="plugin-layout">
        <Sidebar
          activePage={activePage}
          collapsed={sidebarCollapsed}
          onPageChange={setActivePage}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content */}
        <div className="plugin-main">{renderPage()}</div>
      </div>
    </div>
  )
}

const container = document.getElementById('root')

if (container) {
  try {
    const root = createRoot(container)
    root.render(<App />)
  } catch (_error) {}
} else {
}
