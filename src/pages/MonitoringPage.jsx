import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Zap, Radio, AlertTriangle, Plus } from 'lucide-react'
import { getActivities, getAnomalies, insertAlert, insertAnomaly } from '../services/db'
import { useRealtimeAlerts, useRealtimeAnomalies } from '../hooks/useRealtime'
import { LoadingSpinner, StatusBadge, ErrorMessage } from '../components/ui'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import toast from 'react-hot-toast'

const USERS = [
  { id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Marcus Webb' },
  { id: 'a1b2c3d4-0003-0003-0003-000000000003', name: 'Elena Volkov' },
  { id: 'a1b2c3d4-0006-0006-0006-000000000006', name: 'David Torres' },
  { id: 'a1b2c3d4-0005-0005-0005-000000000005', name: 'Priya Sharma' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-card border border-cyber-border p-2 rounded font-mono text-xs">
      <p className="text-cyber-text/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
      ))}
    </div>
  )
}

export default function MonitoringPage() {
  const [activities, setActivities] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [liveAlerts, setLiveAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [scoreHistory, setScoreHistory] = useState([])

  const loadData = useCallback(async () => {
    const [actsRes, anomRes] = await Promise.all([
      getActivities(null, 20),
      getAnomalies(null, 30),
    ])
    if (actsRes.error) setError(actsRes.error.message)
    else {
      setActivities(actsRes.data || [])
      setAnomalies(anomRes.data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    // Seed initial score history
    setScoreHistory(
      Array.from({ length: 20 }, (_, i) => ({
        t: `${i * 3}s`,
        anomaly: Math.random() * 4 + 1,
        risk: Math.random() * 30 + 40,
      }))
    )
  }, [loadData])

  // Live score ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setScoreHistory(prev => {
        const last = prev[prev.length - 1]
        const newPoint = {
          t: new Date().toLocaleTimeString(),
          anomaly: Math.max(0, (last?.anomaly || 2) + (Math.random() - 0.4) * 1.5),
          risk: Math.max(0, Math.min(100, (last?.risk || 50) + (Math.random() - 0.45) * 5)),
        }
        return [...prev.slice(-29), newPoint]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useRealtimeAlerts((newAlert) => {
    setLiveAlerts(prev => [{ ...newAlert, _new: true }, ...prev.slice(0, 9)])
    toast.error(`🚨 LIVE ALERT: ${newAlert.threat_type}`, { duration: 5000 })
  })

  useRealtimeAnomalies((newAnomaly) => {
    setAnomalies(prev => [{ ...newAnomaly, _new: true }, ...prev.slice(0, 29)])
    toast(`⚡ Anomaly detected: ${newAnomaly.feature}`, { icon: '⚡', duration: 3000 })
  })

  // Simulate a new alert
  const simulateAlert = async () => {
    setSimulating(true)
    const user = USERS[Math.floor(Math.random() * USERS.length)]
    const threats = ['Unusual File Access', 'After Hours Login', 'Data Exfiltration Attempt', 'Privilege Escalation']
    const severities = ['low', 'medium', 'high']
    const threat = threats[Math.floor(Math.random() * threats.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]

    const { error: alertErr } = await insertAlert({
      user_id: user.id,
      threat_type: threat,
      severity,
      score: Math.random() * 40 + 50,
      description: `Simulated ${threat} event for ${user.name}. Automated detection triggered by behavioral model.`,
      status: 'open',
    })

    const { error: anomErr } = await insertAnomaly({
      user_id: user.id,
      feature: ['file_transfer_volume', 'after_hours_logins', 'external_email_count'][Math.floor(Math.random() * 3)],
      deviation_score: Math.random() * 4 + 5,
      baseline: Math.random() * 10,
      observed: Math.random() * 100 + 50,
    })

    setSimulating(false)
    if (alertErr || anomErr) {
      toast.error('Simulation failed — check Supabase connection')
    } else {
      toast.success('Event injected into pipeline')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const typeColor = { logon: '#00ff9d', file: '#ff6b00', email: '#0088ff', web: '#9d4edd', usb: '#ff2d55', print: '#ffd60a' }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-cyber-green text-2xl tracking-widest">LIVE MONITOR</h1>
          <p className="text-cyber-text/40 font-mono text-xs mt-1">Realtime behavioral stream — Supabase subscribed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-green/5 border border-cyber-green/20 rounded">
            <Radio size={12} className="text-cyber-green animate-pulse" />
            <span className="text-cyber-green font-mono text-xs">STREAMING</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={simulateAlert}
            disabled={simulating}
            className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/40 text-red-400 font-mono text-xs rounded hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            {simulating ? (
              <span className="h-3 w-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
            ) : <Plus size={12} />}
            Inject Event
          </motion.button>
        </div>
      </div>

      {/* Live Score Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="cyber-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest">Anomaly Score Stream</h3>
            <span className="text-cyber-green font-mono text-xs animate-pulse">LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c30" />
              <XAxis dataKey="t" tick={{ fill: '#a8c0d630', fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={5} />
              <YAxis tick={{ fill: '#a8c0d630', fontSize: 9, fontFamily: 'JetBrains Mono' }} domain={[0, 10]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={7} stroke="#ff6b0040" strokeDasharray="4 4" />
              <ReferenceLine y={9} stroke="#ff2d5540" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="anomaly" stroke="#00ff9d"
                strokeWidth={1.5} dot={false} name="Anomaly σ"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="cyber-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest">Aggregate Risk Score</h3>
            <span className="text-red-400 font-mono text-xs animate-pulse">LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c30" />
              <XAxis dataKey="t" tick={{ fill: '#a8c0d630', fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={5} />
              <YAxis tick={{ fill: '#a8c0d630', fontSize: 9, fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={60} stroke="#ff6b0040" strokeDasharray="4 4" />
              <ReferenceLine y={80} stroke="#ff2d5540" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="risk" stroke="#ff2d55"
                strokeWidth={1.5} dot={false} name="Risk Score"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Feed */}
        <div className="cyber-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-cyber-green" />
            <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest">Activity Stream</h3>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-cyber-green rounded-full animate-pulse" />
              <span className="text-cyber-green font-mono text-xs">{activities.length} events</span>
            </span>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence>
              {activities.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(0,255,157,0.1)' }}
                  animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255,255,255,0)' }}
                  transition={{ delay: i * 0.03, duration: 0.5 }}
                  className="flex items-start gap-2 p-2 border border-cyber-border/20 rounded text-xs font-mono"
                >
                  <span className="h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: typeColor[act.type] || '#a8c0d6' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-xs" style={{ color: typeColor[act.type] }}>{act.type}</span>
                      <span className="text-cyber-text/50 truncate">{act.users?.name || 'Unknown'}</span>
                    </div>
                    <div className="text-cyber-text/30 truncate">
                      {JSON.stringify(act.value).slice(0, 55)}
                    </div>
                  </div>
                  <span className="text-cyber-text/20 flex-shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Anomaly Feed */}
        <div className="cyber-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-cyber-orange" />
            <h3 className="font-mono text-cyber-text/50 text-xs uppercase tracking-widest">Anomaly Feed</h3>
            <span className="ml-auto text-cyber-orange font-mono text-xs">{anomalies.length} detected</span>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence>
              {anomalies.map((anom, i) => {
                const score = anom.deviation_score
                const color = score >= 8 ? '#ff2d55' : score >= 6 ? '#ff6b00' : '#ffd60a'
                return (
                  <motion.div
                    key={anom.id}
                    initial={{ opacity: 0, x: 20, backgroundColor: anom._new ? 'rgba(255,107,0,0.15)' : 'transparent' }}
                    animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255,255,255,0)' }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-2.5 border border-cyber-border/20 rounded font-mono text-xs"
                  >
                    <div className="text-right flex-shrink-0 w-12">
                      <div className="font-display text-base" style={{ color }}>{score?.toFixed(1)}σ</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-cyber-text/70 capitalize">{anom.feature?.replace(/_/g, ' ')}</div>
                      <div className="text-cyber-text/30">{anom.users?.name || 'Unknown'} · obs: {anom.observed?.toFixed(0)}</div>
                    </div>
                    <div className="text-cyber-text/20 flex-shrink-0">
                      {new Date(anom.timestamp).toLocaleTimeString()}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Live Alert Notifications */}
      {liveAlerts.length > 0 && (
        <div className="cyber-card border-red-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-red-400 animate-pulse" />
            <h3 className="font-mono text-red-400 text-xs uppercase tracking-widest">Realtime Alert Stream</h3>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {liveAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id || i}
                  initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(255,45,85,0.15)' }}
                  animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(255,45,85,0.03)' }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between p-3 border border-red-500/20 rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    <div>
                      <div className="text-cyber-text/80 font-mono text-xs">{alert.threat_type}</div>
                      <div className="text-cyber-text/30 font-mono text-xs">{new Date(alert.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <StatusBadge severity={alert.severity} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
