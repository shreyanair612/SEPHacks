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
# Drift detected: properties.securityRules[AllowPort8080].properties.sourceAddressPrefix changed from None to 172.16.0.0/12
# Severity: CRITICAL
# Regulation: 21 CFR Part 11.10(a)
# Action: Restore to GxP validated baseline v3.2
# Justification: The change allows traffic from the source address range 172.16.0.0/12 on port 8080, which was previously restricted. This introduces a potential security vulnerability by expanding access to the produ
