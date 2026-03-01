import React from 'react'
import { ShieldCheck } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import DriftEventCard from '../components/DriftEventCard'
import { useApp } from '../context/AppContext'

export default function DriftEvents() {
  const { events } = useApp()
  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 240, padding: '32px 40px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 24 }}>Drift Events</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events && events.length ? events.map(e => <DriftEventCard key={e.id} evt={e} />) : (
            <div className="glass-panel-static" style={{ textAlign: 'center', padding: 40 }}>
              <ShieldCheck size={32} style={{ color: 'var(--accent-secondary)', marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>No events</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
