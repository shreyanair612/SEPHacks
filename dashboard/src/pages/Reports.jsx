import React from 'react'
import { BarChart2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function Reports() {
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
            Reports
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Drift analytics and compliance reports
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
          <BarChart2 size={32} strokeWidth={1.5} style={{ color: 'var(--accent-primary)', opacity: 0.6 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>Reports Module</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
            Automated compliance reports, drift trend analysis, and exportable audit documentation — coming soon.
          </div>
        </div>
      </div>
    </div>
  )
}
