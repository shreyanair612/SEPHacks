"""Tests for the Velira comparison engine."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from comparison_engine import compare_configs, load_config

DATA_DIR = Path(__file__).parent.parent / "data" / "configs"


def test_no_drift():
    """Baseline vs itself should produce zero deviations."""
    baseline = load_config(DATA_DIR / "baseline.json")
    devs = compare_configs(baseline, baseline)
    assert len(devs) == 0, f"Expected 0 deviations, got {len(devs)}"
    print("PASS: no drift — 0 deviations")


def test_allowed_drift():
    """Allowed scenario: only VM size change (instance scaling)."""
    baseline = load_config(DATA_DIR / "baseline.json")
    current = load_config(DATA_DIR / "drift_allowed.json")
    devs = compare_configs(baseline, current)

    assert len(devs) == 1, f"Expected 1 deviation, got {len(devs)}"
    d = devs[0]
    assert "vmSize" in d.attribute_path
    assert d.baseline_value == "Standard_D2s_v3"
    assert d.current_value == "Standard_D4s_v3"
    assert d.resource_name == "gxp-pipeline-compute"
    print(f"PASS: allowed drift — {len(devs)} deviation (VM scaling)")


def test_suspicious_drift():
    """Suspicious scenario: new NSG rule on port 8080 from private range."""
    baseline = load_config(DATA_DIR / "baseline.json")
    current = load_config(DATA_DIR / "drift_suspicious.json")
    devs = compare_configs(baseline, current)

    # Should find new security rule fields
    nsg_devs = [d for d in devs if d.resource_name == "network-security-gxp"]
    assert len(nsg_devs) > 0, "Expected NSG deviations"
    has_8080 = any("AllowPort8080" in d.attribute_path or "8080" in str(d.current_value) for d in nsg_devs)
    assert has_8080, "Expected port 8080 rule deviation"
    print(f"PASS: suspicious drift — {len(devs)} deviation(s) (NSG port 8080)")


def test_critical_drift():
    """Critical scenario: encryption disabled, public access, role escalation, SSH open."""
    baseline = load_config(DATA_DIR / "baseline.json")
    current = load_config(DATA_DIR / "drift_critical.json")
    devs = compare_configs(baseline, current)

    # Should have many deviations across multiple resources
    assert len(devs) >= 5, f"Expected >=5 deviations for critical, got {len(devs)}"

    resource_names = {d.resource_name for d in devs}
    assert "genomics-data-storage-prod" in resource_names, "Missing storage deviations"
    assert "pipeline-iam-roles" in resource_names, "Missing IAM deviations"
    assert "network-security-gxp" in resource_names, "Missing NSG deviations"

    # Check encryption specifically
    encryption_devs = [d for d in devs if "encryption" in d.attribute_path.lower() and "enabled" in d.attribute_path]
    assert len(encryption_devs) > 0, "Expected encryption deviation"
    enc = encryption_devs[0]
    assert enc.baseline_value is True and enc.current_value is False

    # Check role escalation
    role_devs = [d for d in devs if "roleDefinitionName" in d.attribute_path]
    assert len(role_devs) == 1
    assert role_devs[0].baseline_value == "Contributor"
    assert role_devs[0].current_value == "Owner"

    print(f"PASS: critical drift — {len(devs)} deviations across {len(resource_names)} resources")


if __name__ == "__main__":
    test_no_drift()
    test_allowed_drift()
    test_suspicious_drift()
    test_critical_drift()
    print("\nAll comparison engine tests passed.")
