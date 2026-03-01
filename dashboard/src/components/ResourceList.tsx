import type { Resource } from "../types";

interface Props {
  resources: Resource[];
}

const typeIcons: Record<string, string> = {
  storageAccounts: "ST",
  roleAssignments: "IA",
  networkSecurityGroups: "NS",
  virtualMachines: "VM",
};

export default function ResourceList({ resources }: Props) {
  return (
    <div className="resource-list panel">
      <div className="panel-header">
        <h2>Resources</h2>
        <span className="panel-count">{resources.length}</span>
      </div>
      <div className="resource-table">
        {resources.map((r) => (
          <div key={r.name} className={`resource-row resource-${r.status}`}>
            <div className="resource-indicator">
              <span className={`dot dot-${r.status}`} />
            </div>
            <div className="resource-icon">{typeIcons[r.type] ?? r.type.slice(0, 2).toUpperCase()}</div>
            <div className="resource-info">
              <span className="resource-name">{r.name}</span>
              <span className="resource-type">{r.type}</span>
            </div>
            <div className="resource-drift">
              {r.drift_count > 0 ? (
                <>
                  <span className={`drift-badge drift-${r.status}`}>
                    {r.drift_count} drift{r.drift_count > 1 ? "s" : ""}
                  </span>
                  <span className="drift-issue">{r.top_issue?.split(".")[0]}</span>
                </>
              ) : (
                <span className="drift-clean">No drift detected</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
