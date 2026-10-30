/**
 * backend.ts — tidak dipakai lagi.
 * Tidak ada backend server — koneksi langsung ke Neon.
 */

export function waitForBackend(): Promise<boolean> {
  return Promise.resolve(true)
}

export function isBackendAvailable(): boolean {
  return true
}

export function isProbeComplete(): boolean {
  return true
}
