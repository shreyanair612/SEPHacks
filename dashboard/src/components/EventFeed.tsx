import { useState } from "react";
import type { DriftEvent } from "../types";

interface Props {
  events: DriftEvent[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function EventCard({ event }: { event: DriftEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`event-card event-${event.severity} ${expanded ? "event-expanded" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="event-top">
        <div className="event-header">
          <span className={`severity-badge badge-${event.severity}`}>
            {event.severity.toUpperCase()}
          </span>
          <span className="event-time">{formatTime(event.timestamp)}</span>
        </div>
        <div className="event-resource">{event.resource_name}</div>
        <div className="event-summary">{event.reason.split(".")[0]}</div>
      </div>

      {expanded && (
        <div className="event-detail animate-in">
          <div className="detail-section">
            <div className="detail-label">What Changed</div>
            <div className="detail-diff">
              <div className="diff-row">
                <span className="diff-path">{event.attribute_path}</span>
              </div>
              <div className="diff-values">
                <div className="diff-baseline">
                  <span className="diff-tag">BASELINE</span>
                  <code>{String(event.baseline_value)}</code>
                </div>
                <span className="diff-arrow">&rarr;</span>
                <div className="diff-current">
                  <span className="diff-tag">CURRENT</span>
                  <code>{String(event.current_value)}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-label">GxP Impact</div>
            <div className="detail-text">{event.gxp_impact}</div>
          </div>

          <div className="detail-section">
            <div className="detail-label">FDA Regulation</div>
            <div className="detail-cfr">{event.cfr_reference}</div>
          </div>

          <div className="detail-section">
            <div className="detail-label">Remediation</div>
            <div className="detail-text">{event.remediation_suggestion}</div>
          </div>

          {event.remediation_code && (
            <div className="detail-section">
              <div className="detail-label">Infrastructure Fix</div>
              <pre className="detail-code"><code>{event.remediation_code}</code></pre>
            </div>
          )}

          {event.pr_link && (
            <a
              href={event.pr_link}
              target="_blank"
              rel="noopener noreferrer"
              className="event-pr-link"
              onClick={(e) => e.stopPropagation()}
            >
              View Remediation PR &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function EventFeed({ events }: Props) {
  return (
    <div className="event-feed panel">
      <div className="panel-header">
        <h2>Drift Events</h2>
        <span className="panel-count">{events.length}</span>
      </div>
      <div className="event-list">
        {events.length === 0 ? (
          <div className="event-empty">
            <div className="empty-icon">OK</div>
            <div>No drift events detected</div>
            <div className="empty-sub">All resources match the validated baseline</div>
          </div>
        ) : (
          events.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
