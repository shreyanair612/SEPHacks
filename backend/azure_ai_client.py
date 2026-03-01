"""
Azure AI Function client for Velira GxP classification.
POSTs drift context to an Azure Function and returns the AI response.
Falls back to None so callers can use cached responses.
"""

from __future__ import annotations

import os

import requests


AZURE_FUNCTION_URL = os.environ.get("AZURE_FUNCTION_URL", "")


def call_azure_ai(message: str, fda_context: str = "") -> str | None:
    """
    POST a classification request to the Azure AI Function.

    Args:
        message: The formatted drift context to classify.
        fda_context: Optional FDA regulatory passages from Azure AI Search.
            When provided, the message is augmented with regulatory context.

    Returns:
        The response text from the Azure Function, or None if the call fails
        (allowing the caller to fall back to cached responses).
    """
    if not AZURE_FUNCTION_URL:
        print("[Velira] AZURE_FUNCTION_URL not set — skipping Azure AI call")
        return None

    if fda_context:
        full_message = f"""You are a GxP compliance AI. Use the following FDA regulatory context to classify this drift event.

RELEVANT FDA REGULATIONS:
{fda_context}

DRIFT EVENT TO CLASSIFY:
{message}

Classify the severity (Critical/Suspicious/Allowed), cite the specific regulation, and explain the compliance risk in 2-3 sentences."""
    else:
        full_message = message

    try:
        resp = requests.post(
            AZURE_FUNCTION_URL,
            json={"message": full_message},
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
