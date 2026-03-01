"""Standalone test for GitHub PR auto-generation."""

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone
from github_pr_client import create_drift_pr


def main():
    print("=" * 60)
    print("TEST: Create drift remediation PR")
    print("=" * 60)

    drift_event = {
        "resource_id": "genomics-data-storage-prod",
        "attribute": "encryption_enabled",
        "baseline_value": "true",
        "current_value": "false",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    classification = {
        "tier": "critical",
        "reason": "Encryption disabled on genomics storage. This violates 21 CFR Part 11.10(a) which requires data integrity controls on all validated systems.",
        "regulation_reference": "21 CFR Part 11.10(a)",
        "source": "azure-search+azure-ai",
    }

    print(f"\nDrift Event: {drift_event}")
    print(f"Classification: {classification}\n")

    pr_url = create_drift_pr(drift_event, classification)

    print("\n" + "=" * 60)
    if pr_url:
        print(f"PASS — PR URL: {pr_url}")
    else:
        print("FAIL — PR creation returned None")
    print("=" * 60)


if __name__ == "__main__":
    main()
