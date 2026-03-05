import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import {
  fetchStatus,
  fetchEvents,
  fetchAuditTrail,
  triggerDrift as apiTriggerDrift,
  setApiBase,
  getApiBase,
} from '../api'

const POLL_INTERVAL = 3000
const LIVE_URL = 'https://latch-api.onrender.com'

const MOCK_STATUS = {
  state: 'compliant',
  environment: 'gxp-prod-eastus',
  risk_score: 0,
  counts: { critical: 0, suspicious: 0, allowed: 0 },
  last_updated: new Date().toISOString(),
  total_resources: 4,
  compliant_resources: 4,
  drifted_resources: 0,
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── Status ──
  const [status, setStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState(null)

  // ── Events ──
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState(null)

  // ── Selected event detail ──
  const [selectedEventId, setSelectedEventId] = useState(null)

  // ── Audit trail (loaded on demand, not polled) ──
  const [audit, setAudit] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState(null)

  // ── Trigger ──
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [triggerError, setTriggerError] = useState(null)

  // ── Offline flag ──
  const [offline, setOffline] = useState(false)

  // ── Connection state for Go Live ──
  const [connectionState, setConnectionState] = useState('disconnected') // 'disconnected' | 'connecting' | 'connected'

  // ── Loaders ──
  const loadStatus = useCallback(async () => {
    try {
      const s = await fetchStatus()
      setStatus(s)
      setStatusError(null)
      setOffline(false)
    } catch (err) {
      setStatusError(err.message)
      setOffline(true)
      setStatus(prev => prev || MOCK_STATUS)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  const loadEvents = useCallback(async () => {
    try {
      const e = await fetchEvents()
      const sorted = Array.isArray(e)
        ? e.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        : []
      setEvents(sorted)
      setEventsError(null)
      setOffline(false)
    } catch (err) {
      setEventsError(err.message)
      setOffline(true)
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const loadAudit = useCallback(async () => {
    setAuditLoading(true)
    try {
      const data = await fetchAuditTrail()
      setAudit(data.entries || [])
      setAuditError(null)
    } catch (err) {
      setAuditError(err.message)
    } finally {
      setAuditLoading(false)
    }
  }, [])

  // ── Go Live ──
  const goLive = useCallback(async () => {
    setConnectionState('connecting')
    setApiBase(LIVE_URL)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)
      const res = await fetch(`${LIVE_URL}/api/health`, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setConnectionState('connected')
      setOffline(false)
      await apiTriggerDrift('critical')
      await Promise.all([loadStatus(), loadEvents()])
    } catch {
      setApiBase('')
      setConnectionState('disconnected')
    }
  }, [loadStatus, loadEvents])

  // ── Auto-restore from sessionStorage on mount ──
  const hasAutoRestored = useRef(false)
  useEffect(() => {
    if (hasAutoRestored.current) return
    hasAutoRestored.current = true
    const saved = getApiBase()
    if (saved && saved === LIVE_URL) {
      goLive()
    }
  }, [goLive])

  // ── Polling: status + events only ──
  useEffect(() => {
    loadStatus()
    loadEvents()
    const id = setInterval(() => {
      loadStatus()
      loadEvents()
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [loadStatus, loadEvents])

  // ── Trigger drift ──
  const handleTriggerDrift = useCallback(async (scenario = 'critical') => {
    setTriggerLoading(true)
    setTriggerError(null)
    try {
      await apiTriggerDrift(scenario)
      // Immediately refresh status + events instead of waiting for next poll
      await Promise.all([loadStatus(), loadEvents()])
    } catch (err) {
      setTriggerError('Failed to trigger drift scenario')
    } finally {
      setTriggerLoading(false)
    }
  }, [loadStatus, loadEvents])

  return (
    <AppContext.Provider value={{
      // Status
      status,
      statusLoading,
      statusError,
      // Events
      events,
      eventsLoading,
      eventsError,
      // Selected event
      selectedEventId,
      setSelectedEventId,
      // Audit trail
      audit,
      auditLoading,
      auditError,
      loadAudit,
      // Trigger
      triggerLoading,
      triggerError,
      handleTriggerDrift,
      // General
      offline,
      // Go Live
      connectionState,
      goLive,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
