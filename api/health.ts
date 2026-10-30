import { json, handleOptions } from './_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  return json({ status: 'ok', timestamp: new Date().toISOString() })
}
