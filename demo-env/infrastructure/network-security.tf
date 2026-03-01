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

# VELIRA AUTO-REMEDIATION — 2026-03-01T15:50:18.156653+00:00
# Drift detected: properties.securityRules[AllowPort8080].name changed from None to AllowPort8080
# Severity: CRITICAL
# Regulation: 21 CFR Part 11.10(a), 21 CFR Part 11.10(d)
# Action: Restore to GxP validated baseline v3.2
# Justification: A new security rule allowing traffic on port 8080 was added to the FDA-validated network security group, which was not part of the validated baseline. This change could expose the system to unauthoriz
