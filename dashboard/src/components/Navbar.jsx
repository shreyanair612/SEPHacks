import React from 'react'
import { Bell, Zap, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Navbar(){
  const { status, simulateScenario, offline } = useApp()
  const badgeCount = status ? (status.counts.critical + status.counts.suspicious) : 0

  async function handleSimulate(){
    const btn = document.getElementById('simulate-btn')
    btn.disabled = true
    btn.innerText = 'Simulating...'
    await simulateScenario('critical-encryption')
    btn.disabled = false
    btn.innerText = 'Simulate Drift'
  }

  return (
    <div className="flex items-center justify-between px-8" style={{height:56, background:'var(--bg-card)', borderBottom:'1px solid var(--border-color)'}}>
      <div>
        <span style={{fontSize:16, fontWeight:600, color:'var(--text-primary)'}}>Dashboard</span>
      </div>
      <div className="relative" style={{width:240}}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-secondary)'}} />
        <input
          type="text"
          placeholder="Search events..."
          className="w-full rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none"
          style={{background:'#F4F2F7', border:'none', color:'var(--text-primary)'}}
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#6969B3'}} />
          <span style={{color:'#6969B3', fontSize:11, fontWeight:500}}>Live</span>
        </div>
        <button
          id="simulate-btn"
          onClick={handleSimulate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{background:'#533A7B', color:'#fff', transition:'all 200ms ease'}}
        >
          <Zap className="w-3 h-3" />
          Simulate Drift
        </button>
        <div className="relative cursor-pointer">
          <Bell className="w-4 h-4" style={{color:'var(--text-secondary)'}} />
          {badgeCount > 0 && (
            <div className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{background:'#533A7B'}}>
              {badgeCount}
            </div>
          )}
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{background:'#6969B3'}}>
          AV
        </div>
      </div>
    </div>
  )
}
