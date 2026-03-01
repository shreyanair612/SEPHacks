"""
Velira GxP Classification Engine
Classifies configuration drift through an FDA 21 CFR Part 11 compliance lens.
Uses Azure OpenAI when available, falls back to cached responses.
"""

from __future__ import annotations

import json
import os
from typing import Any

from models import Deviation, DriftClassification, DriftSeverity
from cached_responses import get_cached_classification

# Azure OpenAI config — placeholders until Shreya provides credentials
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_KEY = os.environ.get("AZURE_OPENAI_KEY", "")
AZURE_OPENAI_DEPLOYMENT = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
AZURE_OPENAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

GXP_SYSTEM_PROMPT = """You are Velira, an FDA compliance AI engine specialized in GxP cloud configuration drift analysis.

Your role: Classify configuration changes detected in a biotech company's FDA-validated cloud environment.

Classification tiers:
- CRITICAL: Changes that directly violate 21 CFR Part 11 requirements or compromise data integrity, access controls, audit trail integrity, or electronic record security. Requires immediate remediation and formal deviation reporting.
- SUSPICIOUS: Changes that don't directly violate regulations but alter the validated security posture in ways that require investigation. May need change control documentation.
- ALLOWED: Routine operational changes (scaling, maintenance) that don't affect the validated state's security, data integrity, or compliance posture.

For each drift, provide:
1. severity: "critical", "suspicious", or "allowed"
2. reason: Plain-English explanation of what changed and why it matters
3. gxp_impact: Specific impact on GxP compliance and validated system integrity
4. cfr_reference: The specific 21 CFR Part 11 section(s) that apply
5. remediation_suggestion: Concrete steps to remediate (for critical/suspicious)
6. remediation_code: Infrastructure-as-code fix (Terraform or Azure CLI)

Always ground your analysis in actual FDA regulation text. Be specific about which subsection applies and why."""

GXP_USER_PROMPT_TEMPLATE = """Classify this configuration drift detected in a GxP-validated Azure environment:

Resource: {resource_name} ({resource_type})
Resource ID: {resource_id}
Attribute Changed: {attribute_path}
Baseline Value (FDA-validated): {baseline_value}
Current Live Value: {current_value}
Detected At: {detected_at}

Environment: gxp-prod-eastus (FDA-validated production)
Baseline Serial: v3.2 (validated 2025-11-15)

Respond in JSON format:
{{
  "severity": "critical|suspicious|allowed",
  "reason": "...",
  "gxp_impact": "...",
  "cfr_reference": "...",
  "remediation_suggestion": "...",
  "remediation_code": "..."
}}"""


def _classify_with_openai(deviation: Deviation) -> dict | None:
    """Call Azure OpenAI for classification. Returns None if unavailable."""
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY:
        return None

    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
        )

        user_prompt = GXP_USER_PROMPT_TEMPLATE.format(
            resource_name=deviation.resource_name,
            resource_type=deviation.resource_type,
            resource_id=deviation.resource_id,
            attribute_path=deviation.attribute_path,
            baseline_value=deviation.baseline_value,
            current_value=deviation.current_value,
            detected_at=deviation.detected_at,
        )

        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": GXP_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1000,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if content:
            return json.loads(content)
    except Exception as e:
        print(f"[Velira] OpenAI classification failed: {e} — falling back to cache")

    return None


def _classify_with_cache(deviation: Deviation) -> dict | None:
    """Look up classification from pre-cached responses."""
    # Extract the meaningful part of the attribute path
    attr = deviation.attribute_path.replace("properties.", "")
    return get_cached_classification(attr, deviation.baseline_value, deviation.current_value)


def _default_classification(deviation: Deviation) -> dict:
    """Fallback classification when both OpenAI and cache miss."""
    return {
        "severity": "suspicious",
        "reason": f"Unclassified drift on {deviation.resource_name}: {deviation.attribute_path} changed from {deviation.baseline_value} to {deviation.current_value}",
        "gxp_impact": "Unknown — requires manual review by QA team",
        "cfr_reference": "21 CFR Part 11.10 — General controls for closed systems",
        "remediation_suggestion": "Investigate the change and determine if formal change control is required",
        "remediation_code": "",
    }


def classify_deviation(deviation: Deviation) -> DriftClassification:
    """
    Classify a single deviation. Tries Azure OpenAI first,
    falls back to cached responses, then to default classification.
    """
    # Try OpenAI first
    result = _classify_with_openai(deviation)

    # Fall back to cache
    if result is None:
        result = _classify_with_cache(deviation)

    # Final fallback
    if result is None:
        result = _default_classification(deviation)

    severity_map = {
        "critical": DriftSeverity.CRITICAL,
        "suspicious": DriftSeverity.SUSPICIOUS,
        "allowed": DriftSeverity.ALLOWED,
    }

    return DriftClassification(
        deviation=deviation,
        severity=severity_map.get(result["severity"], DriftSeverity.SUSPICIOUS),
        reason=result["reason"],
        gxp_impact=result["gxp_impact"],
        cfr_reference=result["cfr_reference"],
        remediation_suggestion=result["remediation_suggestion"],
        remediation_code=result.get("remediation_code", ""),
    )


def classify_all(deviations: list[Deviation]) -> list[DriftClassification]:
    """Classify a list of deviations."""
    return [classify_deviation(d) for d in deviations]


def get_overall_severity(classifications: list[DriftClassification]) -> str:
    """Determine overall environment state from classifications."""
    if any(c.severity == DriftSeverity.CRITICAL for c in classifications):
        return "critical"
    if any(c.severity == DriftSeverity.SUSPICIOUS for c in classifications):
        return "warning"
    return "compliant"


if __name__ == "__main__":
    # Test with a sample deviation
    dev = Deviation(
        resource_id="test",
        resource_name="genomics-data-storage-prod",
        resource_type="Microsoft.Storage/storageAccounts",
        attribute_path="properties.encryption.services.blob.enabled",
        baseline_value=True,
        current_value=False,
    )
    result = classify_deviation(dev)
    print(f"Severity: {result.severity.value}")
    print(f"Reason: {result.reason}")
    print(f"CFR: {result.cfr_reference}")
    print(f"Source: cached (no Azure credentials)")
