import React from 'react'
import { LayoutDashboard, AlertTriangle, ClipboardList, Settings } from 'lucide-react'
import Logo from './Logo'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Drift Events', icon: AlertTriangle },
  { label: 'Audit Trail', icon: ClipboardList },
  { label: 'Settings', icon: Settings },
]

export default function Sidebar(){
  return (
    <aside className="w-60 bg-white h-screen fixed left-0 top-0 flex flex-col" style={{borderRight:'1px solid var(--border-color)'}}>
      <div className="px-5 py-5">
        <Logo />
      </div>

      <div className="px-3 mt-2 mb-2" style={{fontSize:10, fontWeight:600, letterSpacing:'0.06em', color:'var(--text-secondary)', textTransform:'uppercase'}}>
        <span className="px-3">Navigation</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className={`nav-item flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer ${item.active ? 'nav-active' : ''}`}
              style={item.active ? {
                background: 'rgba(152,193,217,0.15)',
                borderLeft: '3px solid #6969B3',
                color: '#533A7B',
                fontSize: 13,
                fontWeight: 500,
              } : {
                color: 'var(--text-secondary)',
                borderLeft: '3px solid transparent',
                fontSize: 13,
                fontWeight: 400,
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
          )
        })}
      </nav>

      <div className="mx-4 mb-4 p-3 rounded-lg text-xs" style={{background:'var(--bg-primary)'}}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{background:'#6969B3'}} />
          <span className="font-medium" style={{color:'var(--text-primary)', fontSize:12}}>All systems monitored</span>
        </div>
        <div className="mt-1" style={{color:'var(--text-secondary)', fontSize:11}}>Last sync: just now</div>
      </div>
    </aside>
  )
}
