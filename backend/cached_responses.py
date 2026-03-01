"""
Pre-cached GxP classification responses for all 3 drift scenarios.
These are used when Azure OpenAI is unavailable (no credentials or API down).
Responses mirror exactly what GPT-4o would return with our GxP prompt.
"""

CACHED_CLASSIFICATIONS: dict[str, dict] = {
    # --- ALLOWED: VM instance scaling ---
    "hardwareProfile.vmSize|Standard_D2s_v3|Standard_D4s_v3": {
        "severity": "allowed",
        "reason": "Compute instance vertically scaled from Standard_D2s_v3 to Standard_D4s_v3. This is a routine capacity adjustment that does not alter the validated system's functional behavior, data handling, or security posture.",
        "gxp_impact": "No GxP impact. Instance scaling is an operational infrastructure change that does not modify validated application logic, data integrity controls, or electronic record handling. The system's intended use and validated state remain unchanged.",
        "cfr_reference": "Not applicable — operational infrastructure scaling is outside the scope of 21 CFR Part 11 controls.",
        "remediation_suggestion": "No remediation required. Document the scaling event in the change log per standard operational procedures. No formal change control needed.",
        "remediation_code": "",
    },

    # --- SUSPICIOUS: New NSG rule on port 8080 from private range ---
    "AllowPort8080|None|present": {
        "severity": "suspicious",
        "reason": "New inbound network security rule added allowing TCP port 8080 from private address range 172.16.0.0/12. While the source is restricted to a private range, this opens a new network path to GxP systems that was not part of the validated baseline configuration.",
        "gxp_impact": "Potential impact on system access controls. The additional network path could allow unauthorized internal access to validated systems. While not immediately critical (source is private), this represents an uncontrolled change to the network security perimeter of the validated environment.",
        "cfr_reference": "21 CFR Part 11.10(d) — Limiting system access to authorized individuals. New network access paths must be evaluated for their impact on system access controls.",
        "remediation_suggestion": "Investigate the business justification for port 8080 access. If required for validated operations, submit a formal change control request documenting the need, risk assessment, and approval. If unauthorized, remove the rule immediately.",
        "remediation_code": '# Remove unauthorized NSG rule\naz network nsg rule delete \\\n  --resource-group gxp-prod \\\n  --nsg-name gxp-nsg-prod \\\n  --name AllowPort8080',
    },

    # --- CRITICAL: Encryption disabled on genomics storage ---
    "encryption.services.blob.enabled|True|False": {
        "severity": "critical",
        "reason": "Encryption DISABLED on genomics data storage account. Blob and file encryption services both set to disabled. This directly compromises the confidentiality and integrity of regulated electronic records stored in this account.",
        "gxp_impact": "SEVERE — Direct violation of data integrity controls for electronic records. Genomics data stored without encryption is exposed to unauthorized access and potential tampering. All data written since the change may need integrity verification. This constitutes a reportable deviation.",
        "cfr_reference": "21 CFR Part 11.10(a) — Validation of systems to ensure accuracy, reliability, consistent intended performance, and the ability to discern invalid or altered records. 21 CFR Part 11.10(c) — Protection of records to enable their accurate and ready retrieval.",
        "remediation_suggestion": "IMMEDIATE ACTION REQUIRED: Re-enable encryption on the storage account. Audit all data access logs since the change. Verify data integrity of all records written during the unencrypted window. File a formal deviation report.",
        "remediation_code": '# CRITICAL: Restore encryption on genomics storage\nresource "azurerm_storage_account" "genomics_data" {\n  name                     = "genomicsdatastorageprod"\n  resource_group_name      = "gxp-prod"\n  location                 = "eastus"\n  account_tier             = "Standard"\n  account_replication_type = "GRS"\n\n  # RESTORED: Encryption must be enabled for GxP compliance\n  blob_properties {\n    versioning_enabled = true\n  }\n\n  # Enforce HTTPS and TLS 1.2\n  min_tls_version          = "TLS1_2"\n  enable_https_traffic_only = true\n\n  network_rules {\n    default_action = "Deny"\n    virtual_network_subnet_ids = [\n      azurerm_subnet.data_subnet.id\n    ]\n  }\n}',
    },

    # --- CRITICAL: Public access enabled ---
    "allowBlobPublicAccess|False|True": {
        "severity": "critical",
        "reason": "Public blob access ENABLED on genomics data storage. Regulated electronic records are now accessible without authentication. This is a catastrophic security configuration change on a validated system.",
        "gxp_impact": "SEVERE — Regulated data is publicly accessible. Any electronic records in this storage account can be read by unauthenticated parties. This violates access control requirements and may constitute a data breach of regulated information.",
        "cfr_reference": "21 CFR Part 11.10(d) — Limiting system access to authorized individuals. 21 CFR Part 11.10(g) — Use of authority checks to ensure only authorized individuals can use the system.",
        "remediation_suggestion": "IMMEDIATE: Disable public blob access. Audit access logs for unauthorized reads. Assess whether any regulated data was exposed. File deviation report and notify QA.",
        "remediation_code": '# Disable public access immediately\naz storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --allow-blob-public-access false',
    },

    # --- CRITICAL: TLS downgrade ---
    "minimumTlsVersion|TLS1_2|TLS1_0": {
        "severity": "critical",
        "reason": "TLS minimum version downgraded from TLS 1.2 to TLS 1.0 on genomics storage. TLS 1.0 has known cryptographic weaknesses and is deprecated. This exposes data in transit to interception.",
        "gxp_impact": "Data in transit to/from validated storage is vulnerable to man-in-the-middle attacks. Electronic records transmitted over TLS 1.0 cannot be guaranteed to be unaltered.",
        "cfr_reference": "21 CFR Part 11.10(a) — Systems must ensure accuracy and reliability. 21 CFR Part 11.30 — Open system controls including encryption of records.",
        "remediation_suggestion": "Restore minimum TLS version to 1.2. Audit recent connections for any TLS 1.0 usage. Verify no data was intercepted during the downgrade window.",
        "remediation_code": 'az storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --min-tls-version TLS1_2',
    },

    # --- CRITICAL: HTTPS-only disabled ---
    "supportsHttpsTrafficOnly|True|False": {
        "severity": "critical",
        "reason": "HTTPS-only traffic enforcement disabled. The storage account now accepts unencrypted HTTP connections, allowing regulated data to be transmitted in plaintext.",
        "gxp_impact": "Electronic records can be transmitted without encryption, violating data integrity and confidentiality requirements for validated systems.",
        "cfr_reference": "21 CFR Part 11.30 — Controls for open systems must include encryption of records.",
        "remediation_suggestion": "Re-enable HTTPS-only enforcement immediately.",
        "remediation_code": 'az storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --https-only true',
    },

    # --- CRITICAL: Network ACL default allow ---
    "networkAcls.defaultAction|Deny|Allow": {
        "severity": "critical",
        "reason": "Network ACL default action changed from Deny to Allow. The storage account firewall is effectively disabled — all networks can now access this resource.",
        "gxp_impact": "The validated network perimeter is dissolved. Any network can reach the genomics storage account, vastly expanding the attack surface for regulated data.",
        "cfr_reference": "21 CFR Part 11.10(d) — Limiting system access to authorized individuals through operational system checks.",
        "remediation_suggestion": "Restore default network action to Deny. Re-add the validated subnet rules. Audit access logs for unauthorized network access.",
        "remediation_code": 'az storage account update \\\n  --name genomicsdatastorageprod \\\n  --resource-group gxp-prod \\\n  --default-action Deny',
    },

    # --- CRITICAL: IAM role escalation ---
    "roleDefinitionName|Contributor|Owner": {
        "severity": "critical",
        "reason": "IAM role escalated from Contributor to Owner on the pipeline deployer service principal. Owner role grants full administrative access including the ability to modify access controls, delete resources, and alter audit configurations.",
        "gxp_impact": "SEVERE — Separation of duties violation. The deployer can now modify its own permissions, delete audit trails, and alter validated system configurations without oversight. This fundamentally undermines the access control framework.",
        "cfr_reference": "21 CFR Part 11.10(d) — Limiting system access to authorized individuals. 21 CFR Part 11.10(e) — Use of secure, computer-generated, time-stamped audit trails. Owner access allows audit trail modification.",
        "remediation_suggestion": "IMMEDIATE: Revert role assignment to Contributor. Investigate who made the change and when. Audit all actions taken with Owner privileges. File deviation report. Review and strengthen PIM/JIT access policies.",
        "remediation_code": '# Revert role escalation\nresource "azurerm_role_assignment" "pipeline_deployer" {\n  scope                = "/subscriptions/a1b2c3d4/resourceGroups/gxp-prod"\n  role_definition_name = "Contributor"  # RESTORED from Owner\n  principal_id         = azurerm_user_assigned_identity.deployer.principal_id\n\n  # Condition: Block self-escalation\n  condition            = "((!(ActionMatches{\'Microsoft.Authorization/roleAssignments/write\'}))"\n  condition_version    = "2.0"\n}',
    },

    # --- CRITICAL: SSH open to internet ---
    "securityRules[AllowSSH].properties.sourceAddressPrefix|10.0.0.0/8|*": {
        "severity": "critical",
        "reason": "SSH access opened to the entire internet (source: *). The validated baseline restricted SSH to the corporate VPN range (10.0.0.0/8). This exposes GxP systems to brute-force and unauthorized remote access attacks.",
        "gxp_impact": "GxP production systems are directly accessible from any IP address via SSH. This is a critical access control failure that could allow unauthorized system modification.",
        "cfr_reference": "21 CFR Part 11.10(d) — Limiting system access to authorized individuals. 21 CFR Part 11.10(a) — Validation of systems to ensure consistent intended performance.",
        "remediation_suggestion": "IMMEDIATE: Restrict SSH source to corporate VPN CIDR (10.0.0.0/8). Audit SSH access logs for unauthorized connections. Consider replacing SSH with Azure Bastion for audited access.",
        "remediation_code": 'az network nsg rule update \\\n  --resource-group gxp-prod \\\n  --nsg-name gxp-nsg-prod \\\n  --name AllowSSH \\\n  --source-address-prefixes "10.0.0.0/8"',
    },

    # --- CRITICAL: Scope escalation ---
    "scope|/subscriptions/a1b2c3d4/resourceGroups/gxp-prod|/subscriptions/a1b2c3d4": {
        "severity": "critical",
        "reason": "Role assignment scope escalated from resource group level to entire subscription. The deployer now has permissions across ALL resource groups, not just the GxP production environment.",
        "gxp_impact": "Blast radius of the service principal expanded beyond the validated environment boundary. Actions in non-validated resource groups could impact shared infrastructure.",
        "cfr_reference": "21 CFR Part 11.10(d) — Access must be limited to the scope necessary for authorized functions.",
        "remediation_suggestion": "Restore scope to resource group level. Audit cross-resource-group actions. Implement Azure Policy to prevent subscription-level role assignments.",
        "remediation_code": '# Scope the role assignment back to resource group\naz role assignment create \\\n  --assignee $DEPLOYER_PRINCIPAL_ID \\\n  --role "Contributor" \\\n  --scope "/subscriptions/a1b2c3d4/resourceGroups/gxp-prod"',
    },
}


def get_cached_classification(attribute_path: str, baseline_value, current_value) -> dict | None:
    """Look up a cached classification by attribute path and values."""
    # Try exact match first
    key = f"{attribute_path}|{baseline_value}|{current_value}"
    if key in CACHED_CLASSIFICATIONS:
        return CACHED_CLASSIFICATIONS[key]

    # Try partial match on the attribute path suffix
    for cached_key, response in CACHED_CLASSIFICATIONS.items():
        cached_attr = cached_key.split("|")[0]
        if attribute_path.endswith(cached_attr) or cached_attr in attribute_path:
            cached_bval = cached_key.split("|")[1]
            cached_cval = cached_key.split("|")[2]
            if str(baseline_value) == cached_bval and str(current_value) == cached_cval:
                return response

    return None
