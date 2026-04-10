import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, X, AlertTriangle, CheckCircle,
  TrendingUp, Users, Activity, BarChart2, Table,
  Download, RefreshCw, Info, ChevronDown, ChevronUp,
  Zap, Shield, Eye
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area, PieChart,
  Pie, LineChart, Line, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts'
import { motion as m } from 'framer-motion'

// ─── CSV Parser ───────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [], error: 'CSV must have at least a header row and one data row.' }
  
  const parseRow = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes }
      else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = '' }
      else { current += line[i] }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseRow(lines[i])
    const row = {}
    headers.forEach((h, j) => { row[h] = values[j]?.replace(/^"|"$/g, '').trim() || '' })
    rows.push(row)
  }
  return { headers, rows, error: null }
}

// ─── Detect column types ─────────────────────────────────
function analyzeColumns(headers, rows) {
  return headers.map(h => {
    const vals = rows.map(r => r[h]).filter(v => v !== '' && v != null)
    const numVals = vals.map(v => parseFloat(v)).filter(v => !isNaN(v))
    const isNumeric = numVals.length / vals.length > 0.8
    const unique = [...new Set(vals)]
    const isCategorical = !isNumeric && unique.length <= 20
    const isDate = !isNumeric && vals.some(v => /\d{4}[-/]\d{2}[-/]\d{2}/.test(v) || /\d{2}[-/]\d{2}[-/]\d{4}/.test(v))
    
    return {
      name: h,
      type: isDate ? 'date' : isNumeric ? 'numeric' : isCategorical ? 'categorical' : 'text',
      uniqueCount: unique.length,
      nullCount: rows.length - vals.length,
      min: isNumeric ? Math.min(...numVals) : null,
      max: isNumeric ? Math.max(...numVals) : null,
      mean: isNumeric ? numVals.reduce((a, b) => a + b, 0) / numVals.length : null,
      topValues: unique.slice(0, 8),
      numVals: isNumeric ? numVals : [],
      fillRate: ((vals.length / rows.length) * 100).toFixed(1),
    }
  })
}

// ─── Auto-detect threat relevance ────────────────────────
function detectThreatColumns(headers) {
  const patterns = {
    user: /user|employee|person|id|name|subject/i,
    activity: /action|activity|event|type|category/i,
    time: /time|date|hour|when|ts|timestamp/i,
    risk: /risk|score|threat|anomaly|alert|severity|flag/i,
    volume: /count|amount|size|volume|bytes|mb|gb|number|num/i,
    destination: /dest|target|url|host|ip|domain|email|to/i,
  }
  const detected = {}
  headers.forEach(h => {
    for (const [role, pattern] of Object.entries(patterns)) {
      if (pattern.test(h) && !detected[role]) detected[role] = h
    }
  })
  return detected
}

// ─── Chart colors ─────────────────────────────────────────
const CYBER_COLORS = ['#00ff9d', '#0088ff', '#9d4edd', '#ff6b00', '#ff2d55', '#ffd60a', '#00ccff', '#ff00aa']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-cyber-card border border-cyber-border p-2.5 rounded font-mono text-xs shadow-xl">
      {label && <p className="text-cyber-text/50 mb-1.5 border-b border-cyber-border/40 pb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#a8c0d6' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Column Chart Component ───────────────────────────────
function ColumnChart({ col, rows, index }) {
  const color = CYBER_COLORS[index % CYBER_COLORS.length]

  if (col.type === 'numeric') {
    // Histogram
    const vals = col.numVals
    if (!vals.length) return null
    const buckets = 10
    const min = col.min, max = col.max
    const step = (max - min) / buckets || 1
    const hist = Array.from({ length: buckets }, (_, i) => ({
      label: `${(min + i * step).toFixed(1)}`,
      count: vals.filter(v => v >= min + i * step && v < min + (i + 1) * step).length,
    }))
    return (
      <div className="cyber-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono uppercase tracking-widest truncate" style={{ color }}>{col.name}</span>
          <span className="text-cyber-text/30 font-mono text-xs ml-auto">numeric · histogram</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs font-mono">
          <div className="text-center"><div className="text-cyber-text/40">MIN</div><div style={{ color }}>{col.min?.toFixed(2)}</div></div>
          <div className="text-center"><div className="text-cyber-text/40">MEAN</div><div style={{ color }}>{col.mean?.toFixed(2)}</div></div>
          <div className="text-center"><div className="text-cyber-text/40">MAX</div><div style={{ color }}>{col.max?.toFixed(2)}</div></div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={hist} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c30" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#a8c0d630', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fill: '#a8c0d630', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Count" fill={color} fillOpacity={0.8} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (col.type === 'categorical') {
    const freq = {}
    rows.forEach(r => { const v = r[col.name]; if (v) freq[v] = (freq[v] || 0) + 1 })
    const data = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, value]) => ({ name: name.slice(0, 16), value }))
    return (
      <div className="cyber-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono uppercase tracking-widest truncate" style={{ color }}>{col.name}</span>
          <span className="text-cyber-text/30 font-mono text-xs ml-auto">categorical · {col.uniqueCount} unique</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} layout="vertical" barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c30" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#a8c0d630', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#a8c0d660', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Count" radius={[0, 3, 3, 0]}>
              {data.map((_, i) => <Cell key={i} fill={color} fillOpacity={0.6 + i * 0.04} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Text column — just show fill rate + top values
  return (
    <div className="cyber-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono uppercase tracking-widest truncate" style={{ color }}>{col.name}</span>
        <span className="text-cyber-text/30 font-mono text-xs ml-auto">text</span>
      </div>
      <div className="text-cyber-text/40 font-mono text-xs mb-2">Top Values</div>
      <div className="flex flex-wrap gap-1.5">
        {col.topValues.slice(0, 6).map((v, i) => (
          <span key={i} className="px-2 py-0.5 rounded text-xs font-mono border border-cyber-border/40 text-cyber-text/60 truncate max-w-32" style={{ borderColor: `${color}30` }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Threat Analysis ─────────────────────────────────────
function ThreatAnalysis({ rows, columns, threatCols }) {
  const riskCol = columns.find(c => c.name === threatCols.risk)
  const userCol = columns.find(c => c.name === threatCols.user)
  const activityCol = columns.find(c => c.name === threatCols.activity)

  // Compute user risk scores if we have a risk column
  const userRisks = userCol && riskCol
    ? (() => {
        const byUser = {}
        rows.forEach(r => {
          const u = r[userCol.name]
          const v = parseFloat(r[riskCol.name])
          if (u && !isNaN(v)) {
            if (!byUser[u]) byUser[u] = { sum: 0, count: 0 }
            byUser[u].sum += v; byUser[u].count++
          }
        })
        return Object.entries(byUser)
          .map(([name, d]) => ({ name: name.slice(0, 14), score: +(d.sum / d.count).toFixed(2), events: d.count }))
          .sort((a, b) => b.score - a.score).slice(0, 10)
      })()
    : []

  // Activity breakdown
  const actBreakdown = activityCol
    ? (() => {
        const freq = {}
        rows.forEach(r => { const v = r[activityCol.name]; if (v) freq[v] = (freq[v] || 0) + 1 })
        return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)
          .map(([name, value]) => ({ name: name.slice(0, 14), value }))
      })()
    : []

  // Flag high-risk rows
  const highRiskRows = riskCol
    ? rows.filter(r => {
        const v = parseFloat(r[riskCol.name])
        return !isNaN(v) && v > (riskCol.max * 0.75)
      }).slice(0, 5)
    : []

  if (!userRisks.length && !actBreakdown.length && !highRiskRows.length) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-cyber-border/30 pb-3">
        <Shield size={14} className="text-cyber-red" />
        <h3 className="font-display text-cyber-red tracking-widest text-sm">THREAT ANALYSIS</h3>
        <span className="text-cyber-text/30 font-mono text-xs ml-auto">auto-detected from column mapping</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {userRisks.length > 0 && (
          <div className="cyber-card p-4 border-red-500/20">
            <h4 className="font-mono text-xs text-red-400 uppercase tracking-widest mb-3">Top Risk Users</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userRisks} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c30" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#a8c0d640', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#a8c0d640', fontSize: 8, fontFamily: 'JetBrains Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" name="Risk Score" radius={[3, 3, 0, 0]}>
                  {userRisks.map((u, i) => (
                    <Cell key={i} fill={u.score > riskCol.mean * 1.5 ? '#ff2d55' : u.score > riskCol.mean ? '#ff6b00' : '#00ff9d'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {actBreakdown.length > 0 && (
          <div className="cyber-card p-4 border-blue-500/20">
            <h4 className="font-mono text-xs text-cyber-blue uppercase tracking-widest mb-3">Activity Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={actBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name" paddingAngle={3}>
                  {actBreakdown.map((_, i) => <Cell key={i} fill={CYBER_COLORS[i % CYBER_COLORS.length]} fillOpacity={0.85} strokeWidth={0} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {highRiskRows.length > 0 && (
        <div className="cyber-card p-4 border-red-500/20">
          <h4 className="font-mono text-xs text-red-400 uppercase tracking-widest mb-3">
            ⚠ High-Risk Records Detected ({highRiskRows.length} shown)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-cyber-border/40">
                  {Object.keys(highRiskRows[0]).slice(0, 6).map(h => (
                    <th key={h} className="text-left p-2 text-cyber-text/40 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {highRiskRows.map((row, i) => (
                  <tr key={i} className="border-b border-cyber-border/20 hover:bg-red-500/5 transition-colors">
                    {Object.values(row).slice(0, 6).map((v, j) => (
                      <td key={j} className="p-2 text-cyber-text/70">{String(v).slice(0, 30)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Summary Stats ────────────────────────────────────────
function DataSummary({ rows, columns, filename, threatCols }) {
  const numericCols = columns.filter(c => c.type === 'numeric')
  const categoricalCols = columns.filter(c => c.type === 'categorical')
  const nullTotal = columns.reduce((s, c) => s + c.nullCount, 0)
  const riskColName = threatCols.risk
  const riskCol = columns.find(c => c.name === riskColName)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {[
        { label: 'Total Rows', value: rows.length.toLocaleString(), color: 'text-cyber-green', sub: 'records ingested' },
        { label: 'Columns', value: columns.length, color: 'text-cyber-blue', sub: `${numericCols.length} numeric, ${categoricalCols.length} cat` },
        { label: 'Null Values', value: nullTotal, color: nullTotal > 0 ? 'text-cyber-orange' : 'text-cyber-green', sub: `${((nullTotal / (rows.length * columns.length)) * 100).toFixed(1)}% missing` },
        { label: 'Risk Column', value: riskCol ? '✓ Found' : '—', color: riskCol ? 'text-cyber-green' : 'text-cyber-text/40', sub: riskCol ? riskCol.name : 'not detected' },
        { label: 'File', value: filename?.split('.')[0]?.slice(0, 12) || '—', color: 'text-cyber-purple', sub: '.csv dataset' },
      ].map(({ label, value, color, sub }) => (
        <div key={label} className="cyber-card p-4 text-center">
          <div className={`font-display text-xl ${color}`}>{value}</div>
          <div className="text-cyber-text/50 font-mono text-xs mt-0.5">{label}</div>
          <div className="text-cyber-text/30 font-mono text-xs">{sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Data Table Preview ───────────────────────────────────
function DataTable({ rows, headers }) {
  const [page, setPage] = useState(0)
  const pageSize = 10
  const totalPages = Math.ceil(rows.length / pageSize)
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="cyber-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-cyber-border/40">
        <div className="flex items-center gap-2">
          <Table size={14} className="text-cyber-blue" />
          <span className="font-mono text-xs text-cyber-blue uppercase tracking-widest">Raw Data Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cyber-text/30 font-mono text-xs">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} of {rows.length.toLocaleString()}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 font-mono text-xs border border-cyber-border/40 rounded disabled:opacity-30 hover:border-cyber-green/40 text-cyber-text/50 transition-all"
            >←</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 font-mono text-xs border border-cyber-border/40 rounded disabled:opacity-30 hover:border-cyber-green/40 text-cyber-text/50 transition-all"
            >→</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-cyber-border/40">
              <th className="text-left p-3 text-cyber-text/30 font-mono">#</th>
              {headers.slice(0, 8).map(h => (
                <th key={h} className="text-left p-3 text-cyber-green/70 font-mono uppercase tracking-wider whitespace-nowrap">{h.slice(0, 16)}</th>
              ))}
              {headers.length > 8 && <th className="p-3 text-cyber-text/20">+{headers.length - 8} more</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-cyber-border/20 hover:bg-white/2 transition-colors"
              >
                <td className="p-3 text-cyber-text/20">{page * pageSize + i + 1}</td>
                {headers.slice(0, 8).map(h => (
                  <td key={h} className="p-3 text-cyber-text/70 whitespace-nowrap max-w-32 truncate">
                    {String(row[h] ?? '').slice(0, 24)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Correlation Heatmap ─────────────────────────────────
function CorrelationMatrix({ columns, rows }) {
  const numCols = columns.filter(c => c.type === 'numeric').slice(0, 6)
  if (numCols.length < 2) return null

  const corr = (a, b) => {
    const aVals = rows.map(r => parseFloat(r[a])).filter(v => !isNaN(v))
    const bVals = rows.map(r => parseFloat(r[b])).filter(v => !isNaN(v))
    const n = Math.min(aVals.length, bVals.length)
    if (n < 2) return 0
    const aMean = aVals.slice(0, n).reduce((s, v) => s + v, 0) / n
    const bMean = bVals.slice(0, n).reduce((s, v) => s + v, 0) / n
    const cov = aVals.slice(0, n).reduce((s, v, i) => s + (v - aMean) * (bVals[i] - bMean), 0) / n
    const aStd = Math.sqrt(aVals.slice(0, n).reduce((s, v) => s + (v - aMean) ** 2, 0) / n)
    const bStd = Math.sqrt(bVals.slice(0, n).reduce((s, v) => s + (v - bMean) ** 2, 0) / n)
    return aStd && bStd ? +(cov / (aStd * bStd)).toFixed(3) : 0
  }

  const getColor = (v) => {
    if (v >= 0.7) return '#00ff9d'
    if (v >= 0.3) return '#0088ff'
    if (v >= 0) return '#9d4edd'
    if (v >= -0.3) return '#ff6b00'
    return '#ff2d55'
  }

  return (
    <div className="cyber-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={14} className="text-cyber-purple" />
        <h3 className="font-mono text-xs text-cyber-purple uppercase tracking-widest">Correlation Matrix</h3>
        <span className="ml-auto text-cyber-text/30 font-mono text-xs">Pearson r — numeric columns</span>
      </div>
      <div className="overflow-x-auto">
        <table className="font-mono text-xs">
          <thead>
            <tr>
              <th className="p-2 text-cyber-text/30 font-mono text-left w-28"></th>
              {numCols.map(c => (
                <th key={c.name} className="p-2 text-cyber-text/50 font-mono text-center min-w-16 max-w-20 truncate">{c.name.slice(0, 8)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numCols.map(row => (
              <tr key={row.name}>
                <td className="p-2 text-cyber-text/50 truncate max-w-28">{row.name.slice(0, 12)}</td>
                {numCols.map(col => {
                  const v = corr(row.name, col.name)
                  const isSame = row.name === col.name
                  return (
                    <td key={col.name} className="p-1">
                      <div
                        className="rounded text-center py-1.5 px-2 font-mono text-xs"
                        style={{
                          background: isSame ? '#1a3a5c40' : `${getColor(v)}15`,
                          color: isSame ? '#a8c0d640' : getColor(v),
                          border: `1px solid ${isSame ? '#1a3a5c30' : getColor(v) + '30'}`,
                        }}
                      >
                        {isSame ? '1.00' : v.toFixed(2)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────
export default function CSVUploadPage() {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null) // { headers, rows, error }
  const [columns, setColumns] = useState([])
  const [threatCols, setThreatCols] = useState({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showTable, setShowTable] = useState(false)
  const fileRef = useRef()

  const processFile = useCallback((f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      setParsed({ headers: [], rows: [], error: 'Only CSV files are supported.' })
      return
    }
    if (f.size > 50 * 1024 * 1024) {
      setParsed({ headers: [], rows: [], error: 'File too large. Max 50MB supported.' })
      return
    }
    setFile(f)
    setLoading(true)
    setParsed(null)
    setColumns([])

    const reader = new FileReader()
    reader.onload = (e) => {
      setTimeout(() => { // allow spinner to show
        const result = parseCSV(e.target.result)
        if (!result.error) {
          const cols = analyzeColumns(result.headers, result.rows)
          const detected = detectThreatColumns(result.headers)
          setColumns(cols)
          setThreatCols(detected)
        }
        setParsed(result)
        setLoading(false)
        setActiveTab('overview')
      }, 300)
    }
    reader.onerror = () => { setParsed({ headers: [], rows: [], error: 'Failed to read file.' }); setLoading(false) }
    reader.readAsText(f)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  const handleReset = () => {
    setFile(null); setParsed(null); setColumns([]); setThreatCols({})
    setActiveTab('overview')
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'columns', label: 'Columns', icon: BarChart2 },
    { id: 'threat', label: 'Threat Analysis', icon: Shield },
    { id: 'correlations', label: 'Correlations', icon: TrendingUp },
    { id: 'table', label: 'Raw Data', icon: Table },
  ]

  return (
    <div className="p-6 space-y-5 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-cyber-blue text-2xl tracking-widest">CSV DATASET ANALYZER</h1>
          <p className="text-cyber-text/40 font-mono text-xs mt-1">
            Upload any behavioral/threat dataset — auto-visualized instantly
          </p>
        </div>
        {parsed && !parsed.error && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-card border border-cyber-border text-cyber-text/50 font-mono text-xs rounded hover:border-red-500/40 hover:text-red-400 transition-all"
          >
            <RefreshCw size={12} /> Reset
          </motion.button>
        )}
      </div>

      {/* Upload Zone */}
      {!parsed?.rows?.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-300 ${
              dragOver
                ? 'border-cyber-blue bg-cyber-blue/10 scale-[1.01]'
                : 'border-cyber-border/50 hover:border-cyber-blue/50 hover:bg-cyber-blue/5'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => processFile(e.target.files[0])}
            />

            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-2 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin" />
                <p className="font-mono text-cyber-blue text-sm">Parsing dataset...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ y: dragOver ? -8 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 rounded-full bg-cyber-blue/10 border border-cyber-blue/20"
                >
                  <Upload size={32} className="text-cyber-blue" />
                </motion.div>
                <div>
                  <p className="font-display text-cyber-blue text-lg tracking-widest">
                    {dragOver ? 'DROP TO ANALYZE' : 'DROP CSV FILE HERE'}
                  </p>
                  <p className="text-cyber-text/40 font-mono text-sm mt-2">
                    or click to browse · max 50MB
                  </p>
                </div>
                <div className="flex items-center gap-6 text-cyber-text/30 font-mono text-xs">
                  <span className="flex items-center gap-1"><CheckCircle size={10} className="text-cyber-green" /> Auto column detection</span>
                  <span className="flex items-center gap-1"><CheckCircle size={10} className="text-cyber-green" /> Threat pattern analysis</span>
                  <span className="flex items-center gap-1"><CheckCircle size={10} className="text-cyber-green" /> Interactive charts</span>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {parsed?.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 font-mono text-sm">{parsed.error}</p>
            </motion.div>
          )}

          {/* Sample format hint */}
          <div className="cyber-card border-cyber-blue/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={12} className="text-cyber-blue/60" />
              <span className="font-mono text-xs text-cyber-text/40 uppercase tracking-widest">Supported CSV Formats</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[
                { label: 'CERT Insider Threat', cols: 'user, date, activity, filename, url, email, bytes' },
                { label: 'Network Logs', cols: 'timestamp, src_ip, dst_ip, bytes_in, bytes_out, protocol' },
                { label: 'Access Logs', cols: 'user_id, resource, action, risk_score, department, time' },
              ].map(({ label, cols }) => (
                <div key={label} className="p-3 bg-white/2 border border-cyber-border/20 rounded">
                  <div className="text-cyber-text/60 font-mono text-xs mb-1">{label}</div>
                  <div className="text-cyber-text/30 font-mono text-xs">{cols}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {parsed?.rows?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* File info bar */}
          <div className="flex items-center gap-3 p-3 bg-cyber-green/5 border border-cyber-green/20 rounded-lg">
            <FileText size={14} className="text-cyber-green" />
            <span className="text-cyber-green font-mono text-sm">{file?.name}</span>
            <span className="text-cyber-text/40 font-mono text-xs">
              {parsed.rows.length.toLocaleString()} rows · {parsed.headers.length} columns ·{' '}
              {(file?.size / 1024).toFixed(1)} KB
            </span>
            {Object.keys(threatCols).length > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-cyber-orange font-mono text-xs">
                <Zap size={10} className="text-cyber-orange" />
                {Object.keys(threatCols).length} threat columns auto-detected
              </span>
            )}
          </div>

          {/* Summary Stats */}
          <DataSummary rows={parsed.rows} columns={columns} filename={file?.name} threatCols={threatCols} />

          {/* Tabs */}
          <div className="flex gap-1 border-b border-cyber-border/40 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === id
                    ? 'border-cyber-blue text-cyber-blue'
                    : 'border-transparent text-cyber-text/40 hover:text-cyber-text/70'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Detected mappings */}
                  {Object.keys(threatCols).length > 0 && (
                    <div className="cyber-card border-cyber-orange/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={12} className="text-cyber-orange" />
                        <span className="font-mono text-xs text-cyber-orange uppercase tracking-widest">Auto-Detected Column Mappings</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(threatCols).map(([role, col]) => (
                          <div key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-orange/10 border border-cyber-orange/20 rounded">
                            <span className="text-cyber-text/40 font-mono text-xs uppercase">{role}:</span>
                            <span className="text-cyber-orange font-mono text-xs">{col}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Column summary table */}
                  <div className="cyber-card overflow-hidden">
                    <div className="p-4 border-b border-cyber-border/40">
                      <span className="font-mono text-xs text-cyber-text/50 uppercase tracking-widest">Column Schema</span>
                    </div>
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-cyber-border/30">
                          {['Column', 'Type', 'Unique', 'Nulls', 'Fill %', 'Min', 'Max', 'Mean'].map(h => (
                            <th key={h} className="text-left p-3 text-cyber-text/30 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((col, i) => (
                          <tr key={col.name} className="border-b border-cyber-border/20 hover:bg-white/2">
                            <td className="p-3 font-mono" style={{ color: CYBER_COLORS[i % CYBER_COLORS.length] }}>{col.name}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                col.type === 'numeric' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                col.type === 'categorical' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                col.type === 'date' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-white/5 text-cyber-text/40 border border-cyber-border/20'
                              }`}>{col.type}</span>
                            </td>
                            <td className="p-3 text-cyber-text/60">{col.uniqueCount}</td>
                            <td className="p-3 text-cyber-text/60">{col.nullCount || '—'}</td>
                            <td className="p-3">
                              <span className={col.fillRate < 80 ? 'text-red-400' : 'text-cyber-green'}>{col.fillRate}%</span>
                            </td>
                            <td className="p-3 text-cyber-text/50">{col.min != null ? col.min.toFixed(2) : '—'}</td>
                            <td className="p-3 text-cyber-text/50">{col.max != null ? col.max.toFixed(2) : '—'}</td>
                            <td className="p-3 text-cyber-text/50">{col.mean != null ? col.mean.toFixed(2) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COLUMNS */}
              {activeTab === 'columns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {columns.map((col, i) => (
                    <motion.div
                      key={col.name}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <ColumnChart col={col} rows={parsed.rows} index={i} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* THREAT ANALYSIS */}
              {activeTab === 'threat' && (
                <ThreatAnalysis
                  rows={parsed.rows}
                  columns={columns}
                  threatCols={threatCols}
                />
              )}

              {/* CORRELATIONS */}
              {activeTab === 'correlations' && (
                <CorrelationMatrix columns={columns} rows={parsed.rows} />
              )}

              {/* TABLE */}
              {activeTab === 'table' && (
                <DataTable rows={parsed.rows} headers={parsed.headers} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
