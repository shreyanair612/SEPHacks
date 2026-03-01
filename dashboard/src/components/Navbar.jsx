import React from 'react'
import { Bell, Search } from 'lucide-react'

export default function Navbar() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: 56,
      background: 'var(--bg-deep)',
      boxShadow: '0 1px 0 rgba(152, 193, 217, 0.06)',
    }}>
      <div>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>Dashboard</span>
      </div>
      <div style={{ position: 'relative', width: 220 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search..."
          style={{
            width: '100%',
            height: 36,
            background: 'rgba(83, 58, 123, 0.4)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
            padding: '0 12px 0 36px',
            color: '#FFFFFF',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Bell size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6969B3, #533A7B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          color: '#FFFFFF',
        }}>
          VA
        </div>
      </div>
    </div>
  )
}
