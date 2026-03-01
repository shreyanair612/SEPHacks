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

# VELIRA AUTO-REMEDIATION — 2026-03-01T15:46:40.711439+00:00
# Drift detected: properties.conditionVersion changed from 2.0 to None
# Severity: CRITICAL
# Regulation: 21 CFR Part 11.10(d)
# Action: Restore to GxP validated baseline v3.2
# Justification: The removal of 'properties.conditionVersion' from the role assignment configuration eliminates conditional access controls, which are essential for ensuring system access is limited to authorized indi
