import React from 'react'
import { ShieldCheck } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function Compliance() {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{
        marginLeft: 240,
        padding: '28px 36px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div className="fade-in fade-in-0" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Compliance
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            GxP compliance policies and validation status
          </p>
        </div>

        <div className="glass-panel-static fade-in fade-in-1" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <ShieldCheck size={32} strokeWidth={1.5} style={{ color: 'var(--accent-primary)', opacity: 0.6 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Compliance Module</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
            21 CFR Part 11 validation tracking, policy management, and compliance scoring — coming soon.
          </div>
        </div>
      </div>
    </div>
  )
}
