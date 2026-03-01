import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Bell, ExternalLink, CheckCircle, Scale,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import CodeBlock from '../components/CodeBlock'
import StatusPill from '../components/StatusPill'
import useCountUp from '../hooks/useCountUp'
import { useApp } from '../context/AppContext'

/* ── Mock Data ──────────────────────────────────── */

const COMPLIANCE_TREND = [
  { day: 'Mon', compliance: 88, drift: 12 },
  { day: 'Tue', compliance: 91, drift: 9 },
  { day: 'Wed', compliance: 85, drift: 15 },
  { day: 'Thu', compliance: 89, drift: 11 },
  { day: 'Fri', compliance: 94, drift: 6 },
  { day: 'Sat', compliance: 92, drift: 8 },
  { day: 'Sun', compliance: 90, drift: 10 },
]

const CHART_EVENTS = [
  {
    dayIndex: 1,
    label: 'IAM Policy Violation',
    category: 'IAM',
    severity: 'Warning',
    age: '2d ago',
    description: 'Password policy changed below compliance threshold',
    matchType: 'IAM',
  },
  {
    dayIndex: 3,
    label: 'S3 Encryption Disabled',
    category: 'Storage',
    severity: 'Critical',
    age: '18h ago',
    description: 'Encryption disabled on regulated genomic data storage',
    matchType: 'Storage',
  },
  {
    dayIndex: 5,
    label: 'VPC Flow Logs Disabled',
    category: 'Network',
    severity: 'Warning',
    age: '4h ago',
    description: 'Flow logs turned off for production VPC subnet',
    matchType: 'Network',
  },
]

const STATS = [
  { label: 'Total Policies', value: 173, change: '+12 from last week', positive: true },
  { label: 'Compliant', value: 142, change: '+5 from last week', positive: true, color: '#98C1D9' },
  { label: 'Drifted', value: 23, change: '-3 from last week', positive: false, color: '#6969B3' },
  { label: 'Non-Compliant', value: 8, change: '+2 from last week', positive: false },
]

/* ── Animated Number ────────────────────────────── */

function AnimatedNumber({ value }) {
  const display = useCountUp(value, 800)
  return <>{display}</>
}

/* ── Chart Tooltip (for line hover) ──────────────── */

function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'rgba(37, 23, 26, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(152, 193, 217, 0.15)',
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

/* ── Event Dot Tooltip (rich, with arrow) ────────── */

function EventDotTooltip({ evt, x, y, onViewDetails }) {
  const showAbove = y > 80
  const tooltipTop = showAbove ? y - 12 : y + 16
  const transform = showAbove
    ? 'translate(-50%, -100%)'
    : 'translate(-50%, 0)'

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: tooltipTop,
      transform,
      background: 'rgba(37, 23, 26, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(152, 193, 217, 0.15)',
      borderRadius: 4,
      padding: '14px 18px',
      whiteSpace: 'nowrap',
      zIndex: 20,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
    }}>
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        ...(showAbove ? {
          bottom: -6,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgba(37, 23, 26, 0.95)',
        } : {
          top: -6,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid rgba(37, 23, 26, 0.95)',
        }),
      }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{evt.label}</div>
      <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginTop: 3 }}>
        {evt.category} &middot; {evt.severity}
      </div>
      <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 260, whiteSpace: 'normal' }}>
        {evt.description}
      </div>
      <div
        onClick={(e) => { e.stopPropagation(); onViewDetails(evt); }}
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#98C1D9',
          marginTop: 10,
          cursor: 'pointer',
        }}
      >
        View Details &rarr;
      </div>
    </div>
  )
}

/* ── Compliance Overview Panel ─────────────────── */

function ComplianceOverview() {
  return (
    <div className="glass-panel-static fade-in fade-in-1" style={{ padding: 28 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF', marginBottom: 20 }}>
        Compliance Overview
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
      }}>
        {STATS.map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: '16px 20px',
              borderRight: i % 2 === 0 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
              borderBottom: i < 2 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
            }}
          >
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}>
              {s.label}
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: s.color || '#FFFFFF',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              <AnimatedNumber value={s.value} />
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 400,
              marginTop: 6,
              color: s.positive ? 'var(--status-success)' : 'var(--text-muted)',
            }}>
              {s.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Compliance Trend Chart ───────────────────── */

function ComplianceTrendChart({ onViewEvent }) {
  const [range, setRange] = useState('weekly')
  const [hoveredDot, setHoveredDot] = useState(null)
  const ranges = ['Weekly', 'Monthly', 'Yearly']

  function CustomDots(props) {
    const { cx, cy, index } = props
    const evt = CHART_EVENTS.find(e => e.dayIndex === index)
    if (!evt) return null
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#98C1D9"
        stroke="#FFFFFF"
        strokeWidth={2}
        style={{
          animation: 'eventDotPulse 3s ease-in-out infinite',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHoveredDot({ evt, x: cx, y: cy })}
        onMouseLeave={() => setHoveredDot(null)}
      />
    )
  }

  return (
    <div className="glass-panel-static fade-in fade-in-3" style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                letterSpacing: '0.02em',
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
              <linearGradient id="complianceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#98C1D9" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#98C1D9" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="driftFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6969B3" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#6969B3" stopOpacity={0.01} />
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
              fill="url(#complianceFill)"
              dot={<CustomDots />}
              activeDot={false}
            />
            <Area
              type="monotone"
              dataKey="drift"
              name="Drift"
              stroke="#6969B3"
              strokeWidth={2}
              fill="url(#driftFill)"
              dot={false}
              activeDot={{ fill: '#6969B3', stroke: '#FFFFFF', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        {hoveredDot && (
          <EventDotTooltip
            evt={hoveredDot.evt}
            x={hoveredDot.x}
            y={hoveredDot.y}
            onViewDetails={(evt) => {
              setHoveredDot(null)
              onViewEvent(evt.matchType)
            }}
          />
        )}
      </div>
    </div>
  )
}

/* ── Active Drift Events Panel ────────────────── */

function ActiveDriftEvents({ focusedType, onFocusHandled }) {
  const { events } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const scrollContainerRef = useRef(null)
  const eventRefsMap = useRef({})

  const list = events || []

  useEffect(() => {
    if (!focusedType || list.length === 0) return

    const matched = list.find(e => e.resource_type === focusedType)
    if (!matched) { onFocusHandled(); return }

    setExpandedId(matched.id)
    setHighlightId(matched.id)

    requestAnimationFrame(() => {
      const el = eventRefsMap.current[matched.id]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })

    const timer = setTimeout(() => {
      setHighlightId(null)
      onFocusHandled()
    }, 1000)
    return () => clearTimeout(timer)
  }, [focusedType, list, onFocusHandled])

  if (list.length === 0) {
    return (
      <div className="glass-panel-static fade-in fade-in-2" style={{
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>Active Drift Events</div>
          <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--text-muted)', marginTop: 4 }}>Real-time configuration changes</div>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
          fontWeight: 300,
        }}>
          No drift detected — all systems compliant
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel-static fade-in fade-in-2" style={{
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>Active Drift Events</div>
        <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--text-muted)', marginTop: 4 }}>Real-time configuration changes</div>
      </div>

      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {list.map((evt) => {
          const isOpen = expandedId === evt.id
          const isHighlighted = highlightId === evt.id
          const tierLabel = evt.tier === 'allowed' ? 'Allowed' : evt.tier === 'suspicious' ? 'Suspicious' : 'Critical'

          return (
            <div
              key={evt.id}
              ref={el => { eventRefsMap.current[evt.id] = el }}
              data-event-id={evt.id}
              style={{
                borderRadius: 4,
                border: '1px solid transparent',
                marginBottom: 4,
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                ...(isHighlighted ? {
                  animation: 'eventHighlight 1s ease forwards',
                } : {}),
              }}
            >
              {/* Summary row */}
              <div
                onClick={() => setExpandedId(isOpen ? null : evt.id)}
                style={{
                  padding: '14px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  borderRadius: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(152, 193, 217, 0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <StatusPill tier={evt.tier}>{tierLabel}</StatusPill>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', flex: 1 }}>
                    {evt.resource_id}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 2 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 400,
                    background: 'rgba(83, 58, 123, 0.3)',
                    color: 'var(--text-secondary)',
                    padding: '2px 6px',
                    borderRadius: 2,
                  }}>
                    {evt.resource_type}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 300, color: 'var(--text-muted)' }}>
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  paddingLeft: 2,
                }}>
                  {evt.attribute_path}
                </div>
              </div>

              {/* Expandable detail */}
              <div className={`expand-panel${isOpen ? ' open' : ''}`}>
                <div>
                  <div style={{ padding: '12px 8px 16px' }}>
                    {/* Attribute change */}
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 400,
                      background: 'rgba(83, 58, 123, 0.3)',
                      color: 'var(--text-secondary)',
                      marginBottom: 12,
                    }}>
                      {evt.attribute_path}:{' '}
                      <span style={{ color: '#98C1D9', fontWeight: 600 }}>{String(evt.baseline_value)}</span>
                      {' → '}
                      <span style={{ color: '#6969B3', fontWeight: 600 }}>{String(evt.current_value)}</span>
                    </div>

                    {/* AI Analysis */}
                    {evt.reasoning && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
                          color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6,
                        }}>
                          AI Analysis
                        </div>
                        <div style={{
                          fontSize: 13, fontWeight: 400, lineHeight: 1.5, padding: 16, borderRadius: 6,
                          background: 'rgba(83, 58, 123, 0.3)', color: 'var(--text-secondary)',
                        }}>
                          {evt.reasoning}
                        </div>
                      </div>
                    )}

                    {/* GxP Impact */}
                    {evt.tier === 'critical' && evt.gxp_impact && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
                          color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6,
                        }}>
                          GxP Impact
                        </div>
                        <div style={{
                          fontSize: 13, fontWeight: 400, lineHeight: 1.5, padding: 16, borderRadius: 6,
                          background: 'rgba(83, 58, 123, 0.3)', color: 'var(--text-secondary)',
                        }}>
                          {evt.gxp_impact}
                        </div>
                      </div>
                    )}

                    {/* Regulation badge */}
                    {evt.regulation_reference && (
                      <div style={{ marginBottom: 12 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 2,
                          background: 'rgba(152, 193, 217, 0.12)', color: '#98C1D9',
                          fontSize: 11, fontWeight: 500,
                        }}>
                          <Scale size={12} />
                          {evt.regulation_reference}
                        </span>
                      </div>
                    )}

                    {/* Remediation */}
                    {evt.tier === 'critical' && evt.remediation_suggestion && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
                          color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6,
                        }}>
                          Remediation
                        </div>
                        <CodeBlock code={evt.remediation_suggestion} />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {evt.pr && evt.pr.pr_url && (
                        <a
                          href={evt.pr.pr_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                            background: 'var(--accent-secondary)', color: '#FFFFFF', textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={12} />
                          View PR {evt.pr.pr_real ? '' : '(demo)'}
                        </a>
                      )}
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500,
                        border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
                        background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <CheckCircle size={12} />
                        Mark Reviewed
                      </button>
                    </div>
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

/* ── Dashboard Page ─────────────────────────────── */

export default function Dashboard() {
  const [focusedType, setFocusedType] = useState(null)

  const handleFocusHandled = useCallback(() => {
    setFocusedType(null)
  }, [])

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
        {/* Header */}
        <div className="fade-in fade-in-0" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Infrastructure compliance monitoring
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  width: 220,
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

        {/* 3-Panel Layout — fills remaining viewport */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '55fr 45fr',
          gap: 20,
          minHeight: 0,
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
            <ComplianceOverview />
            <ComplianceTrendChart onViewEvent={setFocusedType} />
          </div>

          {/* Right Column — matches left column height */}
          <div style={{ minHeight: 0 }}>
            <ActiveDriftEvents
              focusedType={focusedType}
              onFocusHandled={handleFocusHandled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
