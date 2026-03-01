import React from 'react'
import { Shield } from 'lucide-react'

// To swap with a custom logo, replace the <div>…<Shield /></div> block
// with: <img src="/logo.svg" alt="Velira" className="w-8 h-8" />
export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{background:'#533A7B'}}>
        <Shield className="w-4 h-4 text-white" />
      </div>
      <span style={{fontWeight:700, fontSize:14, letterSpacing:'0.08em', color:'var(--text-primary)'}}>VELIRA</span>
    </div>
  )
}
