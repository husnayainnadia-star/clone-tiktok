import { type DragEvent, type KeyboardEvent, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Video, X, Plus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { sql } from '../lib/db'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov']

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [hashtagInput, setHashtagInput] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [musicTitle, setMusicTitle] = useState('')
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileSelect = useCallback((selectedFile: File) => {
    setErrorMessage('')
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setErrorMessage('Pilih file video yang valid (MP4, WebM, MOV)')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage('Video harus lebih kecil dari 100 MB')
      return
    }
    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }, [handleFileSelect])

  const handleDragOver = (e: DragEvent) => e.preventDefault()

  const addHashtag = () => {
    const tag = hashtagInput.replace(/^#/, '').trim().toLowerCase()
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags(prev => [...prev, tag])
      setHashtagInput('')
    }
  }

  const removeHashtag = (tag: string) => setHashtags(prev => prev.filter(t => t !== tag))

  const handleHashtagKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault()
      addHashtag()
    }
  }

  const handlePublish = async () => {
    if (!user || !file) return

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      // Untuk video URL: pakai object URL sementara (untuk demo)
      // Di production: upload ke Cloudinary/R2/S3 dulu, lalu simpan URL-nya
      const videoUrl = previewUrl || URL.createObjectURL(file)
      setUploadProgress(50)

      if (!sql) {
        // Demo mode — simulasi tanpa DB
        for (let i = 50; i <= 100; i += 10) {
          await new Promise(r => setTimeout(r, 100))
          setUploadProgress(i)
        }
        setUploadStatus('success')
        return
      }

      // Simpan metadata video ke Neon
      await sql`
        INSERT INTO videos (user_id, video_url, caption, hashtags, music_title)
        VALUES (
          ${user.id},
          ${videoUrl},
          ${caption || null},
          ${hashtags},
          ${musicTitle || '♫ Original Sound'}
        )
      `

      setUploadProgress(100)
      setUploadStatus('success')
    } catch (err) {
      setUploadStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Upload gagal')
    }
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-reel-darker px-4">
        <div className="text-4xl">🔒</div>
        <h2 className="font-bold text-xl">Masuk untuk upload</h2>
        <p className="text-reel-text-muted text-sm text-center">
          Buat akun atau masuk untuk berbagi video.
        </p>
        <button onClick={() => navigate('/auth')} className="btn-primary">Masuk</button>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto hide-scrollbar bg-reel-darker pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-reel-darker/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base flex-1">Upload Video</h1>
        {file && uploadStatus === 'idle' && (
          <button onClick={handlePublish} className="btn-primary py-1.5 px-4 text-sm">
            Publish
          </button>
        )}
      </div>

      <div className="px-4 py-4 space-y-5 max-w-lg mx-auto">

        {/* Drop zone */}
        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:border-reel-pink/50 hover:bg-reel-pink/5 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Video size={28} className="text-reel-text-muted" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Pilih atau drag video</p>
              <p className="text-sm text-reel-text-muted mt-1">MP4, WebM, atau MOV · Maks 100 MB</p>
            </div>
            <div className="flex items-center gap-2 bg-reel-pink/10 border border-reel-pink/30 rounded-full px-4 py-2">
              <Upload size={16} className="text-reel-pink" />
              <span className="text-sm text-reel-pink font-medium">Pilih file</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              aria-label="Pilih file video"
            />
          </div>
        ) : (
          <div className="relative aspect-[9/16] max-h-72 w-full rounded-2xl overflow-hidden bg-black">
            <video src={previewUrl!} className="w-full h-full object-contain" controls muted playsInline />
            <button
              onClick={() => { setFile(null); setPreviewUrl(null) }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Hapus video"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-reel-text-muted">Mengupload…</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-reel-pink to-reel-cyan rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle size={48} className="text-green-400" />
            <h3 className="font-bold text-lg">Video berhasil dipublish!</h3>
            <p className="text-reel-text-muted text-sm text-center">
              Video kamu sudah live dan siap ditemukan.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary">Ke Feed</button>
          </div>
        )}

        {file && uploadStatus === 'idle' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Deskripsikan videomu…"
                className="input-field min-h-[80px] resize-none"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-reel-text-muted text-right mt-1">{caption.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hashtag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={e => setHashtagInput(e.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  placeholder="#hashtag"
                  className="input-field flex-1 text-sm"
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={addHashtag}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                  aria-label="Tambah hashtag"
                >
                  <Plus size={18} />
                </button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {hashtags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-reel-cyan/10 border border-reel-cyan/20 text-reel-cyan rounded-full px-3 py-1 text-sm"
                    >
                      #{tag}
                      <button onClick={() => removeHashtag(tag)} aria-label={`Hapus #${tag}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Judul musik / audio</label>
              <input
                type="text"
                value={musicTitle}
                onChange={e => setMusicTitle(e.target.value)}
                placeholder="♫ Original Sound"
                className="input-field text-sm"
                maxLength={100}
              />
            </div>

            <button onClick={handlePublish} className="btn-primary w-full">
              Publish Video
            </button>
          </>
        )}
      </div>
    </div>
  )
}
