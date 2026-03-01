import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import * as api from '../api'

const MOCK_STATUS = {
  environment: "gxp-prod-eastus",
  risk_score: 85,
  counts: { critical: 2, suspicious: 3, allowed: 1 },
  last_updated: new Date().toISOString()
}

const MOCK_EVENTS = [
  {
    id: "mock-1",
    resource_id: "genomics-data-storage-prod",
    resource_type: "Storage",
    attribute_path: "properties.encryption.enabled",
    baseline_value: true,
    current_value: false,
    tier: "critical",
    reasoning: "Encryption was disabled on a storage account containing regulated genomic data. This directly violates 21 CFR Part 11.10(a) which requires controls to ensure data integrity and authenticity of electronic records.",
    regulation_reference: "21 CFR Part 11.10(a)",
    remediation_suggestion: 'resource "azurerm_storage_account" "genomics" {\n  name = "genomicsdatastorageprod"\n}',
    gxp_impact: "Storage account is no longer validated for regulated clinical data. FDA submission risk.",
    pr: { pr_url: "https://github.com/velira-demo/infra/pull/42", pr_real: false },
    timestamp: "2025-03-01T00:00:05Z",
    status: "open"
  }
]

const AppContext = createContext(null)

export function AppProvider({ children }){
  const [status, setStatus] = useState(null)
  const [events, setEvents] = useState(null)
  const [offline, setOffline] = useState(false)
  const lastFetchedRef = useRef(null)

  async function loadAll(){
    try {
      const [s, e] = await Promise.all([api.getStatus(), api.getEvents()])
      setStatus(s)
      setEvents(e)
      setOffline(false)
      lastFetchedRef.current = new Date().toISOString()
    } catch (err){
      setOffline(true)
      setStatus(prev => prev || MOCK_STATUS)
      setEvents(prev => prev || MOCK_EVENTS)
    }
  }

  useEffect(() => {
    loadAll()
    const id = setInterval(loadAll, 5000)
    return () => clearInterval(id)
  }, [])

  async function simulateScenario(scenario){
    try {
      const res = await api.triggerDrift(scenario)
      await loadAll()
      return res
    } catch (err){
      setOffline(true)
      return { error: 'backend-unreachable' }
    }
  }

  return (
    <AppContext.Provider value={{
      status, events, offline, simulateScenario, lastFetchedAt: lastFetchedRef.current
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(){
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
