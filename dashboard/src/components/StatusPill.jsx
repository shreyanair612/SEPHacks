import React from 'react'

const tierStyles = {
  critical: { background: '#EDE6F5', color: '#533A7B' },
  suspicious: { background: '#E8EEF7', color: '#6969B3' },
  allowed: { background: '#E8F2F7', color: '#5A8FA8' },
}

export default function StatusPill({ tier, children }){
  const style = tierStyles[tier] || { background: '#F4F2F7', color: '#6B6178' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px]"
      style={{...style, fontWeight:500}}
    >
      {children}
    </span>
  )
}
