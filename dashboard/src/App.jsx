import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import LandingExperience from './components/LandingExperience'
import Dashboard from './pages/Dashboard'
import DriftEvents from './pages/DriftEvents'
import AuditTrail from './pages/AuditTrail'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingExperience />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<DriftEvents />} />
          <Route path="/audit" element={<AuditTrail />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
