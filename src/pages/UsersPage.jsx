import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, User, Clock, Mail, Shield, AlertTriangle } from 'lucide-react'
import { getUsers, getUserById, getActivities, getAnomalies, getAlerts } from '../services/db'
import { LoadingSpinner, StatusBadge, RiskBar, ErrorMessage } from '../components/ui'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts'

function UserModal({ user, onClose }) {
  const [activities, setActivities] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getActivities(user.id, 8),
      getAnomalies(user.id),
      getAlerts({ userId: user.id }),
    ]).then(([actsRes, anomRes, alertsRes]) => {
      setActivities(actsRes.data || [])
      setAnomalies(anomRes.data || [])
      setAlerts(alertsRes.data || [])
      setLoading(false)
    })
  }, [user.id])

  const radarData = anomalies.slice(0, 6).map(a => ({
    subject: a.feature.replace(/_/g, ' ').toUpperCase(),
    score: Math.min(a.deviation_score * 10, 100),
  }))

  const typeColor = { logon: '#00ff9d', file: '#ff6b00', email: '#0088ff', web: '#9d4edd', usb: '#ff2d55' }

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="cyber-card border-cyber-green/20 w-full max-w-4xl max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-cyber-border/50 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center text-cyber-green font-display text-lg">
                {user.name?.[0] || '?'}
              </div>
              <div>
                <h2 className="font-display text-cyber-text-bright text-lg">{user.name}</h2>
                <div className="text-cyber-text/50 font-mono text-xs">{user.email} · {user.department}</div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={user.role} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-display text-3xl" style={{
                  color: user.risk_score >= 80 ? '#ff2d55' : user.risk_score >= 60 ? '#ff6b00' : '#00ff9d'
                }}>
                  {user.risk_score?.toFixed(1)}
                </div>
                <div className="text-cyber-text/40 font-mono text-xs">RISK SCORE</div>
              </div>
              <button onClick={onClose} className="text-cyber-text/30 hover:text-cyber-text/80 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar chart */}
              {radarData.length > 0 && (
                <div>
                  <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest mb-3">Anomaly Profile</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#1a3a5c" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#a8c0d650', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                      <Radar name="Score" dataKey="score" stroke="#00ff9d" fill="#00ff9d" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Active Alerts */}
              <div>
                <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest mb-3">
                  Active Alerts ({alerts.length})
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className="text-cyber-text/30 font-mono text-xs">No alerts for this user</p>
                  ) : alerts.map(alert => (
                    <div key={alert.id} className="p-2.5 bg-white/2 border border-cyber-border/30 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-cyber-text/80 font-mono text-xs">{alert.threat_type}</span>
                        <StatusBadge severity={alert.severity} />
                      </div>
                      <div className="text-cyber-text/40 font-mono text-xs">{alert.description?.slice(0, 80)}...</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="lg:col-span-2">
                <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest mb-3">
                  Behavior Timeline
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activities.map((act, i) => (
                    <div key={act.id} className="flex items-start gap-3 py-2 border-b border-cyber-border/20 last:border-0">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ background: typeColor[act.type] || '#a8c0d6' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs uppercase" style={{ color: typeColor[act.type] || '#a8c0d6' }}>{act.type}</span>
                          <span className="text-cyber-text/40 font-mono text-xs">{new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-cyber-text/60 font-mono text-xs truncate">
                          {JSON.stringify(act.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anomalies */}
              <div className="lg:col-span-2">
                <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest mb-3">
                  Detected Anomalies ({anomalies.length})
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {anomalies.map(anom => (
                    <div key={anom.id} className="p-3 bg-white/2 border border-cyber-border/30 rounded">
                      <div className="text-cyber-text/60 font-mono text-xs mb-1">{anom.feature.replace(/_/g, ' ')}</div>
                      <div className="flex items-center justify-between">
                        <div className="font-display text-lg" style={{
                          color: anom.deviation_score >= 8 ? '#ff2d55' : anom.deviation_score >= 6 ? '#ff6b00' : '#ffd60a'
                        }}>
                          {anom.deviation_score?.toFixed(1)}σ
                        </div>
                        <div className="text-cyber-text/30 font-mono text-xs text-right">
                          <div>base: {anom.baseline?.toFixed(0)}</div>
                          <div>obs: {anom.observed?.toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getUsers().then(({ data, error }) => {
      if (error) setError(error.message)
      else setUsers(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ||
      (filter === 'high' && u.risk_score >= 70) ||
      (filter === 'medium' && u.risk_score >= 40 && u.risk_score < 70) ||
      (filter === 'low' && u.risk_score < 40)
    return matchSearch && matchFilter
  })

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="font-display text-cyber-green text-2xl tracking-widest">USER RISK PROFILES</h1>
        <p className="text-cyber-text/40 font-mono text-xs mt-1">{users.length} operators under surveillance</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search operators..."
            className="bg-cyber-card border border-cyber-border text-cyber-text/80 font-mono text-sm pl-9 pr-4 py-2 rounded focus:outline-none focus:border-cyber-green/40 transition-all w-56"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-mono text-xs rounded transition-all ${
                filter === f
                  ? 'bg-cyber-green/10 border border-cyber-green/40 text-cyber-green'
                  : 'border border-cyber-border text-cyber-text/40 hover:text-cyber-text/70'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => setSelectedUser(user)}
            className="cyber-card p-5 cursor-pointer hover:border-cyber-green/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cyber-green/10 border border-cyber-green/20 flex items-center justify-center text-cyber-green font-display">
                  {user.name?.[0]}
                </div>
                <div>
                  <div className="text-cyber-text-bright font-mono text-sm">{user.name}</div>
                  <div className="text-cyber-text/40 font-mono text-xs">{user.department || 'Unknown'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl" style={{
                  color: user.risk_score >= 80 ? '#ff2d55' : user.risk_score >= 60 ? '#ff6b00' : user.risk_score >= 40 ? '#ffd60a' : '#00ff9d'
                }}>
                  {user.risk_score?.toFixed(0)}
                </div>
                <div className="text-cyber-text/30 font-mono text-xs">RISK</div>
              </div>
            </div>

            <RiskBar score={user.risk_score || 0} />

            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1 text-cyber-text/40">
                <Mail size={10} />
                <span className="truncate max-w-32">{user.email}</span>
              </div>
              <StatusBadge status={user.role} />
            </div>

            <div className="mt-2 flex items-center gap-1 text-cyber-text/30 text-xs font-mono">
              <Clock size={10} />
              <span>Last: {user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}
