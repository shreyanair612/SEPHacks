import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Bell,
  FileText, ShieldCheck, Activity, AlertTriangle, Loader,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import GoLiveButton from '../components/GoLiveButton'
import useCountUp from '../hooks/useCountUp'
import { useApp } from '../context/AppContext'

/* ── Chart Data ─────────────────────────────────── */

const COMPLIANCE_TREND = [
  { day: 'Mon', compliance: 87, drift: 13 },
  { day: 'Tue', compliance: 89, drift: 11 },
  { day: 'Wed', compliance: 85, drift: 15 },
  { day: 'Thu', compliance: 91, drift: 9 },
  { day: 'Fri', compliance: 93, drift: 7 },
  { day: 'Sat', compliance: 90, drift: 10 },
  { day: 'Sun', compliance: 94, drift: 6 },
]

/* ── Severity Config ────────────────────────────── */

const SEVERITY_COLORS = {
  critical: '#EF5350',
  suspicious: '#FFA726',
  warning: '#FFA726',
  allowed: '#66BB6A',
}

const SEVERITY_BADGE = {
  critical: { bg: 'rgba(239, 83, 80, 0.12)', color: '#EF5350', label: 'Critical' },
  suspicious: { bg: 'rgba(255, 167, 38, 0.12)', color: '#FFA726', label: 'Suspicious' },
  warning: { bg: 'rgba(255, 167, 38, 0.12)', color: '#FFA726', label: 'Warning' },
  allowed: { bg: 'rgba(102, 187, 106, 0.12)', color: '#66BB6A', label: 'Allowed' },
}

/* ── Stat Card ──────────────────────────────────── */

function StatCard({ stat, index }) {
  const display = useCountUp(stat.value, 800)
  const Icon = stat.icon
  return (
    <div
      className={`glass-panel-static fade-in fade-in-${index + 1}`}
      style={{
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'border-color var(--transition-smooth), transform var(--transition-smooth), box-shadow var(--transition-smooth)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-glow)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-default)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 6,
        background: 'rgba(152, 193, 217, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} strokeWidth={1.5} style={{ color: stat.valueColor }} />
      </div>
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}>
          {stat.label}
        </div>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: stat.valueColor,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {display}
        </div>
        <div style={{
          fontSize: 11,
          fontWeight: 400,
          marginTop: 4,
          color: stat.changeColor,
        }}>
          {stat.change}
        </div>
      </div>
    </div>
  )
}

/* ── Chart Tooltip (for line hover) ──────────────── */

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'rgba(37, 23, 26, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(152, 193, 217, 0.12)',
      borderRadius: 4,
      padding: '10px 14px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>
          {p.name}: {p.value}{suffix}
        </div>
      ))}
    </div>
  )
}

/* ── Compliance Trend Chart ───────────────────── */

function ComplianceTrendChart() {
  const [range, setRange] = useState('weekly')
  const ranges = ['Weekly', 'Monthly', 'Yearly']

  return (
    <div className="glass-panel-static fade-in" style={{
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      animationDelay: '440ms',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Compliance Trend</div>
          <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--text-muted)', marginTop: 4 }}>7-day policy compliance rate</div>
        </div>
        <div style={{
          display: 'flex',
          border: '1px solid var(--border-default)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          {ranges.map(r => (
            <button
              key={r}
              onClick={() => setRange(r.toLowerCase())}
              style={{
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                fontFamily: 'inherit',
                ...(range === r.toLowerCase()
                  ? { background: 'var(--accent-secondary)', color: '#FFFFFF' }
                  : { background: 'transparent', color: 'var(--text-muted)' }),
              }}
              onMouseEnter={e => {
                if (range !== r.toLowerCase()) e.currentTarget.style.color = 'var(--text-secondary)'
              }}
              onMouseLeave={e => {
                if (range !== r.toLowerCase()) e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={COMPLIANCE_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#98C1D9" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#98C1D9" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="driftFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6969B3" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#6969B3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={true} vertical={false} stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.4)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.4)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<ChartTooltip suffix="%" />} />
            <Area
              type="monotone"
              dataKey="compliance"
              name="Compliance"
              stroke="#98C1D9"
              strokeWidth={2}
              fill="url(#trendGrad)"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="drift"
              name="Drift"
              stroke="#6969B3"
              strokeWidth={1.5}
              fill="url(#driftFill)"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ── Detail Section Label ────────────────────────── */

const sectionLabelStyle = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 4,
}

/* ── Active Drift Events Panel (wired to real data) ── */

function ActiveDriftEvents({ events, focusedEventId, onFocusHandled }) {
  const [expandedId, setExpandedId] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const scrollContainerRef = useRef(null)
  const eventRefsMap = useRef({})
  const highlightTimerRef = useRef(null)

  useEffect(() => {
    if (!focusedEventId) return

    const matched = events.find(e => e.id === focusedEventId)
    if (!matched) { onFocusHandled(); return }

    setExpandedId(matched.id)
    setHighlightId(matched.id)

    requestAnimationFrame(() => {
      const el = eventRefsMap.current[matched.id]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })

    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    highlightTimerRef.current = setTimeout(() => {
      setHighlightId(null)
      onFocusHandled()
    }, 2300)

    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [focusedEventId, onFocusHandled, events])

  function timeAgo(ts) {
    if (!ts) return ''
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="glass-panel-static fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      animationDelay: '540ms',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Active Drift Events</div>
          <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--text-muted)', marginTop: 4 }}>
            {events.length > 0 ? `${events.length} events detected` : 'No drift detected'}
          </div>
        </div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--accent-primary)',
          cursor: 'pointer',
          flexShrink: 0,
          marginTop: 2,
        }}>
          View All
        </div>
      </div>

      {/* Event list body */}
      <div
        ref={scrollContainerRef}
        className="events-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: '0 24px 20px',
        }}
      >
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <ShieldCheck size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>Environment compliant</div>
          </div>
        )}
        {events.map((evt) => {
          const isOpen = expandedId === evt.id
          const isHighlighted = highlightId === evt.id
          const tier = evt.tier || evt.severity || 'allowed'
          const badge = SEVERITY_BADGE[tier] || SEVERITY_BADGE.allowed

          return (
            <div
              key={evt.id}
              ref={el => { eventRefsMap.current[evt.id] = el }}
              data-event-id={evt.id}
              style={{
                borderLeft: '2px solid transparent',
                ...(isHighlighted ? {
                  animation: 'eventRowHighlight 2.3s ease forwards',
                } : {}),
              }}
            >
              {/* Summary row */}
              <div
                onClick={() => setExpandedId(isOpen ? null : evt.id)}
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(152, 193, 217, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Status dot */}
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[tier] || '#66BB6A',
                  flexShrink: 0,
                  marginRight: 12,
                }} />

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 550, color: '#FFFFFF' }}>
                    {evt.resource_name || evt.resource_id}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {evt.resource_type} &middot; {timeAgo(evt.timestamp)}
                  </div>
                </div>

                {/* Severity badge */}
                <div style={{
                  padding: '3px 10px',
                  borderRadius: 2,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: badge.bg,
                  color: badge.color,
                  flexShrink: 0,
                  marginLeft: 12,
                }}>
                  {badge.label}
                </div>
              </div>

              {/* Expandable detail */}
              <div className={`expand-panel${isOpen ? ' open' : ''}`}>
                <div>
                  <div style={{
                    background: 'rgba(83, 58, 123, 0.3)',
                    borderRadius: 4,
                    padding: '14px 16px',
                    marginTop: 8,
                    marginBottom: 8,
                  }}>
                    {/* Baseline vs Current */}
                    {evt.attribute_path && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={sectionLabelStyle}>Change Detected</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{evt.attribute_path}:</span>{' '}
                          <span style={{ color: '#98C1D9' }}>{String(evt.baseline_value)}</span>
                          {' → '}
                          <span style={{ color: '#EF5350' }}>{String(evt.current_value)}</span>
                        </div>
                      </div>
                    )}

                    {/* AI Analysis */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={sectionLabelStyle}>AI Analysis</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {evt.reasoning || evt.reason || 'No analysis available'}
                      </div>
                    </div>

                    {/* GxP Impact */}
                    {evt.gxp_impact && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={sectionLabelStyle}>GxP Impact</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {evt.gxp_impact}
                        </div>
                      </div>
                    )}

                    {/* Regulation Reference */}
                    {(evt.regulation_reference || evt.cfr_reference) && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={sectionLabelStyle}>Regulation</div>
                        <div style={{ fontSize: 12, color: 'var(--accent-primary)', lineHeight: 1.5 }}>
                          {evt.regulation_reference || evt.cfr_reference}
                        </div>
                      </div>
                    )}

                    {/* Remediation */}
                    {evt.remediation_suggestion && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={sectionLabelStyle}>Remediation</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {evt.remediation_suggestion}
                        </div>
                      </div>
                    )}

                    {/* PR Link */}
                    {(evt.pr?.pr_url || evt.pr_link) && (
                      <div>
                        <div style={sectionLabelStyle}>Auto-Remediation PR</div>
                        <a
                          href={evt.pr?.pr_url || evt.pr_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 500 }}
                        >
                          View PR &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Build stat cards from real status ────────────── */

function buildStats(status) {
  if (!status) {
    return [
      { label: 'Total Resources', value: 0, change: 'Loading...', icon: FileText, valueColor: '#FFFFFF', changeColor: 'var(--text-muted)' },
      { label: 'Compliant', value: 0, change: '', icon: ShieldCheck, valueColor: '#98C1D9', changeColor: 'var(--status-success)' },
      { label: 'Drifted', value: 0, change: '', icon: Activity, valueColor: '#6969B3', changeColor: 'var(--text-muted)' },
      { label: 'Risk Score', value: 0, change: '', icon: AlertTriangle, valueColor: '#FFFFFF', changeColor: 'var(--text-muted)' },
    ]
  }

  const counts = status.counts || { critical: 0, suspicious: 0, allowed: 0 }
  const totalDrifted = counts.critical + counts.suspicious + counts.allowed

  const stateLabel = (status.state || 'compliant').toUpperCase()
  const stateColor = stateLabel === 'COMPLIANT' || stateLabel === 'compliant'
    ? 'var(--status-success)'
    : stateLabel === 'CRITICAL' || stateLabel === 'critical'
      ? 'var(--status-critical)'
      : 'var(--status-warning)'

  return [
    {
      label: 'Total Resources',
      value: status.total_resources || 4,
      change: `Environment: ${status.environment || 'unknown'}`,
      icon: FileText,
      valueColor: '#FFFFFF',
      changeColor: 'var(--text-muted)',
    },
    {
      label: 'Compliant',
      value: status.compliant_resources || 0,
      change: stateLabel,
      icon: ShieldCheck,
      valueColor: '#98C1D9',
      changeColor: stateColor,
    },
    {
      label: 'Drifted',
      value: status.drifted_resources || 0,
      change: totalDrifted > 0
        ? `${counts.critical} critical, ${counts.suspicious} suspicious`
        : 'No drift detected',
      icon: Activity,
      valueColor: '#6969B3',
      changeColor: totalDrifted > 0 ? 'var(--status-warning)' : 'var(--text-muted)',
    },
    {
      label: 'Risk Score',
      value: status.risk_score || 0,
      change: status.risk_score >= 50 ? 'High risk' : status.risk_score > 0 ? 'Moderate' : 'Low risk',
      icon: AlertTriangle,
      valueColor: '#FFFFFF',
      changeColor: status.risk_score >= 50 ? 'var(--status-critical)' : 'var(--text-muted)',
    },
  ]
}

/* ── Dashboard Page ─────────────────────────────── */

export default function Dashboard() {
  const {
    status,
    events,
    eventsLoading,
    handleTriggerDrift,
    triggerLoading,
    triggerError,
    offline,
  } = useApp()

  const [focusedEventId, setFocusedEventId] = useState(null)


  const handleFocusHandled = useCallback(() => {
    setFocusedEventId(null)
  }, [])

  const stats = buildStats(status)

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{
        marginLeft: 240,
        padding: '28px 36px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Row 1: Header (~60px) */}
        <div className="fade-in fade-in-0" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              GxP Infrastructure Compliance Monitoring
              <GoLiveButton />
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => handleTriggerDrift('critical')}
              disabled={triggerLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 36,
                padding: '0 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                background: triggerLoading ? 'rgba(83, 58, 123, 0.3)' : 'var(--accent-secondary)',
                color: '#FFFFFF',
                border: 'none',
                cursor: triggerLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'var(--transition-smooth)',
                opacity: triggerLoading ? 0.6 : 1,
              }}
            >
              {triggerLoading
                ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <ShieldCheck size={14} />
              }
              {triggerLoading ? 'Scanning...' : 'Run Scan'}
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  width: 180,
                  height: 36,
                  background: 'rgba(83, 58, 123, 0.4)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 4,
                  padding: '0 12px 0 36px',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 400,
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'var(--transition-smooth)',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
              />
            </div>
            <div
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.querySelector('svg').style.color = 'var(--accent-primary)'}
              onMouseLeave={e => e.currentTarget.querySelector('svg').style.color = 'var(--text-muted)'}
            >
              <Bell size={16} style={{ color: 'var(--text-muted)', transition: 'var(--transition-smooth)' }} />
            </div>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6969B3, #533A7B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: '#FFFFFF',
            }}>
              VA
            </div>
          </div>
        </div>

        {/* Row 2: Stat Cards (~100px) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 16,
          flexShrink: 0,
        }}>
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>

        {/* Row 3: Two-column main area (flex: 1) */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '60fr 40fr',
          gap: 16,
          minHeight: 0,
        }}>
          {/* Left: Compliance Trend Chart */}
          <ComplianceTrendChart />

          {/* Right: Active Drift Events (wired to real data) */}
          <ActiveDriftEvents
            events={events || []}
            focusedEventId={focusedEventId}
            onFocusHandled={handleFocusHandled}
          />
        </div>
      </div>
    </div>
  )
}
