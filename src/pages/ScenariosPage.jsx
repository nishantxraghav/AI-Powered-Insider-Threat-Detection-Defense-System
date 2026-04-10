import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'
import { getScenarios, getAlerts } from '../services/db'
import { LoadingSpinner, StatusBadge, ErrorMessage } from '../components/ui'

const SCENARIO_META = {
  ip_theft: {
    icon: '🔐',
    color: '#ff2d55',
    bgClass: 'border-red-500/20',
    accentClass: 'bg-red-500/5',
    signals: ['High-volume USB transfers', 'After-hours system access', 'External email with large attachments', 'Repository cloning activity'],
    mitigations: ['Immediate account suspension', 'Device forensics', 'Network traffic capture', 'Legal hold on communications'],
  },
  departing_employee: {
    icon: '🚪',
    color: '#ff6b00',
    bgClass: 'border-orange-500/20',
    accentClass: 'bg-orange-500/5',
    signals: ['Job site browsing > 30 min/day', 'Bulk file downloads', 'Personal email transfers', 'Reduced productivity metrics'],
    mitigations: ['HR notification', 'Enhanced monitoring', 'Access review', 'Exit interview preparation'],
  },
  admin_sabotage: {
    icon: '💣',
    color: '#ff0055',
    bgClass: 'border-red-700/30',
    accentClass: 'bg-red-700/5',
    signals: ['Mass file/config deletions', 'Privilege escalation without ticket', 'Audit log modifications', 'Off-hours admin access'],
    mitigations: ['IMMEDIATE privilege revocation', 'System rollback initiation', 'Incident response team activation', 'Executive notification'],
  },
  phishing_victim: {
    icon: '🎣',
    color: '#9d4edd',
    bgClass: 'border-purple-500/20',
    accentClass: 'bg-purple-500/5',
    signals: ['Malicious URL click detected', 'Credential entry on external site', 'Unusual login locations', 'Failed MFA attempts spike'],
    mitigations: ['Force password reset', 'MFA re-enrollment', 'Endpoint quarantine', 'Lateral movement monitoring'],
  },
  competitor_browsing: {
    icon: '🕵️',
    color: '#ffd60a',
    bgClass: 'border-yellow-500/20',
    accentClass: 'bg-yellow-500/5',
    signals: ['Competitor site visits > 3hrs/week', 'LinkedIn activity increase', 'Document access anomalies', 'Recruitment site visits'],
    mitigations: ['HR flag', 'Manager notification', 'Access audit', 'Enhanced behavioral tracking'],
  },
}

function ScenarioCard({ scenario, relatedAlerts }) {
  const [expanded, setExpanded] = useState(false)
  const meta = SCENARIO_META[scenario.type] || {}
  const indicators = typeof scenario.indicators === 'string'
    ? JSON.parse(scenario.indicators)
    : scenario.indicators || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`cyber-card ${meta.bgClass || 'border-cyber-border'} overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`p-5 cursor-pointer ${meta.accentClass || ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{meta.icon}</div>
            <div>
              <h3 className="font-display text-lg" style={{ color: meta.color }}>
                {scenario.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge severity={scenario.risk_level} />
                <span className="text-cyber-text/40 font-mono text-xs">
                  {relatedAlerts.length} related alerts
                </span>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} style={{ color: meta.color }} />
          </motion.div>
        </div>

        <p className="mt-3 text-cyber-text/60 font-mono text-xs leading-relaxed">
          {scenario.description}
        </p>
      </div>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="p-5 pt-0 space-y-4">
          <div className="border-t border-cyber-border/30 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Indicators */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: meta.color }}>
                Behavioral Indicators
              </h4>
              <ul className="space-y-2">
                {indicators.map((ind, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 font-mono text-xs text-cyber-text/70"
                  >
                    <span style={{ color: meta.color }} className="flex-shrink-0 mt-0.5">→</span>
                    {ind}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Mitigations */}
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest mb-3 text-cyber-green">
                Response Actions
              </h4>
              <ul className="space-y-2">
                {(meta.mitigations || []).map((m, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 font-mono text-xs text-cyber-text/70"
                  >
                    <span className="text-cyber-green flex-shrink-0 mt-0.5">✓</span>
                    {m}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Related Alerts */}
          {relatedAlerts.length > 0 && (
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest mb-2 text-cyber-text/40">
                Active Cases ({relatedAlerts.length})
              </h4>
              <div className="space-y-1.5">
                {relatedAlerts.slice(0, 3).map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2.5 bg-white/2 border border-cyber-border/20 rounded font-mono text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                      <span className="text-cyber-text/70">{alert.users?.name || 'Unknown'}</span>
                      <span className="text-cyber-text/40">{alert.users?.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: meta.color }}>{alert.score?.toFixed(0)}</span>
                      <StatusBadge status={alert.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Score Bar */}
          <div className="flex items-center gap-3">
            <span className="text-cyber-text/30 font-mono text-xs">RISK LEVEL</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: scenario.risk_level === 'critical' ? '95%'
                    : scenario.risk_level === 'high' ? '80%'
                    : scenario.risk_level === 'medium' ? '50%' : '25%'
                }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})` }}
              />
            </div>
            <span className="font-mono text-xs uppercase" style={{ color: meta.color }}>
              {scenario.risk_level}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getScenarios(), getAlerts()]).then(([scenRes, alertsRes]) => {
      if (scenRes.error) setError(scenRes.error.message)
      else setScenarios(scenRes.data || [])
      setAlerts(alertsRes.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  const getRelated = (scenario) =>
    alerts.filter(a => {
      const type = scenario.type?.replace(/_/g, ' ').toLowerCase()
      return a.threat_type?.toLowerCase().includes(type?.split('_')[0]) ||
        a.threat_type?.toLowerCase().includes(scenario.name?.toLowerCase().split(' ')[0])
    })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-cyber-purple text-2xl tracking-widest">THREAT SCENARIOS</h1>
          <p className="text-cyber-text/40 font-mono text-xs mt-1">
            CERT dataset behavioral patterns — {scenarios.length} scenarios loaded
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded">
          <ShieldAlert size={12} className="text-purple-400" />
          <span className="text-purple-400 font-mono text-xs">PLAYBOOK ACTIVE</span>
        </div>
      </div>

      {/* Scenario overview grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map(s => {
          const meta = SCENARIO_META[s.type] || {}
          return (
            <div key={s.id} className={`cyber-card ${meta.bgClass || ''} p-3 text-center`}>
              <div className="text-2xl mb-1">{meta.icon}</div>
              <div className="font-mono text-xs" style={{ color: meta.color }}>{s.name}</div>
              <div className="text-cyber-text/30 font-mono text-xs mt-0.5 uppercase">{s.risk_level}</div>
            </div>
          )
        })}
      </div>

      {/* Scenario cards */}
      <div className="space-y-4">
        {scenarios.map((scenario, i) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <ScenarioCard scenario={scenario} relatedAlerts={getRelated(scenario)} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
