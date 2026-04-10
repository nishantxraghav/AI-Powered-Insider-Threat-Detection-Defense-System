import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-cyber-black bg-grid overflow-hidden">
      <div className="scan-line" />
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1f3c',
            color: '#a8c0d6',
            border: '1px solid #1a3a5c',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '12px',
          },
          success: {
            iconTheme: { primary: '#00ff9d', secondary: '#030712' },
          },
          error: {
            iconTheme: { primary: '#ff2d55', secondary: '#030712' },
          },
        }}
      />
    </div>
  )
}
