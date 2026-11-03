/**
 * Neon database — koneksi langsung dari browser via HTTP transport
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Coba semua kemungkinan nama env var
const databaseUrl =
  import.meta.env.VITE_DATABASE_URL ||
  import.meta.env.VITE_NEON_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  ''

if (!databaseUrl) {
  console.error(
    '[Reelz] Database URL tidak ditemukan.\n' +
    'Tambahkan VITE_DATABASE_URL di:\n' +
    '- .env.local (untuk development)\n' +
    '- Vercel Environment Variables (untuk production)'
  )
}

// Log untuk debug (akan muncul di browser console)
console.log('[Reelz] DB URL ada:', !!databaseUrl)

export const sql: NeonQueryFunction<false, false> | null = databaseUrl
  ? neon(databaseUrl)
  : null

export const isDbConnected = !!databaseUrl
