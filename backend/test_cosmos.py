"""Standalone test for CosmosDB persistence layer."""

from dotenv import load_dotenv
load_dotenv()

from cosmos_client import (
    save_drift_event,
    save_audit_record,
    get_all_drift_events,
    get_drift_event_by_id,
    get_audit_trail,
)

MOCK_EVENT_ID = "test-abc123"


def main():
    print("=" * 60)
    print("CosmosDB Persistence Test")
    print("=" * 60)

    # Test 1: save_drift_event
    print("\n[TEST 1] save_drift_event")
    mock_event = {
        "id": MOCK_EVENT_ID,
        "timestamp": "2026-03-01T15:00:00+00:00",
        "resource_id": "genomics-data-storage-prod",
        "resource_type": "Microsoft.Storage/storageAccounts",
        "attribute_path": "properties.encryption.services.blob.enabled",
        "baseline_value": True,
        "current_value": False,
        "tier": "critical",
        "reasoning": "Encryption disabled on genomics storage account",
        "gxp_impact": "Compromises confidentiality of FDA-regulated records",
        "regulation_reference": "21 CFR Part 11.10(a)",
        "cfr_reference": "21 CFR Part 11.10(a)",
        "remediation_suggestion": "Re-enable blob encryption",
        "remediation_code": "",
        "pr": {"pr_url": "https://github.com/test/pr/1", "pr_real": False},
        "status": "open",
        "resource_name": "genomics-data-storage-prod",
        "severity": "critical",
        "reason": "Encryption disabled on genomics storage account",
        "pr_link": "https://github.com/test/pr/1",
    }
    result = save_drift_event(mock_event)
    print(f"  Result: {'PASS' if result else 'FAIL (expected if CosmosDB unavailable)'}")

    # Test 2: save_audit_record
    print("\n[TEST 2] save_audit_record")
    result = save_audit_record({
        "action_type": "drift_detected",
        "event_id": MOCK_EVENT_ID,
        "resource_id": "genomics-data-storage-prod",
        "tier": "critical",
        "regulation_reference": "21 CFR Part 11.10(a)",
        "details": "Test audit record for drift detection",
        "timestamp": "2026-03-01T15:00:00+00:00",
    })
    print(f"  Result: {'PASS' if result else 'FAIL (expected if CosmosDB unavailable)'}")

    # Test 3: get_all_drift_events
    print("\n[TEST 3] get_all_drift_events")
    events = get_all_drift_events()
    print(f"  Returned {len(events)} events")

    # Test 4: get_drift_event_by_id
    print("\n[TEST 4] get_drift_event_by_id")
    event = get_drift_event_by_id(MOCK_EVENT_ID)
    print(f"  Result: {'PASS — found event' if event else 'FAIL (expected if CosmosDB unavailable)'}")

    # Test 5: get_audit_trail
    print("\n[TEST 5] get_audit_trail")
    records = get_audit_trail()
    print(f"  Returned {len(records)} records")

    print("\n" + "=" * 60)
    print("All functions executed without raising — graceful degradation confirmed")
    print("=" * 60)


if __name__ == "__main__":
    main()
