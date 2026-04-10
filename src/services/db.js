import { supabase } from '../lib/supabase'

// ─── Users ────────────────────────────────────────────────
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('risk_score', { ascending: false })
  return { data, error }
}

export async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function updateUserRiskScore(id, score) {
  const { data, error } = await supabase
    .from('users')
    .update({ risk_score: score })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ─── Activities ────────────────────────────────────────────
export async function getActivities(userId = null, limit = 50) {
  let query = supabase
    .from('activities')
    .select('*, users(name, email, department)')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  return { data, error }
}

export async function insertActivity(activity) {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single()
  return { data, error }
}

// ─── Alerts ────────────────────────────────────────────────
export async function getAlerts(options = {}) {
  const { userId, severity, status, limit = 100 } = options

  let query = supabase
    .from('alerts')
    .select('*, users(name, email, department, role)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (userId) query = query.eq('user_id', userId)
  if (severity) query = query.eq('severity', severity)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data, error }
}

export async function insertAlert(alert) {
  const { data, error } = await supabase
    .from('alerts')
    .insert(alert)
    .select('*, users(name, email)')
    .single()
  return { data, error }
}

export async function updateAlertStatus(id, status) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ─── Anomalies ────────────────────────────────────────────
export async function getAnomalies(userId = null, limit = 100) {
  let query = supabase
    .from('anomalies')
    .select('*, users(name, email, department)')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  return { data, error }
}

export async function insertAnomaly(anomaly) {
  const { data, error } = await supabase
    .from('anomalies')
    .insert(anomaly)
    .select()
    .single()
  return { data, error }
}

// ─── Scenarios ────────────────────────────────────────────
export async function getScenarios() {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .order('created_at', { ascending: true })
  return { data, error }
}

// ─── Dashboard Stats ──────────────────────────────────────
export async function getDashboardStats() {
  const [usersRes, alertsRes, anomaliesRes] = await Promise.all([
    supabase.from('users').select('id, risk_score'),
    supabase.from('alerts').select('id, severity, status, created_at'),
    supabase.from('anomalies').select('id, deviation_score, timestamp'),
  ])

  return {
    users: usersRes.data || [],
    alerts: alertsRes.data || [],
    anomalies: anomaliesRes.data || [],
    errors: [usersRes.error, alertsRes.error, anomaliesRes.error].filter(Boolean),
  }
}
