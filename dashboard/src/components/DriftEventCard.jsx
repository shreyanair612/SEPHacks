import React from 'react'
import { ExternalLink, CheckCircle, Scale } from 'lucide-react'
import StatusPill from './StatusPill'
import CodeBlock from './CodeBlock'

const borderColors = {
  critical: '#533A7B',
  suspicious: '#6969B3',
  allowed: '#98C1D9',
}

export default function DriftEventCard({ evt }){
  const { tier } = evt
  return (
    <div className="card p-5" style={{borderLeft:`3px solid ${borderColors[tier] || 'var(--border-color)'}`}}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <StatusPill tier={tier}>
            {tier === 'allowed' ? 'Allowed' : tier === 'suspicious' ? 'Suspicious' : 'Critical'}
          </StatusPill>
          <span style={{fontSize:14, fontWeight:600, color:'var(--text-primary)'}}>{evt.resource_id}</span>
          <span style={{fontSize:11, background:'#F4F2F7', color:'var(--text-secondary)', padding:'2px 6px', borderRadius:'var(--radius-sm)'}}>{evt.resource_type}</span>
        </div>
        <span className="text-[11px]" style={{color:'var(--text-secondary)'}}>{new Date(evt.timestamp).toLocaleString()}</span>
      </div>

      <div className="mt-3 px-3 py-2 rounded-lg text-xs" style={{background:'#F4F2F7', color:'var(--text-primary)', fontFamily:'"JetBrains Mono", "SF Mono", ui-monospace, monospace'}}>
        {evt.attribute_path}: <span style={{color:'#533A7B'}}>{String(evt.baseline_value)}</span> → <span style={{color:'#5A8FA8'}}>{String(evt.current_value)}</span>
      </div>

      <div className="mt-3">
        <div className="font-label uppercase mb-1" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--text-secondary)'}}>AI Analysis</div>
        <div className="text-sm leading-relaxed p-4 rounded-lg" style={{
          background: '#F8F6FB',
          color: 'var(--text-primary)',
        }}>
          {evt.reasoning}
        </div>
      </div>

      {evt.regulation_reference && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded" style={{background:'rgba(152,193,217,0.15)', color:'#533A7B', fontSize:11, fontWeight:500}}>
            <Scale className="w-3 h-3" />
            {evt.regulation_reference}
          </span>
        </div>
      )}

      {tier === 'critical' && evt.gxp_impact && (
        <div className="mt-3">
          <div className="font-label uppercase mb-1" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--text-secondary)'}}>GxP Impact</div>
          <div className="text-sm leading-relaxed p-4 rounded-lg" style={{background:'#F3EEF8', color:'var(--text-primary)'}}>
            {evt.gxp_impact}
          </div>
        </div>
      )}

      {tier === 'critical' && evt.remediation_suggestion && (
        <div className="mt-3">
          <div className="font-label uppercase mb-1" style={{fontSize:10, letterSpacing:'0.06em', color:'var(--text-secondary)'}}>Remediation</div>
          <CodeBlock code={evt.remediation_suggestion} />
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {evt.pr && evt.pr.pr_url ? (
          <a
            href={evt.pr.pr_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
            style={{background:'#533A7B', transition:'all 200ms ease'}}
          >
            <ExternalLink className="w-3 h-3" />
            View PR {evt.pr.pr_real ? '' : '(demo)'}
          </a>
        ) : null}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{border:'1px solid var(--border-color)', color:'var(--text-secondary)', background:'transparent', transition:'all 200ms ease'}}
        >
          <CheckCircle className="w-3 h-3" />
          Mark Reviewed
        </button>
      </div>
    </div>
  )
}
