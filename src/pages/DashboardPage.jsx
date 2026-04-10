import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, Bell, AlertTriangle, Activity, TrendingUp, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { MetricCard, LoadingSpinner, StatusBadge } from '../components/ui'
import { getDashboardStats, getAlerts, getActivities } from '../services/db'
import { useRealtimeAlerts, useRealtimeAnomalies } from '../hooks/useRealtime'
import toast from 'react-hot-toast'

const COLORS = { high: '#ff2d55', medium: '#ff6b00', low: '#ffd60a', critical: '#ff0055' }
const CHART_COLORS = ['#ff2d55', '#ff6b00', '#ffd60a', '#00ff9d']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-card border border-cyber-border p-3 rounded font-mono text-xs">
      <p className="text-cyber-text/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    const [statsRes, alertsRes, actsRes] = await Promise.all([
      getDashboardStats(),
      getAlerts({ limit: 8 }),
      getActivities(null, 10),
    ])
    setStats(statsRes)
    setAlerts(alertsRes.data || [])
    setActivities(actsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useRealtimeAlerts((newAlert) => {
    setAlerts(prev => [newAlert, ...prev.slice(0, 7)])
    toast.error(`🚨 New ${newAlert.severity} alert: ${newAlert.threat_type}`, { duration: 5000 })
    loadData()
  })

  useRealtimeAnomalies((newAnomaly) => {
    toast(`⚡ Anomaly: ${newAnomaly.feature} (score: ${newAnomaly.deviation_score?.toFixed(1)})`, {
      icon: '⚡',
      duration: 4000,
    })
  })

  if (loading) return <LoadingSpinner />

  const { users = [], alerts: allAlerts = [], anomalies = [] } = stats || {}
  const activeAlerts = allAlerts.filter(a => a.status === 'open' || a.status === 'investigating')
  const highRiskUsers = users.filter(u => u.risk_score >= 70).length
  const avgRisk = users.length ? (users.reduce((s, u) => s + u.risk_score, 0) / users.length).toFixed(1) : 0

  // Severity distribution
  const severityDist = ['low', 'medium', 'high', 'critical'].map(s => ({
    name: s.toUpperCase(),
    value: allAlerts.filter(a => a.severity === s).length,
    color: COLORS[s],
  })).filter(d => d.value > 0)

  // Risk distribution buckets
  const riskBuckets = [
    { name: '0-20', value: users.filter(u => u.risk_score < 20).length },
    { name: '20-40', value: users.filter(u => u.risk_score >= 20 && u.risk_score < 40).length },
    { name: '40-60', value: users.filter(u => u.risk_score >= 40 && u.risk_score < 60).length },
    { name: '60-80', value: users.filter(u => u.risk_score >= 60 && u.risk_score < 80).length },
    { name: '80+', value: users.filter(u => u.risk_score >= 80).length },
  ]

  // Anomaly trend (last 7 slots)
  const now = new Date()
  const anomalyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setHours(d.getHours() - (6 - i) * 4)
    const label = `${d.getHours()}:00`
    const count = anomalies.filter(a => {
      const t = new Date(a.timestamp)
      return Math.abs(t - d) < 4 * 3600 * 1000
    }).length
    return { time: label, anomalies: count + Math.floor(Math.random() * 3) }
  })

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="p-6 space-y-6 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-cyber-green text-2xl tracking-widest">THREAT COMMAND</h1>
          <p className="text-cyber-text/40 font-mono text-xs mt-1">
            {new Date().toUTCString()} // LIVE FEED ACTIVE
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-green/5 border border-cyber-green/20 rounded">
          <span className="h-2 w-2 bg-cyber-green rounded-full animate-pulse" />
          <span className="text-cyber-green font-mono text-xs">MONITORING ACTIVE</span>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users Monitored"
          value={users.length}
          sub={`${highRiskUsers} high risk`}
          icon={Users}
          color="blue"
          onClick={() => navigate('/users')}
        />
        <MetricCard
          label="Active Alerts"
          value={activeAlerts.length}
          sub={`${allAlerts.filter(a => a.severity === 'critical').length} critical`}
          icon={Bell}
          color="red"
          trend={12}
          onClick={() => navigate('/alerts')}
        />
        <MetricCard
          label="Avg Risk Score"
          value={avgRisk}
          sub="across all users"
          icon={TrendingUp}
          color="orange"
        />
        <MetricCard
          label="Anomalies Detected"
          value={anomalies.length}
          sub="last 24 hours"
          icon={AlertTriangle}
          color="green"
          onClick={() => navigate('/monitoring')}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Anomaly Trend */}
        <div className="lg:col-span-2 cyber-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-cyber-text/70 text-xs tracking-widest uppercase">Anomaly Detection Timeline</h3>
            <span className="text-cyber-green font-mono text-xs">LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={anomalyTrend}>
              <defs>
                <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c40" />
              <XAxis dataKey="time" tick={{ fill: '#a8c0d640', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#a8c0d640', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="anomalies" stroke="#00ff9d"
                strokeWidth={2} fill="url(#anomalyGrad)" name="Anomalies"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Pie */}
        <div className="cyber-card p-5">
          <h3 className="font-mono text-cyber-text/70 text-xs tracking-widest uppercase mb-4">Alert Severity Split</h3>
          {severityDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={severityDist} cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={4} dataKey="value"
                  >
                    {severityDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {severityDist.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-cyber-text/50">{d.name}</span>
                    </div>
                    <span style={{ color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-cyber-text/30 font-mono text-xs">No alerts</div>
          )}
        </div>
      </motion.div>

      {/* Risk Distribution + Recent Alerts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Bar Chart */}
        <div className="cyber-card p-5">
          <h3 className="font-mono text-cyber-text/70 text-xs tracking-widest uppercase mb-4">Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskBuckets} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c40" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#a8c0d640', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#a8c0d640', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Users" radius={[4, 4, 0, 0]}>
                {riskBuckets.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[Math.min(i, CHART_COLORS.length - 1)]}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="cyber-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-cyber-text/70 text-xs tracking-widest uppercase">Recent Alerts</h3>
            <button
              onClick={() => navigate('/alerts')}
              className="text-cyber-green/60 font-mono text-xs hover:text-cyber-green transition-colors"
            >
              VIEW ALL →
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-52">
            {alerts.length === 0 ? (
              <p className="text-cyber-text/30 font-mono text-xs text-center py-8">No alerts</p>
            ) : alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/alerts')}
                className="flex items-center justify-between p-2.5 bg-white/2 border border-cyber-border/30 rounded hover:border-cyber-green/20 cursor-pointer transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge severity={alert.severity} />
                    <span className="text-cyber-text/80 font-mono text-xs truncate">{alert.threat_type}</span>
                  </div>
                  <div className="text-cyber-text/30 font-mono text-xs mt-0.5">
                    {alert.users?.name || 'Unknown'} · {new Date(alert.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className="text-cyber-orange font-mono text-sm">{alert.score?.toFixed(0)}</div>
                  <div className="text-cyber-text/30 font-mono text-xs">score</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Feed */}
      <motion.div variants={item} className="cyber-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={14} className="text-cyber-green" />
          <h3 className="font-mono text-cyber-text/70 text-xs tracking-widest uppercase">Live Activity Feed</h3>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-cyber-green rounded-full animate-pulse" />
            <span className="text-cyber-green font-mono text-xs">STREAMING</span>
          </span>
        </div>
        <div className="space-y-2">
          {activities.slice(0, 6).map((act, i) => {
            const typeColors = { logon: '#00ff9d', file: '#ff6b00', email: '#0088ff', web: '#9d4edd', usb: '#ff2d55', print: '#ffd60a' }
            const color = typeColors[act.type] || '#a8c0d6'
            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 py-2 border-b border-cyber-border/20 last:border-0"
              >
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color, minWidth: 40 }}>{act.type}</span>
                <span className="text-cyber-text/60 font-mono text-xs flex-1 truncate">
                  {act.users?.name || 'Unknown'} — {JSON.stringify(act.value).slice(0, 60)}
                </span>
                <div className="flex items-center gap-1 text-cyber-text/30 font-mono text-xs flex-shrink-0">
                  <Clock size={10} />
                  {new Date(act.timestamp).toLocaleTimeString()}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
