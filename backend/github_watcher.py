"""
GitHub File Watcher for Live Demo Flow

Polls a single file on GitHub every 5 seconds via `gh api`.
When the file drifts from the hardcoded baseline, it:
  1. Injects hardcoded critical events into the store (instant, no Azure AI)
  2. Creates a PR that overwrites the file with the baseline content
When the file matches the baseline again (PR merged), it resets the store.

State machine: CLEAN <-> DRIFTED
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import uuid
from datetime import datetime, timezone

import requests

# ── Configuration ────────────────────────────────────────────────

REPO = os.environ.get(
    "VELIRA_GITHUB_REPO",
    f"{os.environ.get('GITHUB_REPO_OWNER', 'shreyanair612')}/{os.environ.get('GITHUB_REPO_NAME', 'latch-demo-env')}",
)

WATCHED_FILE = "infrastructure/genomics-storage.tf"
POLL_INTERVAL = 5  # seconds

BASELINE_CONTENT = """\
# =============================================================================
# Genomics Data Storage — GxP Validated Configuration
# Baseline: v3.2 (validated 2025-11-15)
# Environment: gxp-prod-eastus
# Regulation: 21 CFR Part 11.10(a)
# =============================================================================

resource "azurerm_storage_account" "genomics_data" {
  name                     = "genomicsdatastorageprod"
  resource_group_name      = azurerm_resource_group.gxp_prod.name
  location                 = "eastus"
  account_tier             = "Standard"
  account_replication_type = "GRS"

  # Encryption — required for 21 CFR Part 11 data-at-rest protection
  blob_properties {
    versioning_enabled = true
  }

  # Public access — must be disabled for regulated data
  allow_nested_items_to_be_public = false

  # TLS — minimum TLS 1.2 required
  min_tls_version = "TLS1_2"

  # HTTPS — enforce encrypted transport
  https_traffic_only_enabled = true

  # Network — restrict to VPC only
  network_rules {
    default_action             = "Deny"
    virtual_network_subnet_ids = [azurerm_subnet.data_subnet.id]
    bypass                     = ["AzureServices"]
  }

  tags = {
    environment = "gxp-prod"
    compliance  = "21-CFR-Part-11"
    baseline    = "v3.2"
  }
}
"""

# ── Hardcoded critical classifications (from cached_responses.py) ─

CRITICAL_EVENTS = [
    {
        "resource_name": "genomics-data-storage-prod",
        "resource_type": "Microsoft.Storage/storageAccounts",
        "attribute_path": "allow_nested_items_to_be_public",
        "baseline_value": "false",
        "current_value": "true",
        "severity": "critical",
        "reason": "Public blob access ENABLED on genomics data storage. Regulated electronic records are now accessible without authentication. This is a catastrophic security configuration change on a validated system.",
        "gxp_impact": "SEVERE — Regulated data is publicly accessible. Any electronic records in this storage account can be read by unauthenticated parties. This violates access control requirements and may constitute a data breach of regulated information.",
        "cfr_reference": "21 CFR Part 11.10(d) — Limiting system access to authorized individuals. 21 CFR Part 11.10(g) — Use of authority checks to ensure only authorized individuals can use the system.",
        "remediation_suggestion": "IMMEDIATE: Disable public blob access. Audit access logs for unauthorized reads. Assess whether any regulated data was exposed. File deviation report and notify QA.",
        "remediation_code": 'az storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --allow-blob-public-access false',
    },
    {
        "resource_name": "genomics-data-storage-prod",
        "resource_type": "Microsoft.Storage/storageAccounts",
        "attribute_path": "encryption.services.blob.enabled",
        "baseline_value": "true",
        "current_value": "false",
        "severity": "critical",
        "reason": "Encryption DISABLED on genomics data storage account. Blob and file encryption services both set to disabled. This directly compromises the confidentiality and integrity of regulated electronic records stored in this account.",
        "gxp_impact": "SEVERE — Direct violation of data integrity controls for electronic records. Genomics data stored without encryption is exposed to unauthorized access and potential tampering. All data written since the change may need integrity verification. This constitutes a reportable deviation.",
        "cfr_reference": "21 CFR Part 11.10(a) — Validation of systems to ensure accuracy, reliability, consistent intended performance, and the ability to discern invalid or altered records. 21 CFR Part 11.10(c) — Protection of records to enable their accurate and ready retrieval.",
        "remediation_suggestion": "IMMEDIATE ACTION REQUIRED: Re-enable encryption on the storage account. Audit all data access logs since the change. Verify data integrity of all records written during the unencrypted window. File a formal deviation report.",
        "remediation_code": 'resource "azurerm_storage_account" "genomics_data" {\n  name                     = "genomicsdatastorageprod"\n  resource_group_name      = "gxp-prod"\n  ...\n}',
    },
    {
        "resource_name": "genomics-data-storage-prod",
        "resource_type": "Microsoft.Storage/storageAccounts",
        "attribute_path": "minimumTlsVersion",
        "baseline_value": "TLS1_2",
        "current_value": "TLS1_0",
        "severity": "critical",
        "reason": "TLS minimum version downgraded from TLS 1.2 to TLS 1.0 on genomics storage. TLS 1.0 has known cryptographic weaknesses and is deprecated. This exposes data in transit to interception.",
        "gxp_impact": "Data in transit to/from validated storage is vulnerable to man-in-the-middle attacks. Electronic records transmitted over TLS 1.0 cannot be guaranteed to be unaltered.",
        "cfr_reference": "21 CFR Part 11.10(a) — Systems must ensure accuracy and reliability. 21 CFR Part 11.30 — Open system controls including encryption of records.",
        "remediation_suggestion": "Restore minimum TLS version to 1.2. Audit recent connections for any TLS 1.0 usage. Verify no data was intercepted during the downgrade window.",
        "remediation_code": 'az storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --min-tls-version TLS1_2',
    },
    {
        "resource_name": "genomics-data-storage-prod",
        "resource_type": "Microsoft.Storage/storageAccounts",
        "attribute_path": "supportsHttpsTrafficOnly",
        "baseline_value": "true",
        "current_value": "false",
        "severity": "critical",
        "reason": "HTTPS-only traffic enforcement disabled. The storage account now accepts unencrypted HTTP connections, allowing regulated data to be transmitted in plaintext.",
        "gxp_impact": "Electronic records can be transmitted without encryption, violating data integrity and confidentiality requirements for validated systems.",
        "cfr_reference": "21 CFR Part 11.30 — Controls for open systems must include encryption of records.",
        "remediation_suggestion": "Re-enable HTTPS-only enforcement immediately.",
        "remediation_code": 'az storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --https-only true',
    },
    {
        "resource_name": "genomics-data-storage-prod",
        "resource_type": "Microsoft.Storage/storageAccounts",
        "attribute_path": "networkAcls.defaultAction",
        "baseline_value": "Deny",
        "current_value": "Allow",
        "severity": "critical",
        "reason": "Network ACL default action changed from Deny to Allow. The storage account firewall is effectively disabled — all networks can now access this resource.",
        "gxp_impact": "The validated network perimeter is dissolved. Any network can reach the genomics storage account, vastly expanding the attack surface for regulated data.",
        "cfr_reference": "21 CFR Part 11.10(d) — Limiting system access to authorized individuals through operational system checks.",
        "remediation_suggestion": "Restore default network action to Deny. Re-add the validated subnet rules. Audit access logs for unauthorized network access.",
        "remediation_code": 'az storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --default-action Deny',
    },
]

# ── Watcher state ────────────────────────────────────────────────

_state = "CLEAN"       # CLEAN | DRIFTED
_pr_url: str | None = None
_pr_branch: str | None = None
_last_check: str | None = None
_last_error: str | None = None
_running = False


GITHUB_API = "https://api.github.com"


def _github_headers() -> dict:
    """Return authorization headers for GitHub REST API."""
    token = os.environ.get("GITHUB_TOKEN", "")
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
    }


def _fetch_file_content() -> str:
    """Fetch the watched file from GitHub and return its decoded content."""
    resp = requests.get(
        f"{GITHUB_API}/repos/{REPO}/contents/{WATCHED_FILE}",
        headers=_github_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    encoded = data["content"].replace("\n", "")
    return base64.b64decode(encoded).decode("utf-8")


def _create_fix_pr() -> dict:
    """Create a PR that overwrites the watched file with baseline content."""
    headers = _github_headers()
    fix_id = str(uuid.uuid4())[:8]
    branch_name = f"velira/auto-fix-{fix_id}"
    now = datetime.now(timezone.utc)
    timestamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. Get main branch SHA
    resp = requests.get(f"{GITHUB_API}/repos/{REPO}/git/ref/heads/main", headers=headers, timeout=30)
    resp.raise_for_status()
    main_sha = resp.json()["object"]["sha"]

    # 2. Create fix branch (delete if exists)
    requests.delete(f"{GITHUB_API}/repos/{REPO}/git/refs/heads/{branch_name}", headers=headers, timeout=30)

    resp = requests.post(
        f"{GITHUB_API}/repos/{REPO}/git/refs",
        headers=headers,
        json={"ref": f"refs/heads/{branch_name}", "sha": main_sha},
        timeout=30,
    )
    resp.raise_for_status()

    # 3. Get existing file SHA (needed for update)
    resp = requests.get(f"{GITHUB_API}/repos/{REPO}/contents/{WATCHED_FILE}", headers=headers, timeout=30)
    resp.raise_for_status()
    file_sha = resp.json()["sha"]

    # 4. Overwrite the file with baseline content on the fix branch
    encoded = base64.b64encode(BASELINE_CONTENT.encode()).decode()
    resp = requests.put(
        f"{GITHUB_API}/repos/{REPO}/contents/{WATCHED_FILE}",
        headers=headers,
        json={
            "message": f"velira: restore {WATCHED_FILE} to validated baseline v3.2 [{fix_id}]",
            "content": encoded,
            "sha": file_sha,
            "branch": branch_name,
        },
        timeout=30,
    )
    resp.raise_for_status()

    # 5. Open the PR
    pr_body = f"""\
## CRITICAL Drift Remediation

**Velira GxP Compliance Engine** detected that `{WATCHED_FILE}` has drifted from the validated baseline.

This PR restores the file to baseline v3.2 (validated 2025-11-15).

### What changed
The Terraform configuration for `genomics-data-storage-prod` was modified in a way that violates FDA 21 CFR Part 11 requirements. This PR overwrites the file with the validated baseline to restore compliance.

### Restored controls
- Public access disabled (`allow_nested_items_to_be_public = false`)
- TLS 1.2 minimum enforced
- HTTPS-only traffic enabled
- Network firewall default action set to Deny
- Encryption enabled via blob versioning

### Audit
- **Detected:** {timestamp}
- **Fix ID:** {fix_id}
- **Baseline:** v3.2

> Merge this PR to restore compliance. The Velira dashboard will update automatically.

*Generated by Velira GxP Compliance Engine*"""

    resp = requests.post(
        f"{GITHUB_API}/repos/{REPO}/pulls",
        headers=headers,
        json={
            "title": f"CRITICAL: Restore {WATCHED_FILE} to validated baseline",
            "body": pr_body,
            "head": branch_name,
            "base": "main",
        },
        timeout=30,
    )
    resp.raise_for_status()
    pr_data = resp.json()
    pr_url = pr_data.get("html_url", "")

    print(f"[watcher] PR created: {pr_url}")
    return {"pr_url": pr_url, "branch": branch_name, "fix_id": fix_id}


def _build_events(pr_url: str | None) -> list[dict]:
    """Build drift events from the hardcoded critical classifications."""
    now = datetime.now(timezone.utc).isoformat()
    events = []
    for tmpl in CRITICAL_EVENTS:
        event_id = str(uuid.uuid4())[:8]
        pr_obj = {"pr_url": pr_url, "pr_real": True} if pr_url else None
        events.append({
            "id": event_id,
            "timestamp": now,
            "resource_id": tmpl["resource_name"],
            "resource_type": tmpl["resource_type"],
            "attribute_path": tmpl["attribute_path"],
            "baseline_value": tmpl["baseline_value"],
            "current_value": tmpl["current_value"],
            "tier": tmpl["severity"],
            "reasoning": tmpl["reason"],
            "gxp_impact": tmpl["gxp_impact"],
            "regulation_reference": tmpl["cfr_reference"],
            "remediation_suggestion": tmpl["remediation_suggestion"],
            "remediation_code": tmpl["remediation_code"],
            "pr": pr_obj,
            "status": "open",
            # Legacy fields
            "resource_name": tmpl["resource_name"],
            "severity": tmpl["severity"],
            "reason": tmpl["reason"],
            "cfr_reference": tmpl["cfr_reference"],
            "pr_link": pr_url,
        })
    return events


def _build_status(events: list[dict]) -> dict:
    """Build the status dict for the store."""
    now_iso = datetime.now(timezone.utc).isoformat()
    counts = {"critical": 0, "suspicious": 0, "allowed": 0}
    for e in events:
        sev = e.get("severity", "suspicious")
        if sev in counts:
            counts[sev] += 1

    return {
        "state": "critical",
        "environment": "gxp-prod-eastus",
        "baseline_serial": "v3.2",
        "total_resources": 4,
        "compliant_resources": 3,
        "drifted_resources": 1,
        "risk_score": min(100, counts["critical"] * 25 + counts["suspicious"] * 10),
        "last_scan": now_iso,
        "last_updated": now_iso,
        "counts": counts,
        "summary": counts,
        "scenario": "critical",
    }


def _build_classifications(events: list[dict]) -> list[dict]:
    """Build classification dicts matching the store format."""
    classifications = []
    for e in events:
        classifications.append({
            "severity": e["severity"],
            "reason": e.get("reason", ""),
            "gxp_impact": e.get("gxp_impact", ""),
            "cfr_reference": e.get("cfr_reference", ""),
            "remediation_suggestion": e.get("remediation_suggestion", ""),
            "remediation_code": e.get("remediation_code", ""),
            "deviation": {
                "resource_name": e["resource_name"],
                "resource_type": e["resource_type"],
                "attribute_path": e["attribute_path"],
                "baseline_value": e["baseline_value"],
                "current_value": e["current_value"],
            },
        })
    return classifications


# ── Public API ───────────────────────────────────────────────────

async def run_watcher(store) -> None:
    """Main watcher loop. Call as an asyncio task."""
    global _state, _pr_url, _pr_branch, _last_check, _last_error, _running

    _running = True
    print(f"[watcher] Starting GitHub file watcher — repo={REPO} file={WATCHED_FILE}")
    print(f"[watcher] Polling every {POLL_INTERVAL}s")

    while True:
        try:
            await asyncio.sleep(POLL_INTERVAL)

            # Fetch file from GitHub (blocking call in executor to not block event loop)
            loop = asyncio.get_event_loop()
            content = await loop.run_in_executor(None, _fetch_file_content)
            _last_check = datetime.now(timezone.utc).isoformat()
            _last_error = None

            file_matches_baseline = content.strip() == BASELINE_CONTENT.strip()

            if _state == "CLEAN" and not file_matches_baseline:
                # CLEAN -> DRIFTED
                print("[watcher] DRIFT DETECTED — file differs from baseline")
                _state = "DRIFTED"

                # Create PR (in executor)
                try:
                    pr_result = await loop.run_in_executor(None, _create_fix_pr)
                    _pr_url = pr_result["pr_url"]
                    _pr_branch = pr_result["branch"]
                except Exception as e:
                    print(f"[watcher] PR creation failed: {e}")
                    _pr_url = None
                    _pr_branch = None

                # Build and inject events into the store
                events = _build_events(_pr_url)
                store.events = events
                store.status = _build_status(events)
                store.classifications = _build_classifications(events)
                store.current_scenario = "critical"

                print(f"[watcher] Injected {len(events)} critical events into store")
                if _pr_url:
                    print(f"[watcher] PR: {_pr_url}")

            elif _state == "DRIFTED" and file_matches_baseline:
                # DRIFTED -> CLEAN (PR was merged)
                print("[watcher] File restored to baseline — resetting to clean state")
                _state = "CLEAN"

                # Clean up the PR branch if it still exists
                if _pr_branch:
                    try:
                        await loop.run_in_executor(
                            None,
                            lambda: requests.delete(
                                f"{GITHUB_API}/repos/{REPO}/git/refs/heads/{_pr_branch}",
                                headers=_github_headers(),
                                timeout=30,
                            ),
                        )
                    except Exception:
                        pass

                _pr_url = None
                _pr_branch = None

                # Reset the store to clean state
                store.events = []
                store.classifications = []
                store.current_scenario = "compliant"
                now_iso = datetime.now(timezone.utc).isoformat()
                store.status = {
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
                    "scenario": "compliant",
                }
                store.audit_trail = []

                print("[watcher] Store reset — dashboard should show clean state")

        except asyncio.CancelledError:
            print("[watcher] Watcher stopped")
            _running = False
            raise
        except Exception as e:
            _last_error = str(e)
            print(f"[watcher] Error: {e}")
            # Continue polling — transient errors shouldn't kill the watcher


def stop_watcher() -> None:
    """Mark the watcher as stopped (task cancellation happens externally)."""
    global _running
    _running = False


def get_watcher_status() -> dict:
    """Return the current watcher state for the status endpoint."""
    return {
        "running": _running,
        "state": _state,
        "repo": REPO,
        "file": WATCHED_FILE,
        "poll_interval": POLL_INTERVAL,
        "pr_url": _pr_url,
        "pr_branch": _pr_branch,
        "last_check": _last_check,
        "last_error": _last_error,
    }


def reset_watcher_state() -> None:
    """Reset the watcher state machine back to CLEAN."""
    global _state, _pr_url, _pr_branch, _last_error
    _state = "CLEAN"
    _pr_url = None
    _pr_branch = None
    _last_error = None
