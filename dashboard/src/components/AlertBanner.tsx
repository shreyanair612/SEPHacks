import type { DriftEvent } from "../types";

interface Props {
  events: DriftEvent[];
  state: string;
}

export default function AlertBanner({ events, state }: Props) {
  if (state === "compliant") return null;

  const critical = events.filter((e) => e.severity === "critical");
  if (critical.length === 0) return null;

  return (
    <div className="alert-banner animate-in">
      <div className="alert-stripe" />
      <div className="alert-body">
        <div className="alert-header">
          <span className="alert-icon-pulse" />
          <strong>
            {critical.length} CRITICAL DRIFT{critical.length > 1 ? "S" : ""} DETECTED
          </strong>
          <span className="alert-tag">IMMEDIATE ACTION REQUIRED</span>
        </div>
        <div className="alert-items">
          {critical.slice(0, 4).map((e) => (
            <div key={e.id} className="alert-item">
              <span className="alert-resource">{e.resource_name}</span>
              <span className="alert-sep">&mdash;</span>
              <span className="alert-reason">{e.reason.split(".")[0]}</span>
              {e.pr_link && (
                <a
                  href={e.pr_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pr-link"
                >
                  PR #{e.pr_link.split("/").pop()}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
