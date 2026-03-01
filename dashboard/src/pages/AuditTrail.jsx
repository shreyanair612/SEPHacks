import React from 'react'
import { Download } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import StatusPill from '../components/StatusPill'
import { useApp } from '../context/AppContext'

export default function AuditTrail(){
  const { events, status } = useApp()

  async function exportAudit(){
    const payload = {
      generated_at: new Date().toISOString(),
      environment: status?.environment || 'unknown',
      baseline_version: 'v3.2',
      events: (events || []).map(e => ({
        timestamp: e.timestamp,
        resource_id: e.resource_id,
        resource_type: e.resource_type,
        tier: e.tier,
        what_changed: `${e.attribute_path}: ${e.baseline_value} → ${e.current_value}`,
        gxp_impact: e.gxp_impact,
        regulation_reference: e.regulation_reference,
        remediation_suggestion: e.remediation_suggestion,
        pr_url: e.pr ? e.pr.pr_url : null,
        status: e.status
      }))
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `velira-audit-trail-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen" style={{background:'var(--bg-primary)'}}>
      <Sidebar />
      <div className="ml-60">
        <Navbar />
        <main className="p-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl" style={{color:'var(--text-primary)'}}>Audit Trail</h1>
            <button
              onClick={exportAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{background:'#533A7B', transition:'all 200ms ease'}}
            >
              <Download className="w-3 h-3" />
              Export Audit Report
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{background:'var(--bg-primary)', borderBottom:'1px solid var(--border-color)'}}>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>Timestamp</th>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>Resource</th>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>Type</th>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>Change</th>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>Severity</th>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>Regulation</th>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>PR</th>
                  <th className="text-left px-4 py-3 font-label" style={{fontSize:10, letterSpacing:'0.04em', color:'var(--text-secondary)', textTransform:'uppercase'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(events || []).map(e => (
                  <tr key={e.id} style={{borderBottom:'1px solid var(--border-color)', transition:'background 200ms ease'}}>
                    <td className="px-4 py-3" style={{color:'var(--text-secondary)'}}>{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3" style={{color:'var(--text-primary)', fontWeight:600}}>{e.resource_id}</td>
                    <td className="px-4 py-3" style={{color:'var(--text-secondary)'}}>{e.resource_type}</td>
                    <td className="px-4 py-3" style={{color:'var(--text-primary)', fontFamily:'"JetBrains Mono", monospace', fontSize:11}}>
                      {e.attribute_path}: {String(e.baseline_value)} → {String(e.current_value)}
                    </td>
                    <td className="px-4 py-3"><StatusPill tier={e.tier}>{e.tier}</StatusPill></td>
                    <td className="px-4 py-3" style={{color:'var(--text-secondary)', maxWidth:160}}>{e.regulation_reference || '-'}</td>
                    <td className="px-4 py-3">
                      {e.pr && e.pr.pr_url ? (
                        <a href={e.pr.pr_url} target="_blank" rel="noreferrer" className="font-medium" style={{color:'#533A7B'}}>View PR</a>
                      ) : <span style={{color:'var(--text-secondary)'}}>-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{background: e.status === 'open' ? '#6969B3' : '#5A8FA8'}} />
                        <span style={{color:'var(--text-secondary)'}}>{e.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!events || events.length === 0) && (
              <div className="text-center py-10 text-sm" style={{color:'var(--text-secondary)'}}>No audit entries</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
