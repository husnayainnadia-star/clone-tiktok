/**
 * Backend availability detection.
 * Probe /api/health saat app pertama load.
 * Hasil dicache agar tidak re-fetch setiap render.
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

type Status = 'unknown' | 'available' | 'unavailable'

let status: Status = 'unknown'
let resolvePromise: (v: boolean) => void
const readyPromise = new Promise<boolean>(r => { resolvePromise = r })

async function probe(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    status = res.ok ? 'available' : 'unavailable'
  } catch {
    status = 'unavailable'
  }
  resolvePromise(status === 'available')
}

probe()

export function waitForBackend(): Promise<boolean> {
  return readyPromise
}

export function isBackendAvailable(): boolean {
  return status === 'available'
}

export function isProbeComplete(): boolean {
  return status !== 'unknown'
}
