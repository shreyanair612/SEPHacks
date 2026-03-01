"""
Velira CosmosDB Client
Persists drift events and audit records to Azure Cosmos DB.
All functions handle a None client gracefully — they log and return
None/False/[] so the drift pipeline never crashes if CosmosDB is unavailable.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import uuid4

# ── Lazy client singleton ────────────────────────────────────────

COSMOS_ENDPOINT = os.environ.get("COSMOS_ENDPOINT", "")
COSMOS_KEY = os.environ.get("COSMOS_KEY", "")
COSMOS_DATABASE_NAME = os.environ.get("COSMOS_DATABASE_NAME", "velira")

DRIFT_EVENTS_CONTAINER = "drift-events"
AUDIT_TRAIL_CONTAINER = "audit-trail"

_client = None
_db = None
_drift_container = None
_audit_container = None
_initialized = False


def _init() -> bool:
    """Lazily initialize the CosmosDB client on first use."""
    global _client, _db, _drift_container, _audit_container, _initialized

    if _initialized:
        return _client is not None

    _initialized = True

    if not COSMOS_ENDPOINT or COSMOS_ENDPOINT == "PLACEHOLDER":
        print("[cosmos] COSMOS_ENDPOINT not set — CosmosDB persistence disabled")
        return False
    if not COSMOS_KEY or COSMOS_KEY == "PLACEHOLDER":
        print("[cosmos] COSMOS_KEY not set — CosmosDB persistence disabled")
        return False

    try:
        from azure.cosmos import CosmosClient, PartitionKey

        _client = CosmosClient(COSMOS_ENDPOINT, credential=COSMOS_KEY)
        _db = _client.create_database_if_not_exists(id=COSMOS_DATABASE_NAME)
        _drift_container = _db.create_container_if_not_exists(
            id=DRIFT_EVENTS_CONTAINER,
            partition_key=PartitionKey(path="/resource_id"),
        )
        _audit_container = _db.create_container_if_not_exists(
            id=AUDIT_TRAIL_CONTAINER,
            partition_key=PartitionKey(path="/resource_id"),
        )
        print(f"[cosmos] Connected to {COSMOS_ENDPOINT} / {COSMOS_DATABASE_NAME}")
        return True
    except Exception as e:
        print(f"[cosmos] Initialization failed: {e}")
        _client = None
        return False


# ── Section B: save_drift_event ──────────────────────────────────

def save_drift_event(event_dict: dict) -> bool:
    """Upsert a frontend-shaped drift event dict into CosmosDB."""
    if not _init():
        print("[cosmos] Skipping save_drift_event — client unavailable")
        return False

    try:
        pr = event_dict.get("pr") or {}
        doc = {
            "id": event_dict["id"],
            "resource_id": event_dict["resource_id"],
            "resource_type": event_dict.get("resource_type"),
            "attribute_path": event_dict.get("attribute_path"),
            "baseline_value": str(event_dict.get("baseline_value")),
            "current_value": str(event_dict.get("current_value")),
            "tier": event_dict.get("tier"),
            "severity": event_dict.get("severity"),
            "reasoning": event_dict.get("reasoning"),
            "gxp_impact": event_dict.get("gxp_impact"),
            "regulation_reference": event_dict.get("regulation_reference"),
            "cfr_reference": event_dict.get("cfr_reference"),
            "remediation_suggestion": event_dict.get("remediation_suggestion"),
            "remediation_code": event_dict.get("remediation_code", ""),
            "pr_url": pr.get("pr_url") or event_dict.get("pr_link"),
            "pr_real": pr.get("pr_real", False),
            "status": event_dict.get("status", "open"),
            "timestamp": event_dict.get("timestamp"),
            "detected_at": event_dict.get("timestamp"),
            "ttl": -1,
        }
        _drift_container.upsert_item(doc)
        print(f"[cosmos] Saved drift event {doc['id']} for {doc['resource_id']}")
        return True
    except Exception as e:
        print(f"[cosmos] save_drift_event failed: {e}")
        return False


# ── Section C: update_drift_event_pr ─────────────────────────────

def update_drift_event_pr(
    event_id: str, resource_id: str, pr_url: str, pr_real: bool = True
) -> bool:
    """Update an existing drift event with PR information."""
    if not _init():
        print("[cosmos] Skipping update_drift_event_pr — client unavailable")
        return False

    try:
        doc = _drift_container.read_item(item=event_id, partition_key=resource_id)
        doc["pr_url"] = pr_url
        doc["pr_real"] = pr_real
        doc["status"] = "pr_opened"
        _drift_container.upsert_item(doc)
        print(f"[cosmos] Updated event {event_id} with PR {pr_url}")
        return True
    except Exception as e:
        print(f"[cosmos] update_drift_event_pr failed: {e}")
        return False


# ── Section D: save_audit_record ─────────────────────────────────

def save_audit_record(record: dict) -> bool:
    """Upsert an audit trail record into CosmosDB."""
    if not _init():
        print("[cosmos] Skipping save_audit_record — client unavailable")
        return False

    try:
        doc = {
            "id": str(uuid4()),
            "resource_id": record.get("resource_id", "system"),
            "action_type": record.get("action_type"),
            "event_id": record.get("event_id"),
            "tier": record.get("tier"),
            "regulation_reference": record.get("regulation_reference"),
            "pr_url": record.get("pr_url"),
            "details": record.get("details", ""),
            "timestamp": record.get(
                "timestamp", datetime.now(timezone.utc).isoformat()
            ),
            "ttl": -1,
        }
        _audit_container.upsert_item(doc)
        print(f"[cosmos] Saved audit record {doc['action_type']} for {doc['resource_id']}")
        return True
    except Exception as e:
        print(f"[cosmos] save_audit_record failed: {e}")
        return False


# ── Section E: get_all_drift_events ──────────────────────────────

def get_all_drift_events(limit: int = 50) -> list[dict]:
    """Query all drift events, newest first."""
    if not _init():
        print("[cosmos] Skipping get_all_drift_events — client unavailable")
        return []

    try:
        query = (
            f"SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT {limit}"
        )
        items = list(
            _drift_container.query_items(query=query, enable_cross_partition_query=True)
        )
        print(f"[cosmos] Retrieved {len(items)} drift events")
        return items
    except Exception as e:
        print(f"[cosmos] get_all_drift_events failed: {e}")
        return []


# ── Section F: get_drift_event_by_id ─────────────────────────────

def get_drift_event_by_id(event_id: str) -> dict | None:
    """Look up a single drift event by its id."""
    if not _init():
        print("[cosmos] Skipping get_drift_event_by_id — client unavailable")
        return None

    try:
        query = f"SELECT * FROM c WHERE c.id = '{event_id}'"
        items = list(
            _drift_container.query_items(query=query, enable_cross_partition_query=True)
        )
        if items:
            print(f"[cosmos] Found event {event_id}")
            return items[0]
        print(f"[cosmos] Event {event_id} not found")
        return None
    except Exception as e:
        print(f"[cosmos] get_drift_event_by_id failed: {e}")
        return None


# ── Section G: get_audit_trail ───────────────────────────────────

def get_audit_trail(limit: int = 100) -> list[dict]:
    """Query audit trail records, newest first."""
    if not _init():
        print("[cosmos] Skipping get_audit_trail — client unavailable")
        return []

    try:
        query = (
            f"SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT {limit}"
        )
        items = list(
            _audit_container.query_items(query=query, enable_cross_partition_query=True)
        )
        print(f"[cosmos] Retrieved {len(items)} audit records")
        return items
    except Exception as e:
        print(f"[cosmos] get_audit_trail failed: {e}")
        return []
