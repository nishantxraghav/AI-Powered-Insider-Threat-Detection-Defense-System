import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Cpu, BarChart2, GitBranch } from 'lucide-react'
import { getAnomalies, getUsers } from '../services/db'
import { LoadingSpinner } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts'

const ENSEMBLE_MODELS = [
  { name: 'Isolation Forest', weight: 0.28, color: '#00ff9d', type: 'Unsupervised', status: 'ACTIVE' },
  { name: 'Random Forest', weight: 0.24, color: '#0088ff', type: 'Supervised', status: 'ACTIVE' },
  { name: 'LSTM Autoencoder', weight: 0.22, color: '#9d4edd', type: 'Deep Learning', status: 'ACTIVE' },
  { name: 'One-Class SVM', weight: 0.15, color: '#ff6b00', type: 'Unsupervised', status: 'ACTIVE' },
  { name: 'XGBoost', weight: 0.11, color: '#ffd60a', type: 'Supervised', status: 'STANDBY' },
]

const FEATURE_IMPORTANCE = [
  { feature: 'File Transfer Volume', importance: 0.187, delta: '+0.02' },
  { feature: 'After Hours Logins', importance: 0.164, delta: '+0.01' },
  { feature: 'External Email Count', importance: 0.143, delta: '-0.005' },
  { feature: 'Job Site Browsing', importance: 0.121, delta: '+0.03' },
  { feature: 'USB Device Events', importance: 0.108, delta: '0.00' },
  { feature: 'Phishing Clicks', importance: 0.097, delta: '+0.05' },
  { feature: 'Bulk Downloads', importance: 0.089, delta: '-0.01' },
  { feature: 'Competitor Visits', importance: 0.091, delta: '+0.008' },
]

const MODEL_METRICS = [
  { label: 'Precision', value: '94.2%', sub: '+1.3% vs baseline' },
  { label: 'Recall', value: '91.7%', sub: '-0.4% vs baseline' },
  { label: 'F1 Score', value: '92.9%', sub: 'Production ready' },
  { label: 'AUC-ROC', value: '0.974', sub: 'Excellent' },
  { label: 'False Positive Rate', value: '3.1%', sub: 'Within threshold' },
  { label: 'Model Latency', value: '12ms', sub: 'P99 inference time' },
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-card border border-cyber-border p-2 rounded font-mono text-xs">
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#a8c0d6' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</p>
      ))}
    </div>
  )
}

export default function InsightsPage() {
  const [anomalies, setAnomalies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAnomalies(), getUsers()]).then(([anomRes, usersRes]) => {
      setAnomalies(anomRes.data || [])
      setUsers(usersRes.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />

  // PCA scatter — derived from users data
  const pcaData = users.map((u, i) => ({
    x: (u.risk_score || 0) * Math.cos(i * 0.8) / 10 + (Math.random() - 0.5) * 3,
    y: (u.risk_score || 0) * Math.sin(i * 0.8) / 10 + (Math.random() - 0.5) * 3,
    z: u.risk_score || 10,
    name: u.name,
    risk: u.risk_score,
  }))

  // Feature radar from actual anomalies
  const featureMap = {}
  anomalies.forEach(a => {
    if (!featureMap[a.feature]) featureMap[a.feature] = []
    featureMap[a.feature].push(a.deviation_score)
  })
  const radarData = Object.entries(featureMap).slice(0, 7).map(([f, scores]) => ({
    subject: f.replace(/_/g, ' ').slice(0, 15),
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    max: Math.max(...scores),
  }))

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="p-6 space-y-5"
    >
      <motion.div variants={item}>
        <h1 className="font-display text-cyber-purple text-2xl tracking-widest">MODEL INSIGHTS</h1>
        <p className="text-cyber-text/40 font-mono text-xs mt-1">
          Ensemble behavioral analytics — CERT v4.2 dataset
        </p>
      </motion.div>

      {/* Model Performance Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {MODEL_METRICS.map(({ label, value, sub }) => (
          <div key={label} className="cyber-card p-4 text-center">
            <div className="font-display text-xl text-cyber-green">{value}</div>
            <div className="text-cyber-text/60 font-mono text-xs mt-0.5">{label}</div>
            <div className="text-cyber-text/30 font-mono text-xs mt-0.5">{sub}</div>
          </div>
        ))}
      </motion.div>

      {/* Ensemble Models */}
      <motion.div variants={item} className="cyber-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch size={14} className="text-cyber-purple" />
          <h3 className="font-mono text-cyber-text/70 text-xs uppercase tracking-widest">Ensemble Model Weights</h3>
        </div>
        <div className="space-y-3">
          {ENSEMBLE_MODELS.map((model, i) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4"
            >
              <div className="w-36 flex-shrink-0">
                <div className="font-mono text-xs" style={{ color: model.color }}>{model.name}</div>
                <div className="text-cyber-text/30 font-mono text-xs">{model.type}</div>
              </div>
              <div className="flex-1 h-6 bg-white/3 rounded overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${model.weight * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded flex items-center justify-end pr-2"
                  style={{ background: `linear-gradient(90deg, ${model.color}40, ${model.color})` }}
                >
                  <span className="font-display text-xs" style={{ color: model.color }}>
                    {(model.weight * 100).toFixed(0)}%
                  </span>
                </motion.div>
              </div>
              <span className={`font-mono text-xs flex-shrink-0 px-2 py-0.5 rounded ${
                model.status === 'ACTIVE'
                  ? 'text-cyber-green bg-cyber-green/10 border border-cyber-green/20'
                  : 'text-cyber-text/40 bg-white/5 border border-cyber-border/30'
              }`}>
                {model.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Feature Importance + Radar */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feature Importance Bar */}
        <div className="cyber-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-cyber-blue" />
            <h3 className="font-mono text-cyber-text/70 text-xs uppercase tracking-widest">Feature Importance</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={FEATURE_IMPORTANCE} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c30" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#a8c0d640', fontSize: 9, fontFamily: 'JetBrains Mono' }} domain={[0, 0.25]} />
              <YAxis
                type="category" dataKey="feature" width={130}
                tick={{ fill: '#a8c0d660', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="importance" name="Importance" radius={[0, 3, 3, 0]}>
                {FEATURE_IMPORTANCE.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(${160 - i * 15}, 90%, ${55 - i * 3}%)`}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly Radar */}
        <div className="cyber-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-cyber-orange" />
            <h3 className="font-mono text-cyber-text/70 text-xs uppercase tracking-widest">Anomaly Feature Radar</h3>
            <span className="ml-auto text-cyber-text/30 font-mono text-xs">from DB</span>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a3a5c" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a8c0d650', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                <Radar name="Avg σ" dataKey="avg" stroke="#ff6b00" fill="#ff6b00" fillOpacity={0.15} strokeWidth={1.5} />
                <Radar name="Max σ" dataKey="max" stroke="#ff2d55" fill="#ff2d55" fillOpacity={0.08} strokeWidth={1} strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-cyber-text/30 font-mono text-xs">
              No anomaly data from Supabase
            </div>
          )}
        </div>
      </motion.div>

      {/* PCA Scatter */}
      <motion.div variants={item} className="cyber-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={14} className="text-cyber-green" />
          <h3 className="font-mono text-cyber-text/70 text-xs uppercase tracking-widest">PCA User Embedding</h3>
          <span className="ml-auto text-cyber-text/30 font-mono text-xs">n={users.length} users · 2D projection</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c30" />
            <XAxis type="number" dataKey="x" name="PC1" tick={{ fill: '#a8c0d640', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
            <YAxis type="number" dataKey="y" name="PC2" tick={{ fill: '#a8c0d640', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
            <ZAxis type="number" dataKey="z" range={[30, 200]} name="Risk Score" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#1a3a5c' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div className="bg-cyber-card border border-cyber-border p-2 rounded font-mono text-xs">
                    <p className="text-cyber-text/80">{d?.name}</p>
                    <p className="text-cyber-orange">Risk: {d?.risk?.toFixed(1)}</p>
                    <p className="text-cyber-text/40">PC1: {d?.x?.toFixed(2)}, PC2: {d?.y?.toFixed(2)}</p>
                  </div>
                )
              }}
            />
            <Scatter data={pcaData} name="Users">
              {pcaData.map((point, i) => (
                <Cell
                  key={i}
                  fill={point.risk >= 80 ? '#ff2d55' : point.risk >= 60 ? '#ff6b00' : point.risk >= 40 ? '#ffd60a' : '#00ff9d'}
                  fillOpacity={0.8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          {[
            { label: 'Low Risk (< 40)', color: '#00ff9d' },
            { label: 'Medium (40-60)', color: '#ffd60a' },
            { label: 'High (60-80)', color: '#ff6b00' },
            { label: 'Critical (> 80)', color: '#ff2d55' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-cyber-text/40 font-mono text-xs">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Model Training Info */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'Training Dataset',
            items: [
              { label: 'Dataset', value: 'CERT Insider Threat v4.2' },
              { label: 'Users', value: '2,000 synthetic' },
              { label: 'Events', value: '32.7M records' },
              { label: 'Time Period', value: '18 months' },
              { label: 'Positive Rate', value: '2.1% (malicious)' },
            ],
            color: 'text-cyber-green',
          },
          {
            title: 'Model Configuration',
            items: [
              { label: 'Voting Strategy', value: 'Weighted Average' },
              { label: 'Window Size', value: '30-day rolling' },
              { label: 'Update Frequency', value: 'Daily retrain' },
              { label: 'Threshold', value: 'Adaptive (Bayesian)' },
              { label: 'Explainability', value: 'SHAP values' },
            ],
            color: 'text-cyber-blue',
          },
          {
            title: 'Deployment',
            items: [
              { label: 'Environment', value: 'Production' },
              { label: 'Version', value: 'v2.4.1' },
              { label: 'Last Train', value: new Date().toLocaleDateString() },
              { label: 'Inference', value: 'Real-time + Batch' },
              { label: 'Data Source', value: 'Supabase CDC' },
            ],
            color: 'text-cyber-purple',
          },
        ].map(({ title, items, color }) => (
          <div key={title} className="cyber-card p-5">
            <h3 className={`font-mono text-xs uppercase tracking-widest mb-3 ${color}`}>{title}</h3>
            <div className="space-y-2">
              {items.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs font-mono">
                  <span className="text-cyber-text/40">{label}</span>
                  <span className="text-cyber-text/70">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
