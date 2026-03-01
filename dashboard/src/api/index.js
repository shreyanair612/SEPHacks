const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function safeFetch(path, opts){
  const url = `${API_BASE}${path}`
  try {
    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err){
    throw err
  }
}

export async function getStatus(){
  return await safeFetch('/api/status')
}

export async function getEvents(){
  return await safeFetch('/api/events')
}

export async function triggerDrift(scenario){
  return await safeFetch('/api/trigger-drift', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ scenario })
  })
}
