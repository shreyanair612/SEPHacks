import React, { useState } from 'react'
import { ShieldCheck, Download, ExternalLink, CheckCircle, Scale, ChevronDown } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import CodeBlock from '../components/CodeBlock'
import { useApp } from '../context/AppContext'

// TODO: Replace with real time-series data from /api/compliance-history when endpoint exists
const COMPLIANCE_TREND = [
  { day: 'Mon', compliance: 92 },
  { day: 'Tue', compliance: 94 },
  { day: 'Wed', compliance: 91 },
  { day: 'Thu', compliance: 88 },
  { day: 'Fri', compliance: 85 },
  { day: 'Sat', compliance: 78 },
  { day: 'Sun', compliance: 72 },
]

const PIE_COLORS = { critical: '#533A7B', suspicious: '#6969B3', allowed: '#98C1D9' }

function ComplianceTrendChart() {
  const [range, setRange] = useState('weekly')
  return (
    <div className="card fade-in fade-in-4" style={{padding:16}}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm" style={{color:'var(--text-primary)'}}>Compliance Trend</h2>
        <div className="flex rounded-lg p-0.5" style={{background:'#F4F2F7'}}>
          {['weekly','monthly'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium capitalize"
              style={{transition:'all 200ms ease', ...(range === r
                ? {background:'#533A7B', color:'#fff'}
                : {color:'var(--text-secondary)'})}}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={COMPLIANCE_TREND} margin={{top:4, right:4, bottom:0, left:-20}}>
          <defs>
            <linearGradient id="complianceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6969B3" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#6969B3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{fontSize:10, fill:'#6B6178'}} axisLine={false} tickLine={false} />
          <YAxis domain={[0,100]} tick={{fontSize:10, fill:'#6B6178'}} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={{background:'#fff', border:'none', borderRadius:8, fontSize:11, boxShadow:'var(--shadow-card)'}}
            formatter={v => [`${v}%`, 'Compliance']}
          />
          <Area type="monotone" dataKey="compliance" stroke="#6969B3" strokeWidth={2} fill="url(#complianceFill)" dot={{r:2.5, fill:'#6969B3', strokeWidth:0}} activeDot={{r:4, fill:'#6969B3', strokeWidth:2, stroke:'#fff'}} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function DriftDistributionChart({ counts }) {
  const data = [
    { name: 'Critical', value: counts.critical },
    { name: 'Suspicious', value: counts.suspicious },
    { name: 'Allowed', value: counts.allowed },
  ]
  const total = counts.critical + counts.suspicious + counts.allowed

  return (
    <div className="card fade-in fade-in-5" style={{padding:16}}>
      <h2 className="text-sm mb-3" style={{color:'var(--text-primary)'}}>Drift Distribution</h2>
      <div className="flex items-center">
        <div className="relative" style={{width:140, height:140, flexShrink:0}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                {data.map(d => <Cell key={d.name} fill={PIE_COLORS[d.name.toLowerCase()]} />)}
              </Pie>
              <Tooltip contentStyle={{background:'#fff', border:'none', borderRadius:8, fontSize:11, boxShadow:'var(--shadow-card)'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center" style={{pointerEvents:'none'}}>
            <div className="text-center">
              <div style={{fontFamily:'"JetBrains Mono", monospace', fontSize:20, fontWeight:600, color:'var(--text-primary)'}}>{total}</div>
              <div style={{fontSize:10, color:'var(--text-secondary)'}}>total</div>
            </div>
          </div>
        </div>
        <div className="ml-4 space-y-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2" style={{fontSize:12, color:'var(--text-secondary)'}}>
              <span className="w-2 h-2 rounded-full" style={{background: PIE_COLORS[d.name.toLowerCase()]}} />
              <span style={{fontSize:11}}>{d.name}</span>
              <span style={{fontSize:11, fontWeight:600, color:'var(--text-primary)'}}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TH_STYLE = {fontSize:10, fontWeight:600, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}

function EventRow({ evt, expanded, onToggle }) {
  const { tier } = evt
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer"
        style={{borderBottom:'1px solid var(--border-color)', height:44, transition:'background 200ms ease'}}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(152,193,217,0.06)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <td className="px-4"><StatusPill tier={tier}>{tier === 'allowed' ? 'Allowed' : tier === 'suspicious' ? 'Suspicious' : 'Critical'}</StatusPill></td>
        <td className="px-4" style={{fontSize:12, fontWeight:600, color:'var(--text-primary)'}}>{evt.resource_id}</td>
        <td className="px-4" style={{fontSize:12, color:'var(--text-secondary)'}}>{evt.resource_type}</td>
        <td className="px-4" style={{fontFamily:'"JetBrains Mono", monospace', fontSize:11, color:'var(--text-primary)'}}>
          {evt.attribute_path}
        </td>
        <td className="px-4">
          {evt.regulation_reference ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{background:'rgba(152,193,217,0.15)', color:'#533A7B', fontSize:10, fontWeight:500}}>
              {evt.regulation_reference.length > 22 ? evt.regulation_reference.slice(0, 22) + '...' : evt.regulation_reference}
            </span>
          ) : <span style={{color:'var(--text-secondary)', fontSize:11}}>—</span>}
        </td>
        <td className="px-4">
          {evt.pr && evt.pr.pr_url ? (
            <a href={evt.pr.pr_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{color:'#533A7B', fontSize:11, fontWeight:500}}>
              View PR
            </a>
          ) : <span style={{color:'var(--text-secondary)', fontSize:11}}>—</span>}
        </td>
        <td className="px-4" style={{fontSize:11, color:'var(--text-secondary)'}}>{new Date(evt.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
        <td className="px-3" style={{width:28}}>
          <ChevronDown className="w-3.5 h-3.5" style={{color:'var(--text-secondary)', transition:'transform 200ms ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0)'}} />
        </td>
      </tr>
      <tr>
        <td colSpan={8} style={{padding:0, border:'none'}}>
          <div className={`expand-panel ${expanded ? 'open' : ''}`}>
            <div>
              <div style={{background:'#F8F6FB', padding:'16px 20px', borderBottom:'1px solid var(--border-color)'}}>
                <div className="grid gap-4" style={{gridTemplateColumns: tier === 'critical' ? '1fr 1fr' : '1fr'}}>
                  <div>
                    <div className="font-label uppercase mb-1" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--text-secondary)'}}>AI Analysis</div>
                    <div className="text-sm leading-relaxed p-3 rounded-lg" style={{background:'#fff', color:'var(--text-primary)'}}>
                      {evt.reasoning}
                    </div>
                    {evt.regulation_reference && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded" style={{background:'rgba(152,193,217,0.15)', color:'#533A7B', fontSize:11, fontWeight:500}}>
                          <Scale className="w-3 h-3" />
                          {evt.regulation_reference}
                        </span>
                      </div>
                    )}
                  </div>
                  {tier === 'critical' && evt.gxp_impact && (
                    <div>
                      <div className="font-label uppercase mb-1" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--text-secondary)'}}>GxP Impact</div>
                      <div className="text-sm leading-relaxed p-3 rounded-lg" style={{background:'#F3EEF8', color:'var(--text-primary)'}}>
                        {evt.gxp_impact}
                      </div>
                    </div>
                  )}
                </div>
                {tier === 'critical' && evt.remediation_suggestion && (
                  <div className="mt-3">
                    <div className="font-label uppercase mb-1" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--text-secondary)'}}>Remediation</div>
                    <CodeBlock code={evt.remediation_suggestion} />
                  </div>
                )}
                <div className="mt-3 flex justify-between items-center">
                  <div className="font-mono text-[11px]" style={{color:'var(--text-secondary)'}}>
                    {evt.attribute_path}: <span style={{color:'#533A7B'}}>{String(evt.baseline_value)}</span> → <span style={{color:'#5A8FA8'}}>{String(evt.current_value)}</span>
                  </div>
                  <div className="flex gap-2">
                    {evt.pr && evt.pr.pr_url && (
                      <a href={evt.pr.pr_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{background:'#533A7B'}}>
                        <ExternalLink className="w-3 h-3" />
                        View PR {evt.pr.pr_real ? '' : '(demo)'}
                      </a>
                    )}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{border:'1px solid var(--border-color)', color:'var(--text-secondary)', background:'transparent'}}>
                      <CheckCircle className="w-3 h-3" />
                      Mark Reviewed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  )
}

const DEFAULT_VISIBLE = 10

function EventsTable({ events }) {
  const [expandedId, setExpandedId] = useState(null)
  const [showAll, setShowAll] = useState(false)

  if (!events || events.length === 0) {
    return (
      <div className="card-static text-center p-10 fade-in fade-in-6">
        <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{color:'#6969B3'}} />
        <div className="text-sm font-medium" style={{color:'var(--text-primary)'}}>No drift detected</div>
        <div className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>All resources are compliant — audit ready</div>
      </div>
    )
  }

  const visible = showAll ? events : events.slice(0, DEFAULT_VISIBLE)
  const hasMore = events.length > DEFAULT_VISIBLE && !showAll

  return (
    <div className="card-static overflow-hidden fade-in fade-in-6">
      <table className="w-full" style={{borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'var(--bg-primary)', height:36}}>
            <th className="text-left px-4" style={{...TH_STYLE, width:110}}>Severity</th>
            <th className="text-left px-4" style={TH_STYLE}>Resource</th>
            <th className="text-left px-4" style={{...TH_STYLE, width:90}}>Type</th>
            <th className="text-left px-4" style={TH_STYLE}>Change</th>
            <th className="text-left px-4" style={{...TH_STYLE, width:170}}>Regulation</th>
            <th className="text-left px-4" style={{...TH_STYLE, width:70}}>PR</th>
            <th className="text-left px-4" style={{...TH_STYLE, width:60}}>Time</th>
            <th style={{width:28}} />
          </tr>
        </thead>
        <tbody>
          {visible.map(evt => (
            <EventRow
              key={evt.id}
              evt={evt}
              expanded={expandedId === evt.id}
              onToggle={() => setExpandedId(expandedId === evt.id ? null : evt.id)}
            />
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className="text-center py-3" style={{borderTop:'1px solid var(--border-color)'}}>
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-medium"
            style={{color:'#533A7B', background:'none', border:'none', cursor:'pointer'}}
          >
            Show all {events.length} events
          </button>
        </div>
      )}
    </div>
  )
}

function SkeletonCards() {
  return (
    <>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[0,1,2,3].map(i => <div key={i} className="skeleton h-[76px]" />)}
      </div>
      <div className="grid gap-3 mb-6" style={{gridTemplateColumns:'55fr 45fr'}}>
        <div className="skeleton h-[252px]" />
        <div className="skeleton h-[252px]" />
      </div>
      <div className="skeleton h-[400px]" />
    </>
  )
}

export default function Dashboard(){
  const { status, events, offline } = useApp()
  const loading = status === null
  const s = status || { environment: '-', risk_score: 0, counts: {critical:0, suspicious:0, allowed:0}, last_updated: new Date().toISOString() }

  return (
    <div className="min-h-screen" style={{background:'var(--bg-primary)'}}>
      <Sidebar />
      <div className="ml-60">
        <Navbar />

        {offline && (
          <div className="flex items-center gap-2 px-8 py-2 text-xs font-medium" style={{background:'#F3EEF8', color:'#533A7B', borderBottom:'1px solid var(--border-color)'}}>
            <span className="w-1.5 h-1.5 rounded-full" style={{background:'#533A7B'}} />
            Unable to reach backend — showing last known state
          </div>
        )}

        <main className="p-6 px-8">
          <div className="flex justify-end mb-3 fade-in fade-in-0">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{background:'var(--bg-card)', border:'1px solid var(--border-color)', color:'var(--text-secondary)', transition:'all 200ms ease'}}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <Download className="w-3 h-3" />
              Export Audit Report
            </button>
          </div>

          {loading ? <SkeletonCards /> : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <StatCard
                  className="fade-in fade-in-0"
                  title="Risk Score"
                  value={`${s.risk_score}/100`}
                  accentColor={s.risk_score === 0 ? '#98C1D9' : s.risk_score >= 50 ? '#533A7B' : '#6969B3'}
                  subtitle={s.risk_score === 0 ? 'Fully compliant' : 'Action required'}
                />
                <StatCard
                  className="fade-in fade-in-1"
                  title="Critical Events"
                  value={s.counts.critical}
                  accentColor={s.counts.critical > 0 ? '#533A7B' : '#5A8FA8'}
                  subtitle={s.counts.critical > 0 ? 'Auto-remediated via PR' : 'No critical drift'}
                />
                <StatCard
                  className="fade-in fade-in-2"
                  title="Suspicious Events"
                  value={s.counts.suspicious}
                  accentColor={s.counts.suspicious > 0 ? '#6969B3' : '#5A8FA8'}
                  subtitle={s.counts.suspicious > 0 ? 'Requires review' : 'All clear'}
                />
                <StatCard
                  className="fade-in fade-in-3"
                  title="Allowed Changes"
                  value={s.counts.allowed}
                  accentColor="#5A8FA8"
                  subtitle="Within policy"
                />
              </div>

              <div className="grid gap-3 mb-6" style={{gridTemplateColumns:'55fr 45fr'}}>
                <ComplianceTrendChart />
                <DriftDistributionChart counts={s.counts} />
              </div>

              <section>
                <div className="flex justify-between items-center mb-3 fade-in fade-in-6">
                  <h2 className="text-sm" style={{color:'var(--text-primary)'}}>Drift Events</h2>
                  <span style={{fontSize:11, color:'var(--text-secondary)'}}>
                    {events ? `${events.length} event${events.length !== 1 ? 's' : ''}` : '\u2014'}
                  </span>
                </div>
                <EventsTable events={events} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
