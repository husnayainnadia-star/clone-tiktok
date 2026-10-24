import { type DragEvent, type KeyboardEvent, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Video, X, Plus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { videosApi } from '../lib/api'
import { isBackendAvailable } from '../lib/backend'

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
      setErrorMessage('Please select a valid video file (MP4, WebM, MOV)')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage('Video must be smaller than 100 MB')
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

    // Demo / server unavailable → simulate progress
    if (!isBackendAvailable()) {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(r => setTimeout(r, 120))
        setUploadProgress(i)
      }
      setUploadStatus('success')
      return
    }

    try {
      // Step 1: upload video file to server via FormData
      setUploadProgress(10)
      const formData = new FormData()
      formData.append('video', file)

      const token = localStorage.getItem('reelz_token')
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      setUploadProgress(70)

      if (!uploadRes.ok) {
        const json = await uploadRes.json() as { error?: string }
        throw new Error(json.error || 'Upload failed')
      }

      const { url: videoUrl } = await uploadRes.json() as { url: string }
      setUploadProgress(80)

      // Step 2: save metadata
      const { error } = await videosApi.create({
        video_url: videoUrl,
        caption: caption || undefined,
        hashtags,
        music_title: musicTitle || '♫ Original Sound',
      })

      if (error) throw new Error(error)

      setUploadProgress(100)
      setUploadStatus('success')
    } catch (err) {
      setUploadStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-reel-darker px-4">
        <div className="text-4xl">🔒</div>
        <h2 className="font-bold text-xl">Sign in to upload</h2>
        <p className="text-reel-text-muted text-sm text-center">
          Create an account or sign in to share your videos.
        </p>
        <button onClick={() => navigate('/auth')} className="btn-primary">Sign In</button>
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
          aria-label="Back"
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
              <p className="font-semibold">Select or drag a video</p>
              <p className="text-sm text-reel-text-muted mt-1">MP4, WebM, or MOV · Max 100 MB</p>
            </div>
            <div className="flex items-center gap-2 bg-reel-pink/10 border border-reel-pink/30 rounded-full px-4 py-2">
              <Upload size={16} className="text-reel-pink" />
              <span className="text-sm text-reel-pink font-medium">Choose file</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              aria-label="Select video file"
            />
          </div>
        ) : (
          <div className="relative aspect-[9/16] max-h-72 w-full rounded-2xl overflow-hidden bg-black">
            <video src={previewUrl!} className="w-full h-full object-contain" controls muted playsInline />
            <button
              onClick={() => { setFile(null); setPreviewUrl(null) }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Remove video"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Progress */}
        {uploadStatus === 'uploading' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-reel-text-muted">Uploading…</span>
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

        {/* Success */}
        {uploadStatus === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle size={48} className="text-green-400" />
            <h3 className="font-bold text-lg">Video published!</h3>
            <p className="text-reel-text-muted text-sm text-center">
              Your video is live and ready to be discovered.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary">Go to Feed</button>
          </div>
        )}

        {/* Form fields */}
        {file && uploadStatus === 'idle' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Describe your video…"
                className="input-field min-h-[80px] resize-none"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-reel-text-muted text-right mt-1">{caption.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hashtags</label>
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
                  aria-label="Add hashtag"
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
                      <button onClick={() => removeHashtag(tag)} aria-label={`Remove #${tag}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Music / Audio title</label>
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

            {!isBackendAvailable() && (
              <p className="text-center text-xs text-reel-text-muted">
                Demo mode — video won't be saved permanently
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
