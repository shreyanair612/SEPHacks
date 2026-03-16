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

# VELIRA AUTO-REMEDIATION — 2026-03-01T15:51:55.452784+00:00
# Drift detected: properties.scope changed from /subscriptions/a1b2c3d4/resourceGroups/gxp-prod to /subscriptions/a1b2c3d4
# Severity: CRITICAL
# Regulation: 21 CFR Part 11.10(d)
# Action: Restore to GxP validated baseline v3.2
# Justification: The scope of the role assignment for pipeline-deployer has been expanded from a resource group level to the entire subscription. This change increases the risk of unauthorized access and compromises t
