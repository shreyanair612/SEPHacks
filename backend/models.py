"""Velira data models — mirrors the DriftReport schema."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Any
import uuid


class DriftSeverity(str, Enum):
    ALLOWED = "allowed"
    SUSPICIOUS = "suspicious"
    CRITICAL = "critical"


@dataclass
class Deviation:
    """A single field-level difference between baseline and live config."""
    resource_id: str
    resource_name: str
    resource_type: str
    attribute_path: str
    baseline_value: Any
    current_value: Any
    detected_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class DriftClassification:
    """A classified drift event with GxP reasoning."""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    deviation: Deviation | None = None
    severity: DriftSeverity = DriftSeverity.ALLOWED
    reason: str = ""
    gxp_impact: str = ""
    cfr_reference: str = ""
    remediation_suggestion: str = ""
    remediation_code: str = ""
    classified_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        d = asdict(self)
        d["severity"] = self.severity.value
        return d


@dataclass
class EnvironmentStatus:
    """Overall environment health."""
    state: str = "compliant"  # compliant | warning | critical
    total_resources: int = 4
    compliant_resources: int = 4
    drifted_resources: int = 0
    risk_score: int = 0  # 0-100
    last_scan: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    baseline_serial: str = "v3.2"
    environment: str = "gxp-prod-eastus"


@dataclass
class DriftEvent:
    """An entry in the drift event feed."""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    resource_name: str = ""
    resource_type: str = ""
    severity: str = "allowed"
    summary: str = ""
    classification: DriftClassification | None = None
    pr_link: str | None = None

    def to_dict(self) -> dict:
        d = asdict(self)
        if self.classification:
            d["classification"] = self.classification.to_dict()
        return d
