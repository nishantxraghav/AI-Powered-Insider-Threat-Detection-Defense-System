import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
      toast.error('Authentication failed')
    } else {
      toast.success('Access granted')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-cyber-black bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="scan-line" />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 bg-cyber-green/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-cyber-blue/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="relative p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
              <Shield size={28} className="text-cyber-green" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-cyber-green rounded-full animate-pulse" />
            </div>
            <div className="text-left">
              <div className="font-display text-cyber-green text-xl tracking-widest">THREATWATCH</div>
              <div className="text-cyber-text/30 text-xs font-mono">INSIDER THREAT DETECTION SYSTEM</div>
            </div>
          </motion.div>
          <p className="text-cyber-text/40 font-mono text-xs">SECURE ACCESS TERMINAL // CLEARANCE REQUIRED</p>
        </div>

        {/* Form */}
        <div className="cyber-card border-cyber-green/20 p-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-cyber-border/50">
            <div className="h-2 w-2 bg-cyber-green rounded-full animate-pulse" />
            <span className="text-cyber-green font-mono text-xs tracking-widest">AUTHENTICATION REQUIRED</span>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded mb-4"
            >
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 font-mono text-xs">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-cyber-text/50 mb-2 tracking-widest uppercase">
                Identity
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="analyst@corp.com"
                required
                className="w-full bg-cyber-black/60 border border-cyber-border text-cyber-text/90 font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-cyber-green/50 focus:shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all placeholder:text-cyber-text/20"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-cyber-text/50 mb-2 tracking-widest uppercase">
                Auth Token
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-cyber-black/60 border border-cyber-border text-cyber-text/90 font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-cyber-green/50 focus:shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all placeholder:text-cyber-text/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text/30 hover:text-cyber-text/70"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyber-green/10 border border-cyber-green/40 text-cyber-green font-mono text-sm tracking-widest rounded hover:bg-cyber-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3 w-3 border border-cyber-green/30 border-t-cyber-green rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : '→ INITIATE SESSION'}
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-cyber-border/50 text-center">
            <span className="text-cyber-text/30 font-mono text-xs">No clearance? </span>
            <Link to="/signup" className="text-cyber-green/70 font-mono text-xs hover:text-cyber-green transition-colors">
              Request Access →
            </Link>
          </div>
        </div>

        <p className="text-center text-cyber-text/20 font-mono text-xs mt-6">
          ALL ACTIVITY MONITORED AND LOGGED // CERT v4.2
        </p>
      </motion.div>
    </div>
  )
}
