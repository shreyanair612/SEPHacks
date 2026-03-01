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

export default function StatCard({ title, value, subtitle, accentColor, className }){
  return (
    <div className={`card ${className || ''}`} style={{padding:16}}>
      <div style={{fontSize:11, fontWeight:600, letterSpacing:'0.04em', color:'var(--text-secondary)', marginBottom:4, textTransform:'uppercase'}}>{title}</div>
      <div style={{fontFamily:'"JetBrains Mono", "SF Mono", ui-monospace, monospace', fontSize:24, fontWeight:600, color: accentColor || 'var(--text-primary)', lineHeight:1.2}}>
        <AnimatedValue value={value} />
      </div>
      {subtitle && <div style={{fontSize:12, color:'var(--text-secondary)', marginTop:4}}>{subtitle}</div>}
    </div>
  )
}
