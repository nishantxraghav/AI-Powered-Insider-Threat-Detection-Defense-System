import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtime(table, callback, filter = null) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter || {}) },
        (payload) => callbackRef.current(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter])
}

export function useRealtimeAlerts(onNewAlert) {
  useRealtime('alerts', (payload) => {
    if (payload.eventType === 'INSERT') {
      onNewAlert(payload.new)
    }
  })
}

export function useRealtimeAnomalies(onNewAnomaly) {
  useRealtime('anomalies', (payload) => {
    if (payload.eventType === 'INSERT') {
      onNewAnomaly(payload.new)
    }
  })
}
