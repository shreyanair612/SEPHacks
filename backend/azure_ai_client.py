"""
Azure AI Function client for Velira GxP classification.
POSTs drift context to an Azure Function and returns the AI response.
Falls back to None so callers can use cached responses.
"""

from __future__ import annotations

import os

import requests


AZURE_FUNCTION_URL = os.environ.get("AZURE_FUNCTION_URL", "")


def call_azure_ai(message: str) -> str | None:
    """
    POST a classification request to the Azure AI Function.

    Args:
        message: The formatted drift context to classify.

    Returns:
        The response text from the Azure Function, or None if the call fails
        (allowing the caller to fall back to cached responses).
    """
    if not AZURE_FUNCTION_URL:
        print("[Velira] AZURE_FUNCTION_URL not set — skipping Azure AI call")
        return None

    try:
        resp = requests.post(
            AZURE_FUNCTION_URL,
            json={"message": message},
            timeout=30,
        )
        resp.raise_for_status()
        text = resp.text.strip()
        if text:
            print("[Velira] Classification source: Azure AI Function")
            return text
        print("[Velira] Azure AI Function returned empty response — falling back")
        return None
    except requests.RequestException as e:
        print(f"[Velira] Azure AI Function call failed: {e} — falling back to cache")
        return None
