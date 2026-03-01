/**
 * Pre-built mock responses for all 3 drift scenarios + compliant state.
 * Dashboard renders perfectly with these — no backend needed.
 */

import type { StatusResponse, EventsResponse } from "./types";

// ── Compliant state (all green) ─────────────────────────────────

export const compliantStatus: StatusResponse = {
  state: "compliant",
  environment: "gxp-prod-eastus",
  baseline_serial: "v3.2",
  total_resources: 4,
  compliant_resources: 4,
  drifted_resources: 0,
  risk_score: 0,
  last_scan: new Date().toISOString(),
  summary: { critical: 0, suspicious: 0, allowed: 0 },
  scenario: "compliant",
  classifications: [],
  resources: [
    { name: "genomics-data-storage-prod", type: "storageAccounts", status: "compliant", drift_count: 0, top_issue: null },
    { name: "pipeline-iam-roles", type: "roleAssignments", status: "compliant", drift_count: 0, top_issue: null },
    { name: "network-security-gxp", type: "networkSecurityGroups", status: "compliant", drift_count: 0, top_issue: null },
    { name: "gxp-pipeline-compute", type: "virtualMachines", status: "compliant", drift_count: 0, top_issue: null },
  ],
};

export const compliantEvents: EventsResponse = { events: [], total: 0 };

// ── Critical drift (the demo scenario) ──────────────────────────

const criticalTimestamp = new Date().toISOString();

export const criticalStatus: StatusResponse = {
  state: "critical",
  environment: "gxp-prod-eastus",
  baseline_serial: "v3.2",
  total_resources: 4,
  compliant_resources: 1,
  drifted_resources: 3,
  risk_score: 100,
  last_scan: criticalTimestamp,
  summary: { critical: 8, suspicious: 2, allowed: 1 },
  scenario: "critical",
  classifications: [],
  resources: [
    { name: "genomics-data-storage-prod", type: "storageAccounts", status: "critical", drift_count: 6, top_issue: "Encryption DISABLED on genomics data storage account" },
    { name: "pipeline-iam-roles", type: "roleAssignments", status: "critical", drift_count: 4, top_issue: "IAM role escalated from Contributor to Owner" },
    { name: "network-security-gxp", type: "networkSecurityGroups", status: "critical", drift_count: 3, top_issue: "SSH access opened to the entire internet" },
    { name: "gxp-pipeline-compute", type: "virtualMachines", status: "allowed", drift_count: 1, top_issue: "Compute instance vertically scaled" },
  ],
};

export const criticalEvents: EventsResponse = {
  total: 5,
  events: [
    {
      id: "evt-001",
      timestamp: criticalTimestamp,
      resource_name: "genomics-data-storage-prod",
      resource_type: "Microsoft.Storage/storageAccounts",
      attribute_path: "properties.encryption.services.blob.enabled",
      baseline_value: true,
      current_value: false,
      severity: "critical",
      reason: "Encryption DISABLED on genomics data storage account. Blob and file encryption services both set to disabled. This directly compromises the confidentiality and integrity of regulated electronic records stored in this account.",
      gxp_impact: "SEVERE \u2014 Direct violation of data integrity controls for electronic records. Genomics data stored without encryption is exposed to unauthorized access and potential tampering. All data written since the change may need integrity verification. This constitutes a reportable deviation.",
      cfr_reference: "21 CFR Part 11.10(a) \u2014 Validation of systems to ensure accuracy, reliability, consistent intended performance, and the ability to discern invalid or altered records.",
      remediation_suggestion: "IMMEDIATE ACTION REQUIRED: Re-enable encryption on the storage account. Audit all data access logs since the change. Verify data integrity of all records written during the unencrypted window. File a formal deviation report.",
      remediation_code: 'resource "azurerm_storage_account" "genomics_data" {\n  name                     = "genomicsdatastorageprod"\n  resource_group_name      = "gxp-prod"\n  location                 = "eastus"\n  account_tier             = "Standard"\n  account_replication_type = "GRS"\n\n  min_tls_version          = "TLS1_2"\n  enable_https_traffic_only = true\n\n  network_rules {\n    default_action = "Deny"\n  }\n}',
      pr_link: "https://github.com/velira-bio/gxp-infrastructure/pull/1042",
    },
    {
      id: "evt-002",
      timestamp: criticalTimestamp,
      resource_name: "genomics-data-storage-prod",
      resource_type: "Microsoft.Storage/storageAccounts",
      attribute_path: "properties.allowBlobPublicAccess",
      baseline_value: false,
      current_value: true,
      severity: "critical",
      reason: "Public blob access ENABLED on genomics data storage. Regulated electronic records are now accessible without authentication.",
      gxp_impact: "SEVERE \u2014 Regulated data is publicly accessible. Any electronic records in this storage account can be read by unauthenticated parties.",
      cfr_reference: "21 CFR Part 11.10(d) \u2014 Limiting system access to authorized individuals.",
      remediation_suggestion: "IMMEDIATE: Disable public blob access. Audit access logs for unauthorized reads.",
      remediation_code: 'az storage account update --name genomicsdatastorageprod --resource-group gxp-prod --allow-blob-public-access false',
      pr_link: "https://github.com/velira-bio/gxp-infrastructure/pull/1043",
    },
    {
      id: "evt-003",
      timestamp: criticalTimestamp,
      resource_name: "pipeline-iam-roles",
      resource_type: "Microsoft.Authorization/roleAssignments",
      attribute_path: "properties.roleDefinitionName",
      baseline_value: "Contributor",
      current_value: "Owner",
      severity: "critical",
      reason: "IAM role escalated from Contributor to Owner on the pipeline deployer service principal. Owner role grants full administrative access including the ability to modify access controls, delete resources, and alter audit configurations.",
      gxp_impact: "SEVERE \u2014 Separation of duties violation. The deployer can now modify its own permissions, delete audit trails, and alter validated system configurations without oversight.",
      cfr_reference: "21 CFR Part 11.10(d) \u2014 Limiting system access to authorized individuals. 21 CFR Part 11.10(e) \u2014 Audit trail integrity.",
      remediation_suggestion: "IMMEDIATE: Revert role assignment to Contributor. Investigate who made the change. Audit all actions taken with Owner privileges.",
      remediation_code: 'resource "azurerm_role_assignment" "pipeline_deployer" {\n  scope                = "/subscriptions/a1b2c3d4/resourceGroups/gxp-prod"\n  role_definition_name = "Contributor"\n  principal_id         = azurerm_user_assigned_identity.deployer.principal_id\n}',
      pr_link: "https://github.com/velira-bio/gxp-infrastructure/pull/1044",
    },
    {
      id: "evt-004",
      timestamp: criticalTimestamp,
      resource_name: "network-security-gxp",
      resource_type: "Microsoft.Network/networkSecurityGroups",
      attribute_path: "securityRules[AllowSSH].properties.sourceAddressPrefix",
      baseline_value: "10.0.0.0/8",
      current_value: "*",
      severity: "critical",
      reason: "SSH access opened to the entire internet (source: *). The validated baseline restricted SSH to the corporate VPN range (10.0.0.0/8). This exposes GxP systems to brute-force and unauthorized remote access attacks.",
      gxp_impact: "GxP production systems are directly accessible from any IP address via SSH. Critical access control failure.",
      cfr_reference: "21 CFR Part 11.10(d) \u2014 Limiting system access to authorized individuals.",
      remediation_suggestion: "IMMEDIATE: Restrict SSH source to corporate VPN CIDR (10.0.0.0/8). Audit SSH access logs.",
      remediation_code: 'az network nsg rule update --resource-group gxp-prod --nsg-name gxp-nsg-prod --name AllowSSH --source-address-prefixes "10.0.0.0/8"',
      pr_link: "https://github.com/velira-bio/gxp-infrastructure/pull/1045",
    },
    {
      id: "evt-005",
      timestamp: criticalTimestamp,
      resource_name: "gxp-pipeline-compute",
      resource_type: "Microsoft.Compute/virtualMachines",
      attribute_path: "properties.hardwareProfile.vmSize",
      baseline_value: "Standard_D2s_v3",
      current_value: "Standard_D4s_v3",
      severity: "allowed",
      reason: "Compute instance vertically scaled from Standard_D2s_v3 to Standard_D4s_v3. Routine capacity adjustment that does not alter the validated system's functional behavior.",
      gxp_impact: "No GxP impact. Instance scaling is an operational infrastructure change.",
      cfr_reference: "Not applicable \u2014 operational infrastructure scaling.",
      remediation_suggestion: "No remediation required. Document in change log.",
      remediation_code: "",
      pr_link: null,
    },
  ],
};

// ── Scenario map for the dashboard ──────────────────────────────

export const scenarios = {
  compliant: { status: compliantStatus, events: compliantEvents },
  critical: { status: criticalStatus, events: criticalEvents },
} as const;
