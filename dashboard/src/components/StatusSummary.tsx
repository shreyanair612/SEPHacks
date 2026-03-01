import type { StatusResponse } from "../types";

interface Props {
  status: StatusResponse;
}

export default function StatusSummary({ status }: Props) {
  const stateLabel = {
    compliant: "AUDIT READY",
    warning: "REVIEW NEEDED",
    critical: "CRITICAL",
  }[status.state] ?? "UNKNOWN";

  const stateClass = status.state;

  return (
    <div className="status-summary">
      <div className={`status-hero status-hero-${stateClass}`}>
        <div className="hero-left">
          <div className="hero-score-ring">
            <svg viewBox="0 0 100 100" className="score-ring">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="var(--border)"
                strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={status.state === "compliant" ? "var(--green)" : status.state === "critical" ? "var(--red)" : "var(--amber)"}
                strokeWidth="6"
                strokeDasharray={`${(status.risk_score / 100) * 264} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="score-fill"
              />
            </svg>
            <div className="hero-score-value">{status.risk_score}</div>
          </div>
          <div className="hero-meta">
            <span className={`hero-state-badge badge-${stateClass}`}>{stateLabel}</span>
            <span className="hero-label">Risk Score</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="stat-num">{status.total_resources}</span>
            <span className="stat-label">Total Resources</span>
          </div>
          <div className="hero-stat">
            <span className="stat-num stat-compliant">{status.compliant_resources}</span>
            <span className="stat-label">Compliant</span>
          </div>
          <div className="hero-stat">
            <span className="stat-num stat-drifted">{status.drifted_resources}</span>
            <span className="stat-label">Drifted</span>
          </div>
        </div>
      </div>
      <div className="status-cards">
        <div className={`status-card card-critical ${status.summary.critical > 0 ? "card-active" : ""}`}>
          <span className="card-count">{status.summary.critical}</span>
          <span className="card-label">Critical</span>
        </div>
        <div className={`status-card card-suspicious ${status.summary.suspicious > 0 ? "card-active" : ""}`}>
          <span className="card-count">{status.summary.suspicious}</span>
          <span className="card-label">Suspicious</span>
        </div>
        <div className={`status-card card-allowed ${status.summary.allowed > 0 ? "card-active" : ""}`}>
          <span className="card-count">{status.summary.allowed}</span>
          <span className="card-label">Allowed</span>
        </div>
      </div>
    </div>
  );
}
