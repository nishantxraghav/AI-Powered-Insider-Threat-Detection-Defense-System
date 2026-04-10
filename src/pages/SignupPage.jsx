import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    const { error } = await signUp(email, password, { role: 'analyst' })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      toast.success('Account created — check your email to confirm')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-cyber-black bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      <div className="scan-line" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 h-64 w-64 bg-cyber-blue/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative p-3 bg-cyber-blue/10 border border-cyber-blue/30 rounded-lg">
              <Shield size={28} className="text-cyber-blue" />
            </div>
            <div className="text-left">
              <div className="font-display text-cyber-blue text-xl tracking-widest">THREATWATCH</div>
              <div className="text-cyber-text/30 text-xs font-mono">ACCESS REQUEST</div>
            </div>
          </div>
        </div>

        <div className="cyber-card border-cyber-blue/20 p-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-cyber-border/50">
            <div className="h-2 w-2 bg-cyber-blue rounded-full animate-pulse" />
            <span className="text-cyber-blue font-mono text-xs tracking-widest">NEW OPERATOR REGISTRATION</span>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded mb-4"
            >
              <AlertTriangle size={14} className="text-red-400" />
              <p className="text-red-400 font-mono text-xs">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Email Identity', val: email, set: setEmail, type: 'email', ph: 'analyst@corp.com' },
              { label: 'Auth Token', val: password, set: setPassword, type: 'password', ph: 'Min 6 chars' },
              { label: 'Confirm Token', val: confirm, set: setConfirm, type: 'password', ph: 'Repeat token' },
            ].map(({ label, val, set, type, ph }) => (
              <div key={label}>
                <label className="block text-xs font-mono text-cyber-text/50 mb-2 tracking-widest uppercase">{label}</label>
                <input
                  type={type}
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={ph}
                  required
                  className="w-full bg-cyber-black/60 border border-cyber-border text-cyber-text/90 font-mono text-sm px-4 py-3 rounded focus:outline-none focus:border-cyber-blue/50 transition-all placeholder:text-cyber-text/20"
                />
              </div>
            ))}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyber-blue/10 border border-cyber-blue/40 text-cyber-blue font-mono text-sm tracking-widest rounded hover:bg-cyber-blue/20 transition-all disabled:opacity-50"
            >
              {loading ? 'REGISTERING...' : '→ CREATE OPERATOR ACCOUNT'}
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-cyber-border/50 text-center">
            <span className="text-cyber-text/30 font-mono text-xs">Already have clearance? </span>
            <Link to="/login" className="text-cyber-green/70 font-mono text-xs hover:text-cyber-green transition-colors">
              Sign In →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
