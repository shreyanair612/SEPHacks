import React from 'react'
import useCountUp from '../hooks/useCountUp'

function AnimatedValue({ value }) {
  const slashMatch = typeof value === 'string' && value.match(/^(\d+)(\/.+)$/)
  if (slashMatch) {
    const num = useCountUp(Number(slashMatch[1]))
    return <>{num}{slashMatch[2]}</>
  }

  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))
  if (isNumeric) {
    const num = useCountUp(Number(value))
    return <>{num}</>
  }

  return <>{value}</>
}

export default function StatCard({ title, value, subtitle, accentColor, className }) {
  return (
    <div className={`glass-panel ${className || ''}`} style={{ padding: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accentColor || '#FFFFFF', lineHeight: 1, letterSpacing: '-0.02em' }}>
        <AnimatedValue value={value} />
      </div>
      {subtitle && <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--text-muted)', marginTop: 8 }}>{subtitle}</div>}
    </div>
  )
}
