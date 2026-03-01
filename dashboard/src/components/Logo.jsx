import React from 'react'

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L8 1z" fill="#98C1D9" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: '#FFFFFF' }}>Velira</span>
    </div>
  )
}
