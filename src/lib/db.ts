/**
 * Neon database — koneksi langsung dari browser via HTTP transport
 * @neondatabase/serverless menggunakan WebSocket/HTTP, tidak perlu server terpisah
 */
import { neon } from '@neondatabase/serverless'

const databaseUrl = import.meta.env.VITE_DATABASE_URL as string

if (!databaseUrl) {
  console.warn('VITE_DATABASE_URL not set — database features will not work')
}

export const sql = databaseUrl ? neon(databaseUrl) : null
