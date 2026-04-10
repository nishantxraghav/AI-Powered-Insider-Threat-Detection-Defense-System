import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Bell, Activity, Layers, Brain,
  LogOut, ChevronRight, Shield, Menu, X, Wifi, Upload
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/users', icon: Users, label: 'User Profiles' },
  { to: '/alerts', icon: Bell, label: 'Alert Center' },
  { to: '/monitoring', icon: Activity, label: 'Live Monitor' },
  { to: '/scenarios', icon: Layers, label: 'Scenarios' },
  { to: '/insights', icon: Brain, label: 'Model Insights' },
  { to: '/csv-upload', icon: Upload, label: 'CSV Analyzer' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-cyber-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield size={24} className="text-cyber-green" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-cyber-green rounded-full animate-pulse" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-display text-cyber-green text-sm tracking-widest">THREATWATCH</div>
              <div className="text-cyber-text/30 text-xs font-mono">v2.4.1 // LIVE</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-mono transition-all duration-200 group relative ${
                isActive
                  ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/20'
                  : 'text-cyber-text/50 hover:text-cyber-text/90 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyber-green rounded-full"
                  />
                )}
                <Icon size={16} className={isActive ? 'text-cyber-green' : ''} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight size={12} className="text-cyber-green/50" />}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Status */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-3 rounded cyber-card border-cyber-green/10 bg-cyber-green/5">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={10} className="text-cyber-green animate-pulse" />
            <span className="text-cyber-green text-xs font-mono">SYSTEM NOMINAL</span>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Agents Online', val: '247' },
              { label: 'Events/sec', val: '1.2k' },
              { label: 'DB Latency', val: '12ms' },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-xs font-mono">
                <span className="text-cyber-text/30">{label}</span>
                <span className="text-cyber-text/70">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User */}
      <div className="p-3 border-t border-cyber-border/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green text-xs font-mono flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-cyber-text/80 text-xs font-mono truncate">{user?.email}</div>
              <div className="text-cyber-text/30 text-xs font-mono">ANALYST</div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="text-cyber-text/30 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-cyber-card border border-cyber-border rounded"
      >
        {mobileOpen ? <X size={18} className="text-cyber-green" /> : <Menu size={18} className="text-cyber-green" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 z-30"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col h-screen bg-cyber-darker border-r border-cyber-border/50 flex-shrink-0 relative"
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-cyber-card border border-cyber-border text-cyber-text/40 hover:text-cyber-green flex items-center justify-center z-10 transition-colors"
        >
          <ChevronRight size={12} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
        <SidebarContent />
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-60 bg-cyber-darker border-r border-cyber-border z-40 flex flex-col"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
