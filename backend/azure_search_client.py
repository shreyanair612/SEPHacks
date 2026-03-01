"""
Azure AI Search client for Velira.
Searches the FDA regulations index and returns relevant passages
to augment GxP drift classification with real regulatory context.
"""

from __future__ import annotations

import os

import requests


AZURE_SEARCH_ENDPOINT = os.environ.get("AZURE_SEARCH_ENDPOINT", "")
AZURE_SEARCH_API_KEY = os.environ.get("AZURE_SEARCH_API_KEY", "")
AZURE_SEARCH_INDEX_NAME = os.environ.get("AZURE_SEARCH_INDEX_NAME", "")

HARDCODED_FDA_CONTEXT = (
    "21 CFR Part 11.10(a): Electronic records systems must employ procedures "
    "and controls to ensure authenticity, integrity, and confidentiality.\n\n"
    "---\n\n"
    "21 CFR Part 11.10(d): Limiting system access to authorized individuals.\n\n"
    "---\n\n"
    "21 CFR Part 11.10(e): Use of secure, computer-generated, time-stamped "
    "audit trails to record operator actions that create, modify, or delete "
    "electronic records.\n\n"
    "---\n\n"
    "21 CFR Part 11.30: Open systems must employ encryption and digital "
    "signature standards.\n\n"
    "---\n\n"
    "21 CFR Part 11.300: Controls for identification codes and passwords must "
    "ensure uniqueness and periodic revision."
)


def _extract_passages(response_json: dict) -> str:
    """Pull content from search results and join with separators."""
    docs = response_json.get("value", [])
    passages = [doc["content"] for doc in docs if doc.get("content")]
    return "\n\n---\n\n".join(passages)


def search_fda_regulations(drift_summary: str) -> tuple[str, str]:
    """
    Search the FDA regulations index for passages relevant to a drift event.

    Returns:
        (passages_string, source_label) where source_label is one of:
        "azure-search", "azure-search-simple-fallback", "hardcoded-fallback"
    """
    if not AZURE_SEARCH_ENDPOINT or not AZURE_SEARCH_API_KEY or not AZURE_SEARCH_INDEX_NAME:
        print("[azure_search] Missing env vars — using hardcoded FDA context")
        return HARDCODED_FDA_CONTEXT, "hardcoded-fallback"

    search_url = (
        f"{AZURE_SEARCH_ENDPOINT}/indexes/{AZURE_SEARCH_INDEX_NAME}"
        f"/docs/search?api-version=2023-11-01"
    )
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_SEARCH_API_KEY,
    }

    # --- Attempt 1: Semantic search ---
    semantic_body = {
        "search": drift_summary,
        "queryType": "semantic",
        "semanticConfiguration": "default",
        "top": 3,
        "select": "content,title",
    }

    try:
        print(f"[azure_search] Semantic search: {drift_summary[:80]}...")
        resp = requests.post(search_url, headers=headers, json=semantic_body, timeout=10)

        if resp.status_code == 200:
            passages = _extract_passages(resp.json())
            if passages:
                print(f"[azure_search] Semantic search returned {len(resp.json().get('value', []))} results")
                return passages, "azure-search"
            print("[azure_search] Semantic search returned 0 results — trying simple")
        else:
            print(f"[azure_search] Semantic search returned {resp.status_code} — trying simple")

    except requests.exceptions.Timeout:
        print("[azure_search] Semantic search timed out — trying simple")
    except requests.exceptions.RequestException as e:
        print(f"[azure_search] Semantic search failed: {e} — trying simple")

    # --- Attempt 2: Simple search ---
    simple_body = {
        "search": drift_summary,
        "queryType": "simple",
        "top": 3,
        "select": "content,title",
    }

    try:
        print("[azure_search] Falling back to simple search")
        resp = requests.post(search_url, headers=headers, json=simple_body, timeout=10)
        resp.raise_for_status()

        passages = _extract_passages(resp.json())
        if passages:
            print(f"[azure_search] Simple search returned {len(resp.json().get('value', []))} results")
            return passages, "azure-search-simple-fallback"
        print("[azure_search] Simple search returned 0 results — using hardcoded")

    except requests.exceptions.Timeout:
        print("[azure_search] Simple search timed out — using hardcoded")
    except requests.exceptions.RequestException as e:
        print(f"[azure_search] Simple search failed: {e} — using hardcoded")
    except KeyError as e:
        print(f"[azure_search] Unexpected response format: {e} — using hardcoded")
    except Exception as e:
        print(f"[azure_search] Unexpected error: {e} — using hardcoded")

    # --- Attempt 3: Hardcoded fallback ---
    print("[azure_search] Using hardcoded FDA context")
    return HARDCODED_FDA_CONTEXT, "hardcoded-fallback"
