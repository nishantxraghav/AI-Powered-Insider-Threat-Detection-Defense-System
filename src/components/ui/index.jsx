import { motion } from 'framer-motion'

export function StatusBadge({ severity, status, className = '' }) {
  const val = (severity || status || '').toLowerCase()

  const map = {
    high: 'text-red-400 bg-red-400/10 border border-red-400/30',
    critical: 'text-red-300 bg-red-500/20 border border-red-500/50 animate-pulse',
    medium: 'text-orange-400 bg-orange-400/10 border border-orange-400/30',
    low: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30',
    open: 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/30',
    investigating: 'text-purple-400 bg-purple-400/10 border border-purple-400/30',
    resolved: 'text-green-400 bg-green-400/10 border border-green-400/30',
    false_positive: 'text-gray-400 bg-gray-400/10 border border-gray-400/30',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider ${map[val] || 'text-gray-400 bg-gray-400/10'} ${className}`}>
      {val === 'critical' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />}
      {val}
    </span>
  )
}

export function MetricCard({ label, value, sub, icon: Icon, color = 'green', trend, onClick, className = '' }) {
  const colors = {
    green: { text: 'text-cyber-green', border: 'border-cyber-green/20', glow: 'shadow-[0_0_20px_rgba(0,255,157,0.1)]', bg: 'bg-cyber-green/5' },
    red: { text: 'text-cyber-red', border: 'border-cyber-red/20', glow: 'shadow-[0_0_20px_rgba(255,45,85,0.1)]', bg: 'bg-cyber-red/5' },
    blue: { text: 'text-cyber-blue', border: 'border-cyber-blue/20', glow: 'shadow-[0_0_20px_rgba(0,136,255,0.1)]', bg: 'bg-cyber-blue/5' },
    orange: { text: 'text-cyber-orange', border: 'border-cyber-orange/20', glow: 'shadow-[0_0_20px_rgba(255,107,0,0.1)]', bg: 'bg-cyber-orange/5' },
  }

  const c = colors[color] || colors.green

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`cyber-card ${c.border} ${c.glow} p-5 cursor-pointer ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono text-cyber-text/60 uppercase tracking-widest">{label}</span>
        {Icon && <div className={`${c.bg} p-2 rounded`}><Icon size={14} className={c.text} /></div>}
      </div>
      <div className={`text-3xl font-display ${c.text} mb-1`}>{value}</div>
      {sub && <div className="text-xs text-cyber-text/50 font-mono">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-xs mt-2 font-mono ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last 24h
        </div>
      )}
    </motion.div>
  )
}

export function LoadingSpinner({ size = 'md' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${s} border-2 border-cyber-green/30 border-t-cyber-green rounded-full animate-spin`} />
      <span className="ml-3 text-cyber-text/50 font-mono text-sm">Fetching data...</span>
    </div>
  )
}

export function ErrorMessage({ message }) {
  return (
    <div className="cyber-card border-red-500/30 p-4 m-4">
      <p className="text-red-400 font-mono text-sm">⚠ {message}</p>
    </div>
  )
}

export function EmptyState({ message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-cyber-text/30">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <p className="font-mono text-sm">{message}</p>
    </div>
  )
}

export function RiskBar({ score, showLabel = true }) {
  const color = score >= 80 ? '#ff2d55' : score >= 60 ? '#ff6b00' : score >= 40 ? '#ffd60a' : '#00ff9d'

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs font-mono">
          <span className="text-cyber-text/50">RISK</span>
          <span style={{ color }}>{score.toFixed(1)}</span>
        </div>
      )}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #00ff9d, ${color})` }}
        />
      </div>
    </div>
  )
}

export function CyberButton({ children, onClick, variant = 'primary', size = 'md', disabled, className = '' }) {
  const variants = {
    primary: 'bg-cyber-green/10 border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/20 hover:border-cyber-green/70',
    danger: 'bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20',
    ghost: 'border border-white/10 text-cyber-text/70 hover:border-white/20 hover:text-cyber-text',
    purple: 'bg-purple-500/10 border border-purple-500/40 text-purple-400 hover:bg-purple-500/20',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`font-mono rounded transition-all duration-200 ${variants[variant]} ${sizes[size]} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </motion.button>
  )
}
