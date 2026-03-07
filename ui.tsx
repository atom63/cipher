/**
 * Cipher - Figma Design System Plugin
 * Author: You Zhang (ATOM63)
 */

import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { type PageId, Sidebar } from './components/layout'
import { ToastProvider, ErrorBoundary, PageErrorBoundary } from './components/ui'
import { TooltipPortal } from './components/ui/Tooltip'
import { usePostMessage } from './hooks/useFigmaMessage'
import { ExportPage } from './pages/ExportPage'
import { ImportPage } from './pages/ImportPage'
import { ManagePage } from './pages/ManagePage'
import { SettingsPage } from './pages/SettingsPage'
import { StylesPage } from './pages/StylesPage'
import { StyleguidePage } from './pages/StyleguidePage'

function App() {
  const [activePage, setActivePage] = useState<PageId>('manage')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'default' | 'compact'>('default')
  const postMessage = usePostMessage()

  const toggleViewMode = () => {
    const newMode = viewMode === 'default' ? 'compact' : 'default'
    setViewMode(newMode)
    postMessage({ type: 'resize-window', data: { mode: newMode } })
  }

  const renderPage = () => {
    switch (activePage) {
      case 'manage':
        return <PageErrorBoundary pageName="Variables"><ManagePage /></PageErrorBoundary>
      case 'styles':
        return <PageErrorBoundary pageName="Styles"><StylesPage /></PageErrorBoundary>
      case 'import':
        return <PageErrorBoundary pageName="Import"><ImportPage /></PageErrorBoundary>
      case 'export':
        return <PageErrorBoundary pageName="Export"><ExportPage /></PageErrorBoundary>
      case 'settings':
        return <PageErrorBoundary pageName="Settings"><SettingsPage /></PageErrorBoundary>
      case 'styleguide':
        return <PageErrorBoundary pageName="Styleguide"><StyleguidePage /></PageErrorBoundary>
      default:
        return <PageErrorBoundary pageName="Manage"><ManagePage /></PageErrorBoundary>
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
          <TooltipPortal />
        </ToastProvider>
      </ErrorBoundary>
    )
  } catch (_error) {}
}
