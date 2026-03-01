import React from 'react'
import { Download } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import StatusPill from '../components/StatusPill'
import { useApp } from '../context/AppContext'

export default function AuditTrail() {
  const { events, status } = useApp()

  async function exportAudit() {
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
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 240, padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>Audit Trail</h1>
          <button
            onClick={exportAudit}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: 'var(--accent-secondary)', color: '#FFFFFF',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export Audit Report
          </button>
        </div>

        <div className="glass-panel-static" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                {['Timestamp', 'Resource', 'Type', 'Change', 'Severity', 'Regulation', 'PR', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(events || []).map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background var(--transition-smooth)' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(152, 193, 217, 0.03)'}
                  onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 300 }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600 }}>{e.resource_id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 400 }}>{e.resource_type}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 400 }}>
                    {e.attribute_path}: {String(e.baseline_value)} → {String(e.current_value)}
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusPill tier={e.tier}>{e.tier}</StatusPill></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 400, maxWidth: 160 }}>{e.regulation_reference || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {e.pr && e.pr.pr_url ? (
                      <a href={e.pr.pr_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>View PR</a>
                    ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.status === 'open' ? 'var(--status-warning)' : 'var(--status-success)' }} />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{e.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!events || events.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13, fontWeight: 300 }}>No audit entries</div>
          )}
        </div>
      </div>
    </div>
  )
}
