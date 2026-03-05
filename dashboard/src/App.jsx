import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import LandingExperience from './components/LandingExperience'
import Dashboard from './pages/Dashboard'
import DriftEvents from './pages/DriftEvents'
import AuditTrail from './pages/AuditTrail'
import Compliance from './pages/Compliance'
import Reports from './pages/Reports'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingExperience />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<DriftEvents />} />
          <Route path="/audit" element={<AuditTrail />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
