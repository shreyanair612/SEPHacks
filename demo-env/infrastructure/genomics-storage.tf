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

# VELIRA AUTO-REMEDIATION — 2026-03-01T15:51:55.452784+00:00
# Drift detected: properties.networkAcls.virtualNetworkRules[0].id changed from /subscriptions/a1b2c3d4/resourceGroups/gxp-prod/providers/Microsoft.Network/virtualNetworks/gxp-vnet/subnets/data-subnet to None
# Severity: CRITICAL
# Regulation: 21 CFR Part 11.10(a), 21 CFR Part 11.10(d)
# Action: Restore to GxP validated baseline v3.2
# Justification: The virtual network rule for the storage account was removed, leaving the resource without network restrictions. This compromises the confidentiality and integrity of the electronic records stored in 
