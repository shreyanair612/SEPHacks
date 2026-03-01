import React, { useState, useEffect } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import DriftEventCard from '../components/DriftEventCard'
import CodeBlock from '../components/CodeBlock'
import StatusPill from '../components/StatusPill'
import { useApp } from '../context/AppContext'
import { fetchEventById } from '../api'

/* ── Event Detail Side Panel ─────────────────────── */

function EventDetailPanel({ eventId, onClose }) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    fetchEventById(eventId)
      .then(data => {
        if (data && !data.error) setEvent(data)
        else setError('Event not found')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId])

  if (!eventId) return null

  const labelStyle = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 6,
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: 480,
      height: '100vh',
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-default)',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Event Detail</div>
        <div onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={18} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>
            Loading...
          </div>
        )}
        {error && (
          <div style={{ color: 'var(--status-critical)', fontSize: 13, textAlign: 'center', padding: 40 }}>
            {error}
          </div>
        )}
        {event && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tier + Resource */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <StatusPill tier={event.tier || event.severity}>{event.tier || event.severity}</StatusPill>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{event.resource_name || event.resource_id}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {event.resource_type} &middot; {new Date(event.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Baseline vs Current — side by side */}
            {event.attribute_path && (
              <div>
                <div style={labelStyle}>Configuration Change</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{event.attribute_path}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{
                    background: 'rgba(152, 193, 217, 0.08)',
                    border: '1px solid rgba(152, 193, 217, 0.12)',
                    borderRadius: 4,
                    padding: 12,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Baseline (v3.2)</div>
                    <pre style={{ fontSize: 12, color: '#98C1D9', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {typeof event.baseline_value === 'object'
                        ? JSON.stringify(event.baseline_value, null, 2)
                        : String(event.baseline_value)}
                    </pre>
                  </div>
                  <div style={{
                    background: 'rgba(239, 83, 80, 0.06)',
                    border: '1px solid rgba(239, 83, 80, 0.15)',
                    borderRadius: 4,
                    padding: 12,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Current</div>
                    <pre style={{ fontSize: 12, color: '#EF5350', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {typeof event.current_value === 'object'
                        ? JSON.stringify(event.current_value, null, 2)
                        : String(event.current_value)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div>
              <div style={labelStyle}>AI Analysis</div>
              <div style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                padding: 16, borderRadius: 6, background: 'rgba(83, 58, 123, 0.3)',
              }}>
                {event.reasoning || event.reason || 'No analysis available'}
              </div>
            </div>

            {/* Regulation Reference */}
            {(event.regulation_reference || event.cfr_reference) && (
              <div>
                <div style={labelStyle}>Regulation Reference</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 2,
                  background: 'rgba(152, 193, 217, 0.12)', color: 'var(--accent-primary)',
                  fontSize: 12, fontWeight: 500,
                }}>
                  {event.regulation_reference || event.cfr_reference}
                </div>
              </div>
            )}

            {/* GxP Impact */}
            {event.gxp_impact && (
              <div>
                <div style={labelStyle}>GxP Impact</div>
                <div style={{
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                  padding: 16, borderRadius: 6, background: 'rgba(83, 58, 123, 0.3)',
                }}>
                  {event.gxp_impact}
                </div>
              </div>
            )}

            {/* Remediation Suggestion */}
            {event.remediation_suggestion && (
              <div>
                <div style={labelStyle}>Remediation</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                  {event.remediation_suggestion}
                </div>
              </div>
            )}

            {/* Remediation Code */}
            {event.remediation_code && (
              <div>
                <div style={labelStyle}>Remediation Code</div>
                <CodeBlock code={event.remediation_code} />
              </div>
            )}

            {/* PR Link */}
            {(event.pr?.pr_url || event.pr_link) && (
              <div>
                <div style={labelStyle}>Auto-Remediation PR</div>
                <a
                  href={event.pr?.pr_url || event.pr_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: 'var(--accent-secondary)', color: '#FFFFFF', textDecoration: 'none',
                  }}
                >
                  View PR &rarr;
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Drift Events Page ───────────────────────────── */

export default function DriftEvents() {
  const { events } = useApp()
  const [selectedId, setSelectedId] = useState(null)

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 240, padding: '32px 40px', marginRight: selectedId ? 480 : 0, transition: 'margin-right 0.2s ease' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 24 }}>Drift Events</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events && events.length ? events.map(e => (
            <div key={e.id} onClick={() => setSelectedId(e.id)} style={{ cursor: 'pointer' }}>
              <DriftEventCard evt={e} />
            </div>
          )) : (
            <div className="glass-panel-static" style={{ textAlign: 'center', padding: 40 }}>
              <ShieldCheck size={32} style={{ color: 'var(--accent-secondary)', marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>No events</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Trigger a drift scenario from the Dashboard</div>
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      {selectedId && (
        <EventDetailPanel eventId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
