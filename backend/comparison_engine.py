"""
Velira Comparison Engine
Deep-diffs two Azure resource configuration snapshots and returns
structured Deviation objects for every changed field.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from models import Deviation


def _flatten(obj: Any, prefix: str = "") -> dict[str, Any]:
    """Flatten a nested dict/list into dot-separated paths."""
    items: dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{prefix}.{k}" if prefix else k
            items.update(_flatten(v, new_key))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            # For security rules, use the 'name' field as key if available
            if isinstance(v, dict) and "name" in v:
                new_key = f"{prefix}[{v['name']}]"
            else:
                new_key = f"{prefix}[{i}]"
            items.update(_flatten(v, new_key))
    else:
        items[prefix] = obj
    return items


def _find_resource(resources: list[dict], resource_id: str) -> dict | None:
    """Find a resource by ID in a resource list."""
    for r in resources:
        if r["resource_id"] == resource_id:
            return r
    return None


def compare_configs(
    baseline: dict,
    current: dict,
    timestamp: str | None = None,
) -> list[Deviation]:
    """
    Compare baseline config against current snapshot.
    Returns a list of Deviation objects for every changed field.
    """
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()

    deviations: list[Deviation] = []
    baseline_resources = baseline.get("resources", [])
    current_resources = current.get("resources", [])

    for baseline_resource in baseline_resources:
        rid = baseline_resource["resource_id"]
        rname = baseline_resource["resource_name"]
        rtype = baseline_resource["resource_type"]

        current_resource = _find_resource(current_resources, rid)
        if current_resource is None:
            deviations.append(Deviation(
                resource_id=rid,
                resource_name=rname,
                resource_type=rtype,
                attribute_path="(resource)",
                baseline_value="present",
                current_value="missing",
                detected_at=timestamp,
            ))
            continue

        # Flatten and diff properties
        baseline_flat = _flatten(baseline_resource.get("properties", {}))
        current_flat = _flatten(current_resource.get("properties", {}))

        all_keys = set(baseline_flat.keys()) | set(current_flat.keys())
        for key in sorted(all_keys):
            bval = baseline_flat.get(key)
            cval = current_flat.get(key)
            if bval != cval:
                deviations.append(Deviation(
                    resource_id=rid,
                    resource_name=rname,
                    resource_type=rtype,
                    attribute_path=f"properties.{key}",
                    baseline_value=bval,
                    current_value=cval,
                    detected_at=timestamp,
                ))

    # Check for new resources not in baseline
    baseline_ids = {r["resource_id"] for r in baseline_resources}
    for current_resource in current_resources:
        if current_resource["resource_id"] not in baseline_ids:
            deviations.append(Deviation(
                resource_id=current_resource["resource_id"],
                resource_name=current_resource["resource_name"],
                resource_type=current_resource["resource_type"],
                attribute_path="(resource)",
                baseline_value="missing",
                current_value="present",
                detected_at=timestamp,
            ))

    return deviations


def load_config(path: str | Path) -> dict:
    """Load a JSON config file."""
    with open(path) as f:
        return json.load(f)


if __name__ == "__main__":
    # Quick smoke test
    data_dir = Path(__file__).parent.parent / "data" / "configs"
    baseline = load_config(data_dir / "baseline.json")

    for scenario in ["drift_allowed", "drift_suspicious", "drift_critical"]:
        current = load_config(data_dir / f"{scenario}.json")
        devs = compare_configs(baseline, current)
        print(f"\n{'='*60}")
        print(f"Scenario: {scenario} — {len(devs)} deviation(s)")
        print(f"{'='*60}")
        for d in devs:
            print(f"  [{d.resource_name}] {d.attribute_path}")
            print(f"    baseline: {d.baseline_value}")
            print(f"    current:  {d.current_value}")
