import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Filter, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { getAlerts, updateAlertStatus } from '../services/db'
import { useRealtimeAlerts } from '../hooks/useRealtime'
import { LoadingSpinner, StatusBadge, ErrorMessage, CyberButton } from '../components/ui'
import toast from 'react-hot-toast'

function AlertModal({ alert, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(false)

  const handleStatus = async (status) => {
    setLoading(true)
    const { error } = await updateAlertStatus(alert.id, status)
    setLoading(false)
    if (error) {
      toast.error(`Failed to update: ${error.message}`)
    } else {
      toast.success(`Alert marked as ${status}`)
      onStatusChange(alert.id, status)
      onClose()
    }
  }

  const severityColor = {
    critical: '#ff0055', high: '#ff2d55', medium: '#ff6b00', low: '#ffd60a'
  }[alert.severity] || '#a8c0d6'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="cyber-card w-full max-w-lg"
          style={{ borderColor: `${severityColor}30` }}
        >
          {/* Header */}
          <div className="p-5 border-b border-cyber-border/50 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} style={{ color: severityColor }} />
                <h3 className="font-display text-lg" style={{ color: severityColor }}>
                  {alert.threat_type}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
              </div>
            </div>
            <button onClick={onClose} className="text-cyber-text/30 hover:text-cyber-text/80">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 bg-white/2 rounded border border-cyber-border/30">
                <div className="text-cyber-text/40 font-mono text-xs mb-1">THREAT SCORE</div>
                <div className="font-display text-3xl" style={{ color: severityColor }}>
                  {alert.score?.toFixed(1)}
                </div>
              </div>
              <div className="flex-1 p-3 bg-white/2 rounded border border-cyber-border/30">
                <div className="text-cyber-text/40 font-mono text-xs mb-1">OPERATOR</div>
                <div className="text-cyber-text/80 font-mono text-sm">{alert.users?.name || 'Unknown'}</div>
                <div className="text-cyber-text/40 font-mono text-xs truncate">{alert.users?.email}</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-cyber-text/40 font-mono text-xs mb-2">INCIDENT DESCRIPTION</div>
              <p className="text-cyber-text/70 font-mono text-xs leading-relaxed bg-white/2 p-3 rounded border border-cyber-border/30">
                {alert.description || 'No description available.'}
              </p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'DEPARTMENT', value: alert.users?.department || 'N/A' },
                { label: 'OPERATOR ROLE', value: alert.users?.role?.toUpperCase() || 'N/A' },
                { label: 'DETECTED', value: new Date(alert.created_at).toLocaleString() },
                { label: 'ALERT ID', value: alert.id?.slice(0, 8) + '...' },
              ].map(({ label, value }) => (
                <div key={label} className="p-2 bg-white/2 rounded border border-cyber-border/20">
                  <div className="text-cyber-text/30 font-mono text-xs">{label}</div>
                  <div className="text-cyber-text/70 font-mono text-xs mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <CyberButton
                onClick={() => handleStatus('investigating')}
                disabled={loading || alert.status === 'investigating'}
                variant="purple"
                size="sm"
              >
                Mark Investigating
              </CyberButton>
              <CyberButton
                onClick={() => handleStatus('resolved')}
                disabled={loading || alert.status === 'resolved'}
                variant="primary"
                size="sm"
              >
                Resolve
              </CyberButton>
              <CyberButton
                onClick={() => handleStatus('false_positive')}
                disabled={loading}
                variant="ghost"
                size="sm"
              >
                False Positive
              </CyberButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    getAlerts().then(({ data, error }) => {
      if (error) setError(error.message)
      else setAlerts(data || [])
      setLoading(false)
    })
  }, [])

  useRealtimeAlerts((newAlert) => {
    setAlerts(prev => [newAlert, ...prev])
    toast.error(`🚨 ${newAlert.severity?.toUpperCase()} ALERT: ${newAlert.threat_type}`, { duration: 6000 })
  })

  const handleStatusChange = (id, status) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const filtered = alerts.filter(a => {
    const matchSearch = a.threat_type?.toLowerCase().includes(search.toLowerCase()) ||
      a.users?.name?.toLowerCase().includes(search.toLowerCase())
    const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchSeverity && matchStatus
  })

  const stats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === 'open').length,
    high: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-cyber-red text-2xl tracking-widest">ALERT CENTER</h1>
          <p className="text-cyber-text/40 font-mono text-xs mt-1">{alerts.length} total incidents detected</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 font-mono text-xs">{stats.open} OPEN</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: stats.total, color: 'text-cyber-text/80' },
          { label: 'Open', value: stats.open, color: 'text-cyber-red' },
          { label: 'High/Critical', value: stats.high, color: 'text-red-300' },
          { label: 'Resolved', value: stats.resolved, color: 'text-cyber-green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="cyber-card p-4 text-center">
            <div className={`font-display text-2xl ${color}`}>{value}</div>
            <div className="text-cyber-text/40 font-mono text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search threats..."
            className="bg-cyber-card border border-cyber-border text-cyber-text/80 font-mono text-xs pl-9 pr-4 py-2 rounded focus:outline-none focus:border-cyber-green/40 w-48"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-2.5 py-1.5 font-mono text-xs rounded transition-all ${
                filterSeverity === s
                  ? 'bg-cyber-green/10 border border-cyber-green/40 text-cyber-green'
                  : 'border border-cyber-border text-cyber-text/40 hover:text-cyber-text/60'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'open', 'investigating', 'resolved'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1.5 font-mono text-xs rounded transition-all ${
                filterStatus === s
                  ? 'bg-cyber-blue/10 border border-cyber-blue/40 text-cyber-blue'
                  : 'border border-cyber-border text-cyber-text/40 hover:text-cyber-text/60'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="cyber-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyber-border/50">
              {['Severity', 'Threat Type', 'Operator', 'Score', 'Status', 'Detected', ''].map(h => (
                <th key={h} className="text-left p-4 text-cyber-text/40 font-mono text-xs uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered
              .sort((a, b) => (severityOrder[a.severity] || 9) - (severityOrder[b.severity] || 9))
              .map((alert, i) => (
                <motion.tr
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(alert)}
                  className="border-b border-cyber-border/20 hover:bg-white/2 cursor-pointer transition-all group"
                >
                  <td className="p-4"><StatusBadge severity={alert.severity} /></td>
                  <td className="p-4">
                    <div className="text-cyber-text/80 font-mono text-xs">{alert.threat_type}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-cyber-text/70 font-mono text-xs">{alert.users?.name || '—'}</div>
                    <div className="text-cyber-text/30 font-mono text-xs">{alert.users?.department}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-display text-lg" style={{
                      color: alert.score >= 80 ? '#ff2d55' : alert.score >= 60 ? '#ff6b00' : '#ffd60a'
                    }}>
                      {alert.score?.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-4"><StatusBadge status={alert.status} /></td>
                  <td className="p-4">
                    <div className="text-cyber-text/40 font-mono text-xs">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-cyber-text/30 font-mono text-xs">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-cyber-green/0 group-hover:text-cyber-green/60 font-mono text-xs transition-colors">
                      VIEW →
                    </span>
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-cyber-text/30 font-mono text-sm">
            No alerts match current filters
          </div>
        )}
      </div>

      {selected && (
        <AlertModal
          alert={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
