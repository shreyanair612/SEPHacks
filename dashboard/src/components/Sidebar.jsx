import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, Activity, FileText, BarChart2, Settings, HelpCircle } from 'lucide-react'

const mainItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Drift Events', icon: Activity, path: '/events' },
  { label: 'Audit Trail', icon: FileText, path: '/audit' },
  { label: 'Compliance', icon: ShieldCheck, path: null },
  { label: 'Reports', icon: BarChart2, path: null },
]

const systemItems = [
  { label: 'Settings', icon: Settings, path: null },
  { label: 'Help', icon: HelpCircle, path: null },
]

function NavSection({ label, items, currentPath, navigate }) {
  return (
    <div>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.1em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        paddingLeft: 24,
        marginBottom: 8,
      }}>
        {label}
      </div>
      {items.map(item => {
        const Icon = item.icon
        const isActive = item.path && currentPath === item.path
        return (
          <div
            key={item.label}
            className="nav-item"
            onClick={() => item.path && navigate(item.path)}
            style={{
              height: 40,
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: item.path ? 'pointer' : 'default',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 0,
              borderLeft: isActive
                ? '2px solid var(--accent-primary)'
                : '2px solid transparent',
              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
              background: isActive
                ? 'rgba(152, 193, 217, 0.08)'
                : 'transparent',
              opacity: item.path ? 1 : 0.5,
            }}
            onMouseEnter={e => {
              if (!isActive && item.path) {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'rgba(152, 193, 217, 0.04)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive && item.path) {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            <Icon size={16} strokeWidth={1.5} />
            <span>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: 240,
      height: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '1px 0 0 rgba(152, 193, 217, 0.06)',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{ height: 72, display: 'flex', alignItems: 'center', padding: '0 24px', cursor: 'pointer' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 10, flexShrink: 0 }}>
          <path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L8 1z" fill="#98C1D9" />
        </svg>
        <span style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.03em',
        }}>
          Latch
        </span>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 24px' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <NavSection label="MAIN" items={mainItems} currentPath={location.pathname} navigate={navigate} />
        <NavSection label="SYSTEM" items={systemItems} currentPath={location.pathname} navigate={navigate} />
      </nav>

      {/* Separator */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 24px' }} />

      {/* User area */}
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6969B3, #533A7B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: '#FFFFFF',
          flexShrink: 0,
        }}>
          VA
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>Latch Admin</div>
          <div style={{ fontSize: 11, fontWeight: 300, color: 'var(--text-muted)' }}>Administrator</div>
        </div>
      </div>
    </aside>
  )
}
