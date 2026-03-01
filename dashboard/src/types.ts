// Velira API types — mirrors the backend models

export type DriftSeverity = "allowed" | "suspicious" | "critical";
export type EnvironmentState = "compliant" | "warning" | "critical";

export interface DriftSummary {
  critical: number;
  suspicious: number;
  allowed: number;
}

export interface Resource {
  name: string;
  type: string;
  status: DriftSeverity | "compliant";
  drift_count: number;
  top_issue: string | null;
}

export interface Classification {
  id: string;
  deviation: {
    resource_id: string;
    resource_name: string;
    resource_type: string;
    attribute_path: string;
    baseline_value: unknown;
    current_value: unknown;
    detected_at: string;
  };
  severity: DriftSeverity;
  reason: string;
  gxp_impact: string;
  cfr_reference: string;
  remediation_suggestion: string;
  remediation_code: string;
  classified_at: string;
}

export interface StatusResponse {
  state: EnvironmentState;
  environment: string;
  baseline_serial: string;
  total_resources: number;
  compliant_resources: number;
  drifted_resources: number;
  risk_score: number;
  last_scan: string;
  summary: DriftSummary;
  scenario: string;
  classifications: Classification[];
  resources: Resource[];
}

export interface DriftEvent {
  id: string;
  timestamp: string;
  resource_name: string;
  resource_type: string;
  attribute_path: string;
  baseline_value: unknown;
  current_value: unknown;
  severity: DriftSeverity;
  reason: string;
  gxp_impact: string;
  cfr_reference: string;
  remediation_suggestion: string;
  remediation_code: string;
  pr_link: string | null;
}

export interface EventsResponse {
  events: DriftEvent[];
  total: number;
}
