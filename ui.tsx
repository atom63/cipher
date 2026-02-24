/**
 * Cipher - Figma Design System Plugin
 * Author: You Zhang (ATOM63)
 */

import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { type PageId, Sidebar } from './components/layout'
import { ToastProvider, ErrorBoundary, PageErrorBoundary } from './components/ui'
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
        return <PageErrorBoundary pageName="Import"><ImportPage /></PageErrorBoundary>
      case 'export':
        return <PageErrorBoundary pageName="Export"><ExportPage /></PageErrorBoundary>
      case 'sync':
        return <PageErrorBoundary pageName="Sync"><SyncPage /></PageErrorBoundary>
      case 'settings':
        return <PageErrorBoundary pageName="Settings"><SettingsPage /></PageErrorBoundary>
      case 'styleguide':
        return <PageErrorBoundary pageName="Styleguide"><StyleguidePage /></PageErrorBoundary>
      case 'help':
        return <PageErrorBoundary pageName="Help"><HelpPage /></PageErrorBoundary>
      default:
        return <PageErrorBoundary pageName="Import"><ImportPage /></PageErrorBoundary>
    }
  }

  return (
    <div className="plugin-container">
      {/* Header with View Mode Toggle */}
      <div className="view-mode-header">
        <h1>Cipher</h1>
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
    root.render(
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    )
  } catch (_error) {}
}
