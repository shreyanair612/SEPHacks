import React from 'react'
import { ExternalLink, CheckCircle, Scale } from 'lucide-react'
import StatusPill from './StatusPill'
import CodeBlock from './CodeBlock'

const borderColors = {
  critical: '#98C1D9',
  suspicious: '#6969B3',
  allowed: '#533A7B',
}

export default function DriftEventCard({ evt }) {
  const { tier } = evt
  return (
    <div className="glass-panel" style={{ padding: 20, borderLeft: `3px solid ${borderColors[tier] || 'var(--border-default)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusPill tier={tier}>
            {tier === 'allowed' ? 'Allowed' : tier === 'suspicious' ? 'Suspicious' : 'Critical'}
          </StatusPill>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{evt.resource_id}</span>
          <span style={{ fontSize: 11, background: 'rgba(83, 58, 123, 0.3)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: 2 }}>{evt.resource_type}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(evt.timestamp).toLocaleString()}</span>
      </div>

      <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 4, fontSize: 12, background: 'rgba(83, 58, 123, 0.3)', color: 'var(--text-secondary)' }}>
        {evt.attribute_path}: <span style={{ color: '#98C1D9' }}>{String(evt.baseline_value)}</span> → <span style={{ color: '#6969B3' }}>{String(evt.current_value)}</span>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>AI Analysis</div>
        <div style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, padding: 16, borderRadius: 6, background: 'rgba(83, 58, 123, 0.3)', color: 'var(--text-secondary)' }}>
          {evt.reasoning}
        </div>
      </div>

      {evt.regulation_reference && (
        <div style={{ marginTop: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 2, background: 'rgba(152, 193, 217, 0.12)', color: 'var(--accent-primary)', fontSize: 11, fontWeight: 500 }}>
            <Scale size={12} />
            {evt.regulation_reference}
          </span>
        </div>
      )}

      {tier === 'critical' && evt.gxp_impact && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>GxP Impact</div>
          <div style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.5, padding: 16, borderRadius: 6, background: 'rgba(83, 58, 123, 0.3)', color: 'var(--text-secondary)' }}>
            {evt.gxp_impact}
          </div>
        </div>
      )}

      {tier === 'critical' && evt.remediation_suggestion && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Remediation</div>
          <CodeBlock code={evt.remediation_suggestion} />
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {evt.pr && evt.pr.pr_url ? (
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
        ) : null}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500,
          border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
          background: 'transparent', cursor: 'pointer',
        }}>
          <CheckCircle size={12} />
          Mark Reviewed
        </button>
      </div>
    </div>
  )
}
