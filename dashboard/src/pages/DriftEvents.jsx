import React from 'react'
import { ShieldCheck } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import DriftEventCard from '../components/DriftEventCard'
import { useApp } from '../context/AppContext'

export default function DriftEvents(){
  const { events } = useApp()
  return (
    <div className="min-h-screen" style={{background:'var(--bg-primary)'}}>
      <Sidebar />
      <div className="ml-60">
        <Navbar />
        <main className="p-8">
          <h1 className="text-xl mb-4" style={{color:'var(--text-primary)'}}>Drift Events</h1>
          <div className="space-y-3">
            {events && events.length ? events.map(e => <DriftEventCard key={e.id} evt={e} />) : (
              <div className="card text-center p-10">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2" style={{color:'#6969B3'}} />
                <div className="text-sm font-medium" style={{color:'var(--text-primary)'}}>No events</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
