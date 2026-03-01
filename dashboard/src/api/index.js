/**
 * Latch API Client
 * Centralized fetch wrappers for all backend endpoints.
 * All URLs go through API_BASE — no scattered /api/... strings elsewhere.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Internal helper — calls `fetch`, checks `response.ok`, returns parsed JSON.
 * @param {string} path - e.g. "/api/status"
 * @param {RequestInit} [opts]
 * @returns {Promise<any>}
 */
async function request(path, opts) {
  const res = await fetch(`${API_BASE}${path}`, opts)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Endpoints ──────────────────────────────────────────

/**
 * GET /api/status
 * @returns {Promise<{
 *   state: string,
 *   environment: string,
 *   risk_score: number,
 *   counts: { critical: number, suspicious: number, allowed: number },
 *   last_scan: string,
 *   last_updated: string,
 *   total_resources: number,
 *   compliant_resources: number,
 *   drifted_resources: number,
 *   classifications: Array,
 *   resources: Array
 * }>}
 */
export async function fetchStatus() {
  return request('/api/status')
}

/**
 * GET /api/events
 * @returns {Promise<Array<{
 *   id: string,
 *   timestamp: string,
 *   resource_id: string,
 *   resource_type: string,
 *   attribute_path: string,
 *   baseline_value: any,
 *   current_value: any,
 *   tier: "critical"|"suspicious"|"allowed",
 *   reasoning: string,
 *   gxp_impact: string,
 *   regulation_reference: string,
 *   remediation_suggestion: string,
 *   remediation_code: string,
 *   pr: { pr_url: string|null, pr_real: boolean }|null,
 *   status: "open"|"resolved",
 *   resource_name: string,
 *   severity: string,
 *   reason: string,
 *   cfr_reference: string,
 *   pr_link: string|null
 * }>>}
 */
export async function fetchEvents() {
  return request('/api/events')
}

/**
 * GET /api/events/:id
 * @param {string} id
 * @returns {Promise<Object>} Single drift event in the same shape as fetchEvents items.
 */
export async function fetchEventById(id) {
  return request(`/api/events/${encodeURIComponent(id)}`)
}

/**
 * GET /api/audit-trail
 * @returns {Promise<{
 *   entries: Array<{
 *     id: string,
 *     resource_id: string,
 *     action_type: string,
 *     event_id: string,
 *     tier: string|null,
 *     regulation_reference: string|null,
 *     pr_url: string|null,
 *     details: string,
 *     timestamp: string
 *   }>,
 *   total: number
 * }>}
 */
export async function fetchAuditTrail() {
  return request('/api/audit-trail')
}

/**
 * POST /api/trigger-drift
 * @param {"allowed"|"suspicious"|"critical"} scenario
 * @returns {Promise<{
 *   triggered: string,
 *   deviations_found: number,
 *   state: string,
 *   pr: { pr_url: string, real: boolean }|null
 * }>}
 */
export async function triggerDrift(scenario) {
  return request('/api/trigger-drift', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  })
}

// Legacy aliases used by existing imports (AppContext imports * as api)
export const getStatus = fetchStatus
export const getEvents = fetchEvents
