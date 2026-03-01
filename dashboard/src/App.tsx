import { useDriftPolling } from "./hooks/useDriftPolling";
import AlertBanner from "./components/AlertBanner";
import StatusSummary from "./components/StatusSummary";
import ResourceList from "./components/ResourceList";
import EventFeed from "./components/EventFeed";
import DemoControls from "./components/DemoControls";

export default function App() {
  const { status, events, triggerDrift, isLive } = useDriftPolling();

  return (
    <div className={`app app-${status.state}`}>
      <header className="app-header">
        <div className="brand">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14h12M14 8v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="14" cy="14" r="3" fill="currentColor" opacity="0.4"/>
            </svg>
          </div>
          <h1>Velira</h1>
          <span className="tagline">GxP Compliance Engine</span>
        </div>
        <div className="header-right">
          <DemoControls
            currentScenario={status.scenario}
            onTrigger={(s) => triggerDrift(s)}
          />
          <div className="header-meta">
            <span className="env-badge">{status.environment}</span>
            <span className="baseline-badge">Baseline {status.baseline_serial}</span>
            {isLive && <span className="live-dot">LIVE</span>}
          </div>
        </div>
      </header>

      <AlertBanner events={events.events} state={status.state} />
      <StatusSummary status={status} />

      <div className="main-panels">
        <ResourceList resources={status.resources} />
        <EventFeed events={events.events} />
      </div>

      <footer className="app-footer">
        <span>Velira v0.1.0</span>
        <span>Baseline validated 2025-11-15</span>
        <span>21 CFR Part 11 Compliant Monitoring</span>
      </footer>
    </div>
  );
}
