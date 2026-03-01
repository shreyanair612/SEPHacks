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
