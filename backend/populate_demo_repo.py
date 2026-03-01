"""One-shot script to populate the velira-demo-env repo with demo infrastructure files."""

from dotenv import load_dotenv
load_dotenv()

import base64
import json
import os
import requests

TOKEN = os.environ["GITHUB_TOKEN"]
OWNER = os.environ["GITHUB_REPO_OWNER"]
REPO = os.environ.get("GITHUB_REPO_NAME", "latch-demo-env")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

FILES = {
    "infrastructure/genomics-storage.tf": '''\
resource "azurerm_storage_account" "genomics_data" {
  name                     = "genomicsdatastprod"
  resource_group_name      = "biotech-prod-rg"
  location                 = "East US"
  account_tier             = "Standard"
  account_replication_type = "GRS"

  blob_properties {
    versioning_enabled = true
  }

  # GxP Validated Baseline - Config v3.2
  # FDA 21 CFR Part 11 compliant configuration
  min_tls_version          = "TLS1_2"
  enable_https_traffic_only = true

  tags = {
    environment     = "production"
    gxp_validated   = "true"
    baseline_version = "3.2"
    last_validated  = "2025-01-15"
  }
}
''',

    "infrastructure/network-security.tf": '''\
resource "azurerm_network_security_group" "pipeline_nsg" {
  name                = "genomics-pipeline-nsg"
  location            = "East US"
  resource_group_name = "biotech-prod-rg"

  # GxP Validated Baseline - only approved ports
  security_rule {
    name                       = "allow-https"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "10.0.0.0/8"
    destination_address_prefix = "*"
  }

  tags = {
    gxp_validated = "true"
    baseline_version = "3.2"
  }
}
''',

    "infrastructure/iam-roles.tf": '''\
resource "azurerm_role_assignment" "pipeline_reader" {
  scope                = azurerm_storage_account.genomics_data.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = var.pipeline_service_principal_id
}

resource "azurerm_role_assignment" "qa_manager" {
  scope                = azurerm_storage_account.genomics_data.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = var.qa_manager_principal_id
}
''',

    "configs/baseline-v3.2.json": json.dumps({
        "baseline_version": "3.2",
        "validated_date": "2025-01-15",
        "resources": {
            "genomics-data-storage-prod": {
                "encryption_enabled": True,
                "https_only": True,
                "min_tls_version": "TLS1_2",
                "public_access": False,
                "replication": "GRS",
            },
            "genomics-pipeline-nsg": {
                "allowed_ports": [443],
                "denied_ports": [22, 3389, 80],
                "source_restriction": "10.0.0.0/8",
            },
            "pipeline-iam": {
                "roles": ["Storage Blob Data Reader"],
                "mfa_required": True,
                "privileged_access_review": "quarterly",
            },
        },
    }, indent=2) + "\n",

    "README.md": """\
# Velira Demo Environment

Mock biotech production infrastructure repository used to demonstrate **GxP configuration drift detection** by [Velira](https://github.com/shreyanair612/latch-demo-env).

This repo represents an FDA 21 CFR Part 11 validated cloud environment. Velira monitors it for unauthorized configuration changes and auto-generates remediation PRs when critical drift is detected.

---

## Monitored Resources

| Resource | Type | Baseline |
|----------|------|----------|
| `genomics-data-storage-prod` | Azure Storage Account | Encryption enabled, HTTPS-only, TLS 1.2, public access disabled |
| `genomics-pipeline-nsg` | Network Security Group | Only port 443 allowed, source restricted to `10.0.0.0/8` |
| `pipeline-iam` | IAM Role Assignments | Reader-only access, MFA required, quarterly access review |

## How It Works

1. Velira continuously compares live infrastructure config against the validated baseline (`configs/baseline-v3.2.json`)
2. When drift is detected, it classifies the severity using Azure AI grounded in FDA regulations
3. For **critical** violations, Velira auto-generates a remediation PR targeting the affected Terraform file
4. QA managers review and merge the PR to restore GxP compliance

---

> Auto-generated PRs are created by the Velira GxP Compliance Engine.
""",
}


def create_or_update_file(path: str, content: str) -> None:
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{path}"

    # Check if file already exists (need its SHA to update)
    sha = None
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        sha = resp.json()["sha"]

    encoded = base64.b64encode(content.encode()).decode()
    body = {
        "message": f"velira: add {path}",
        "content": encoded,
    }
    if sha:
        body["sha"] = sha
        body["message"] = f"velira: update {path}"

    resp = requests.put(url, headers=HEADERS, json=body)
    if resp.status_code in (200, 201):
        print(f"  [OK] {path}")
    else:
        print(f"  [FAIL] {path} — {resp.status_code}: {resp.text[:200]}")


def main():
    print(f"Populating https://github.com/{OWNER}/{REPO} ...")
    for path, content in FILES.items():
        create_or_update_file(path, content)
    print(f"\nDone! https://github.com/{OWNER}/{REPO}")


if __name__ == "__main__":
    main()
