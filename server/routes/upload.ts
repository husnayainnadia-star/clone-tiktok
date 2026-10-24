import { Hono } from 'hono'
import { authMiddleware, requireAuth } from '../auth.js'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const router = new Hono()
router.use('*', authMiddleware)

// POST /api/upload
// Accepts a multipart/form-data with a "video" field.
// Saves to ./public/uploads/ and returns the public URL.
router.post('/', requireAuth, async (c) => {
  try {
    const formData = await c.req.formData()
    const videoFile = formData.get('video')

    if (!videoFile || typeof videoFile === 'string') {
      return c.json({ error: 'No video file provided' }, 400)
    }

    const file = videoFile as File
    const ext = file.name.split('.').pop() || 'mp4'
    const fileName = `${randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    // Ensure upload dir exists
    await mkdir(uploadDir, { recursive: true })

    // Write the file
    const buffer = await file.arrayBuffer()
    await writeFile(join(uploadDir, fileName), Buffer.from(buffer))

    const url = `/uploads/${fileName}`
    return c.json({ url })
  } catch (err) {
    console.error('Upload error:', err)
    return c.json({ error: 'Failed to save video' }, 500)
  }
})

export default router
