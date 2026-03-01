import React from 'react'

const tierStyles = {
  critical: { background: 'rgba(239, 83, 80, 0.15)', color: '#EF5350' },
  suspicious: { background: 'rgba(255, 167, 38, 0.15)', color: '#FFA726' },
  allowed: { background: 'rgba(102, 187, 106, 0.15)', color: '#66BB6A' },
}

export default function StatusPill({ tier, children }) {
  const style = tierStyles[tier] || { background: 'rgba(83, 58, 123, 0.3)', color: 'var(--text-muted)' }
  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 2,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  )
}
