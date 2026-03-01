"""
Velira API Server
Three endpoints with in-memory storage.
Runs the full comparison + classification pipeline locally.
Azure AI Function used for classification when available.
"""

from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import DriftSeverity
from comparison_engine import compare_configs, load_config
from classification import classify_all, get_overall_severity
from github_pr import create_remediation_pr

DATA_DIR = Path(__file__).parent.parent / "data" / "configs"

# ── In-memory store ──────────────────────────────────────────────

class Store:
    def __init__(self) -> None:
        self.baseline: dict = {}
        self.current_config: dict = {}
        self.current_scenario: str = "compliant"
        self.events: list[dict] = []
        self.audit_trail: list[dict] = []
        self.status: dict = {}
        self.classifications: list[dict] = []

    def reset(self) -> None:
        self.events = []
        self.audit_trail = []
        self.classifications = []
        self.current_scenario = "compliant"
        self.current_config = json.loads(json.dumps(self.baseline))
        self._update_status()

    def _update_status(self) -> None:
        deviations = compare_configs(self.baseline, self.current_config)
        if deviations:
            classifications = classify_all(deviations)
            overall = get_overall_severity(classifications)
            self.classifications = [c.to_dict() for c in classifications]

            counts: dict[str, int] = {"critical": 0, "suspicious": 0, "allowed": 0}
            for c in classifications:
                counts[c.severity.value] += 1

            now_iso = datetime.now(timezone.utc).isoformat()
            self.status = {
                "state": overall,
                "environment": "gxp-prod-eastus",
                "baseline_serial": "v3.2",
                "total_resources": 4,
                "compliant_resources": 4 - len({d.resource_name for d in deviations}),
                "drifted_resources": len({d.resource_name for d in deviations}),
                "risk_score": min(100, counts["critical"] * 25 + counts["suspicious"] * 10),
                "last_scan": now_iso,
                "last_updated": now_iso,
                "counts": counts,
                "summary": counts,
                "scenario": self.current_scenario,
            }
        else:
            self.classifications = []
            now_iso = datetime.now(timezone.utc).isoformat()
            self.status = {
                "state": "compliant",
                "environment": "gxp-prod-eastus",
                "baseline_serial": "v3.2",
                "total_resources": 4,
                "compliant_resources": 4,
                "drifted_resources": 0,
                "risk_score": 0,
                "last_scan": now_iso,
                "last_updated": now_iso,
                "counts": {"critical": 0, "suspicious": 0, "allowed": 0},
                "summary": {"critical": 0, "suspicious": 0, "allowed": 0},
                "scenario": self.current_scenario,
            }

    def trigger_drift(self, scenario: str) -> dict:
        # Map new frontend scenario names to backend names
        alias_map = {
            "critical-encryption": "critical",
            "suspicious-port": "suspicious",
            "allowed-scaling": "allowed",
        }
        scenario = alias_map.get(scenario, scenario)

        scenario_files = {
            "allowed": "drift_allowed.json",
            "suspicious": "drift_suspicious.json",
            "critical": "drift_critical.json",
            "compliant": None,
        }

        if scenario not in scenario_files:
            return {"error": f"Unknown scenario: {scenario}. Use: compliant, allowed, suspicious, critical"}

        self.current_scenario = scenario
        if scenario == "compliant":
            self.current_config = json.loads(json.dumps(self.baseline))
            self.events = []
            self.classifications = []
            self.audit_trail = []
        else:
            config_file = scenario_files[scenario]
            assert config_file is not None
            self.current_config = load_config(DATA_DIR / config_file)

        # Run comparison + classification
        self._update_status()

        # Generate events from classifications
        now = datetime.now(timezone.utc)
        self.events = []

        # If critical scenario, open a real GitHub PR
        pr_result: dict | None = None
        has_critical = any(c.get("severity") == "critical" for c in self.classifications)
        if scenario == "critical" and has_critical:
            fix_id = str(uuid.uuid4())[:8]
            pr_result = create_remediation_pr(fix_id)

        for _i, c in enumerate(self.classifications):
            dev = c.get("deviation", {})
            event_id = str(uuid.uuid4())[:8]

            # Attach the real PR object to critical events
            pr_obj: dict | None = None
            if c.get("severity") == "critical" and pr_result:
                pr_obj = {"pr_url": pr_result["pr_url"], "pr_real": pr_result["real"]}

            severity = c.get("severity", "suspicious")
            event = {
                "id": event_id,
                "timestamp": now.isoformat(),
                # New frontend field names
                "resource_id": dev.get("resource_name", "unknown"),
                "resource_type": dev.get("resource_type", "unknown"),
                "attribute_path": dev.get("attribute_path", ""),
                "baseline_value": dev.get("baseline_value"),
                "current_value": dev.get("current_value"),
                "tier": severity,
                "reasoning": c.get("reason", ""),
                "gxp_impact": c.get("gxp_impact", ""),
                "regulation_reference": c.get("cfr_reference", ""),
                "remediation_suggestion": c.get("remediation_suggestion", ""),
                "remediation_code": c.get("remediation_code", ""),
                "pr": pr_obj,
                "status": "open",
                # Keep legacy names for backward compat
                "resource_name": dev.get("resource_name", "unknown"),
                "severity": severity,
                "reason": c.get("reason", ""),
                "cfr_reference": c.get("cfr_reference", ""),
                "pr_link": pr_obj["pr_url"] if pr_obj else None,
            }
            self.events.append(event)

            # Audit trail entry
            self.audit_trail.append({
                "id": str(uuid.uuid4())[:8],
                "timestamp": now.isoformat(),
                "action": "drift_detected",
                "resource": dev.get("resource_name", "unknown"),
                "severity": c.get("severity", "suspicious"),
                "details": c.get("reason", ""),
                "event_id": event_id,
            })

        # Audit the PR creation itself
        if pr_result:
            self.audit_trail.append({
                "id": str(uuid.uuid4())[:8],
                "timestamp": now.isoformat(),
                "action": "pr_created",
                "resource": "genomics-data-storage-prod",
                "severity": "critical",
                "details": f"Remediation PR opened: {pr_result['pr_url']}",
                "pr_url": pr_result["pr_url"],
                "pr_real": pr_result["real"],
            })

        return {
            "triggered": scenario,
            "deviations_found": len(self.classifications),
            "state": self.status["state"],
            "pr": pr_result,
        }


store = Store()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    # Load baseline on startup
    store.baseline = load_config(DATA_DIR / "baseline.json")
    store.current_config = json.loads(json.dumps(store.baseline))
    store._update_status()
    print("[Velira] Loaded baseline v3.2 — 4 resources — environment COMPLIANT")
    yield


app = FastAPI(
    title="Velira API",
    description="GxP Configuration Drift Detection Engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ───────────────────────────────────────────────

class TriggerRequest(BaseModel):
    scenario: str = "critical"  # compliant | allowed | suspicious | critical


# ── Endpoints ────────────────────────────────────────────────────

@app.get("/api/status")
def get_status() -> dict:
    """Current environment status with drift summary."""
    return {
        **store.status,
        "classifications": store.classifications,
        "resources": _build_resource_view(),
    }


@app.get("/api/events")
def get_events() -> list:
    """Drift event feed, newest first. Returns a bare array."""
    return sorted(store.events, key=lambda e: e["timestamp"], reverse=True)


@app.get("/api/audit-trail")
def get_audit_trail() -> dict:
    """Full audit trail."""
    return {
        "entries": sorted(store.audit_trail, key=lambda e: e["timestamp"], reverse=True),
        "total": len(store.audit_trail),
    }


@app.post("/api/trigger-drift")
def trigger_drift(req: TriggerRequest) -> dict:
    """
    Trigger a drift scenario for demo purposes.
    Scenarios: compliant, allowed, suspicious, critical
    """
    result = store.trigger_drift(req.scenario)
    return result


def _build_resource_view() -> list[dict]:
    """Build per-resource status for dashboard display."""
    resources = []
    baseline_resources = store.baseline.get("resources", [])
    drifted_names: dict[str, list[dict]] = {}

    for c in store.classifications:
        dev = c.get("deviation", {})
        name = dev.get("resource_name", "")
        if name not in drifted_names:
            drifted_names[name] = []
        drifted_names[name].append(c)

    for r in baseline_resources:
        name = r["resource_name"]
        rtype = r["resource_type"].split("/")[-1]
        if name in drifted_names:
            classifications = drifted_names[name]
            worst = max(
                classifications,
                key=lambda c: {"critical": 3, "suspicious": 2, "allowed": 1}.get(c["severity"], 0),
            )
            resources.append({
                "name": name,
                "type": rtype,
                "status": worst["severity"],
                "drift_count": len(classifications),
                "top_issue": worst["reason"],
            })
        else:
            resources.append({
                "name": name,
                "type": rtype,
                "status": "compliant",
                "drift_count": 0,
                "top_issue": None,
            })

    return resources


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
