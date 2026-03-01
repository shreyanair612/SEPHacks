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

# VELIRA AUTO-REMEDIATION — 2026-03-01T14:51:20.114784+00:00
# Drift detected: encryption_enabled changed from true to false
# Severity: CRITICAL
# Regulation: 21 CFR Part 11.10(a)
# Action: Restore to GxP validated baseline v3.2
# Justification: Encryption disabled on genomics storage. This violates 21 CFR Part 11.10(a) which requires data integrity controls on all validated systems.
