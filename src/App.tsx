import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchQuotes } from './services/quoteService'
import { analyzeQuoteTopic, getTopicColor, getTopicIcon } from './services/topicService'
import { fetchPexelsVideos } from './services/videoService'
import { tiktokService } from './services/tiktokService'
import type { Quote } from './services/quoteService'
import type { PexelsVideo } from './services/videoService'

function App() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [backgroundVideos, setBackgroundVideos] = useState<PexelsVideo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<PexelsVideo | null>(null)
  const [videosLoading, setVideosLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadDisabled, setDownloadDisabled] = useState(false)
  const [uploadingToTikTok, setUploadingToTikTok] = useState(false)
  const [tiktokAuthenticated, setTiktokAuthenticated] = useState(false)
  const [showTikTokOptions, setShowTikTokOptions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuotes()
    // Check if TikTok is authenticated
    setTiktokAuthenticated(tiktokService.isAuthenticated())
    
    // Listen for TikTok authentication success
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TIKTOK_AUTH_SUCCESS') {
        setTiktokAuthenticated(true)
        console.log('TikTok authentication successful!')
      } else if (event.data.type === 'TIKTOK_AUTH_ERROR') {
        console.error('TikTok authentication failed:', event.data.error)
        setTiktokAuthenticated(false)
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedQuotes = await fetchQuotes()
      setQuotes(fetchedQuotes)
    } catch (err) {
      setError('Failed to load quotes. Please try again.')
      console.error('Error loading quotes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshQuotes = async () => {
    await loadQuotes()
  }

  const handleQuoteSelect = async (quote: Quote) => {
    setSelectedQuote(quote)
    setSelectedTopic('Analyzing...') // Show loading state
    setVideosLoading(true)
    setBackgroundVideos([])

    try {
      // Analyze topic and fetch videos in parallel
      const [topic, videos] = await Promise.all([
        analyzeQuoteTopic(quote),
        fetchPexelsVideos(quote.q) // Fetch videos based on quote keywords
      ]);

      setSelectedTopic(topic)
      setBackgroundVideos(videos) // Use the videos we already fetched

    } catch (error) {
      console.error('Quote analysis or video fetch failed:', error)
      setSelectedTopic('General') // Fallback topic

      // Try to fetch videos as fallback
      try {
        const fallbackVideos = await fetchPexelsVideos(quote.q)
        setBackgroundVideos(fallbackVideos)
      } catch (videoError) {
        console.error('Video fetch failed:', videoError)
        setBackgroundVideos([])
      }
    } finally {
      setVideosLoading(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedQuote(null)
    setSelectedTopic('')
    setBackgroundVideos([])
    setSelectedVideo(null)
    setVideosLoading(false)
    setDownloading(false)
    setDownloadDisabled(false)
    setUploadingToTikTok(false)
    setShowTikTokOptions(false)
  }

  const handleVideoSelect = (video: PexelsVideo) => {
    setSelectedVideo(video)
  }

  const downloadVideoWithQuote = async () => {
    if (!selectedVideo || !selectedQuote) {
      return
    }

    try {
      setDownloading(true)
      setDownloadDisabled(true)

      // Disable button for 30 seconds
      setTimeout(() => {
        setDownloadDisabled(false)
      }, 30000)

      // Create a canvas for the video
      const canvas = document.createElement('canvas')
      canvas.width = 315 // 9:16 aspect ratio width
      canvas.height = 560 // 9:16 aspect ratio height
      const ctx = canvas.getContext('2d')!

      // Create video element
      const videoElement = document.createElement('video')
      videoElement.src = selectedVideo.video_files[0]?.link
      videoElement.muted = true
      videoElement.crossOrigin = 'anonymous'
      videoElement.loop = true

      // Wait for video to load
      await new Promise<void>((resolve) => {
        videoElement.onloadeddata = () => {
          videoElement.currentTime = 0
          resolve()
        }
        videoElement.load()
      })

      // Set up MediaRecorder to capture canvas
      const stream = canvas.captureStream(30) // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `quote-video-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      // Start recording
      mediaRecorder.start()

      // Animation function to draw video frames with quote overlay
      const drawFrame = () => {
        // Clear canvas
        ctx.clearRect(0, 0, 315, 560)

        // Draw video frame
        ctx.drawImage(videoElement, 0, 0, 315, 560)

        // Draw overlay background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(0, 0, 315, 560)

        // Draw quote text
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        // Quote text
        ctx.font = 'bold 18px Arial'
        const quoteLines = wrapText(ctx, `"${selectedQuote.q}"`, 280)
        quoteLines.forEach((line: string, index: number) => {
          ctx.fillText(line, 157.5, 200 + (index * 25))
        })

        // Author text
        ctx.font = 'italic 16px Arial'
        ctx.fillText(`— ${selectedQuote.a}`, 157.5, 200 + (quoteLines.length * 25) + 40)
      }

      // Start video playback
      videoElement.play()

      // Record for 30 seconds
      const recordingDuration = 30000 // 30 seconds
      let animationId: number

      const animate = () => {
        drawFrame()
        animationId = requestAnimationFrame(animate)
      }

      animate()

      // Stop recording after duration
      setTimeout(() => {
        cancelAnimationFrame(animationId)
        mediaRecorder.stop()
        videoElement.pause()
      }, recordingDuration)

    } catch (error) {
      console.error('Error creating video with quote:', error)
      alert('Failed to create video with quote. Please try again or try a different video.')
    } finally {
      setDownloading(false)
    }
  }

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const width = ctx.measureText(currentLine + ' ' + word).width
      if (width < maxWidth) {
        currentLine += ' ' + word
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    lines.push(currentLine)
    return lines
  }

  const handleTikTokAuth = () => {
    const authUrl = tiktokService.getAuthorizationUrl()
    window.open(authUrl, '_blank', 'width=600,height=600')
  }

  const uploadToTikTok = async (videoBlob: Blob) => {
    if (!selectedQuote || !tiktokService.isAuthenticated()) {
      return
    }

    try {
      setUploadingToTikTok(true)
      
      const uploadOptions = {
        title: `"${selectedQuote.q}" - ${selectedQuote.a}`,
        description: `Inspirational quote: "${selectedQuote.q}" by ${selectedQuote.a}. Created with JustLines #quotes #inspiration #motivation`,
        privacy_level: 'PUBLIC_TO_EVERYONE' as const,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      }

      await tiktokService.uploadVideo(videoBlob, uploadOptions)
      
      alert('Video uploaded to TikTok successfully!')
      setShowTikTokOptions(false)
      
    } catch (error) {
      console.error('TikTok upload failed:', error)
      alert('Failed to upload to TikTok. Please try again.')
    } finally {
      setUploadingToTikTok(false)
    }
  }

  const createAndUploadToTikTok = async () => {
    if (!selectedVideo || !selectedQuote) {
      return
    }

    try {
      setUploadingToTikTok(true)

      // Create video blob (similar to download function but return blob instead of download)
      const canvas = document.createElement('canvas')
      canvas.width = 315
      canvas.height = 560
      const ctx = canvas.getContext('2d')!

      const videoElement = document.createElement('video')
      videoElement.src = selectedVideo.video_files[0]?.link
      videoElement.muted = true
      videoElement.crossOrigin = 'anonymous'
      videoElement.loop = true

      await new Promise<void>((resolve) => {
        videoElement.onloadeddata = () => {
          videoElement.currentTime = 0
          resolve()
        }
        videoElement.load()
      })

      const stream = canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        await uploadToTikTok(blob)
      }

      mediaRecorder.start()

      const drawFrame = () => {
        ctx.clearRect(0, 0, 315, 560)
        ctx.drawImage(videoElement, 0, 0, 315, 560)
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(0, 0, 315, 560)
        
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        
        ctx.font = 'bold 18px Arial'
        const quoteLines = wrapText(ctx, `"${selectedQuote.q}"`, 280)
        quoteLines.forEach((line: string, index: number) => {
          ctx.fillText(line, 157.5, 200 + (index * 25))
        })
        
        ctx.font = 'italic 16px Arial'
        ctx.fillText(`— ${selectedQuote.a}`, 157.5, 200 + (quoteLines.length * 25) + 40)
      }

      videoElement.play()

      const recordingDuration = 30000
      let animationId: number

      const animate = () => {
        drawFrame()
        animationId = requestAnimationFrame(animate)
      }

      animate()

      setTimeout(() => {
        cancelAnimationFrame(animationId)
        mediaRecorder.stop()
        videoElement.pause()
      }, recordingDuration)

    } catch (error) {
      console.error('Error creating video for TikTok:', error)
      alert('Failed to create video for TikTok. Please try again.')
      setUploadingToTikTok(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <motion.header
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            JustLines
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Create videos with inspirational quotes - Fast & Easy!
          </motion.p>
        </motion.header>

        {!selectedQuote && (
          <main className="max-w-6xl mx-auto">
            <motion.section
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div
                className="flex flex-col sm:flex-row justify-between items-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <motion.h2
                  className="text-2xl md:text-3xl font-semibold text-white mb-4 sm:mb-0"
                  initial={{ x: -30 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  Inspirational Quotes
                </motion.h2>
                <motion.button
                  onClick={handleRefreshQuotes}
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-lg"
                  initial={{ x: 30 }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Refresh Quotes'
                  )}
                </motion.button>
              </motion.div>

              {error && (
                <motion.div
                  className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    <p className="text-white mt-4 text-lg">Loading quotes...</p>
                  </motion.div>
                ) : quotes.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="text-center py-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-6 py-8 rounded-xl">
                      <p className="text-lg mb-4">No quotes available at the moment.</p>
                      <p className="text-sm text-yellow-200">Please try refreshing to load quotes.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="quotes"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {quotes.map((quote, index) => (
                      <motion.div
                        key={index}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/15 cursor-pointer"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.1
                        }}
                        whileHover={{
                          scale: 1.05,
                          y: -5,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuoteSelect(quote)}
                      >
                        <blockquote className="text-center">
                          <p className="text-white text-lg mb-4 leading-relaxed">
                            "{quote.q}"
                          </p>
                          <cite className="text-gray-300 text-sm font-medium">
                            — {quote.a}
                          </cite>
                        </blockquote>

                        <div className="mt-4 text-center">
                          <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                            Click to select
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </main>
        )}

        {selectedQuote && (
          <motion.section
            className="mb-12 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Selected Quote Header */}
            <div className="relative mb-8">
              <div className={`bg-gradient-to-r ${getTopicColor(selectedTopic)} p-4 rounded-2xl shadow-2xl`}>
                <button
                  onClick={handleClearSelection}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="text-center text-white">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {selectedTopic === 'Analyzing...' ? (
                      <>
                        <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-lg font-semibold bg-white/20 px-3 py-1 rounded-full">
                          AI Analyzing...
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">{getTopicIcon(selectedTopic)}</span>
                        <span className="text-lg font-semibold bg-white/20 px-3 py-1 rounded-full">
                          {selectedTopic}
                        </span>
                      </>
                    )}
                  </div>

                  <blockquote className="mb-2">
                    <p className="text-lg md:text-xl font-medium leading-relaxed mb-2">
                      "{selectedQuote.q}"
                    </p>
                    <cite className="text-base font-semibold">
                      — {selectedQuote.a}
                    </cite>
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Video Selection Grid */}
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                Choose Your Video
              </h3>
              <p className="text-gray-300">
                Select the video that best matches your quote
              </p>
            </div>

            {videosLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="text-white mt-4 text-lg">Finding perfect videos...</p>
              </div>
            ) : (
              <div   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {backgroundVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    className={`bg-white/10 backdrop-blur-sm border-2 ${selectedVideo?.id === video.id
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-white/20'
                      } rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/15 cursor-pointer`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1
                    }}
                    whileHover={{
                      scale: 1.05,
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="aspect-[9/16] relative">
                      <video
                        src={video.video_files[0]?.link}
                        poster={video.video_pictures[0]?.picture || video.preview}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />

                      {/* Quote Overlay */}
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-4 text-white">
                        <div className="text-center">
                          <blockquote className="mb-3">
                            <p className="text-sm md:text-base font-bold leading-tight mb-2 drop-shadow-lg">
                              "{selectedQuote.q}"
                            </p>
                            <cite className="text-xs md:text-sm font-semibold drop-shadow-lg opacity-90">
                              — {selectedQuote.a}
                            </cite>
                          </blockquote>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedVideo?.id === video.id && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-pink-500 rounded-full p-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-center text-white text-sm">
                        <span>{video.duration}s</span>
                        <span>{video.width}x{video.height}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Download Button */}
            {selectedVideo && !videosLoading && (
              <motion.div
                className="text-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.button
                  onClick={downloadVideoWithQuote}
                  disabled={downloading || downloadDisabled}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-lg text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {downloading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Your Video...
                    </span>
                  ) : downloadDisabled ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Please wait...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Video with Quote
                    </span>
                  )}
                </motion.button>
                <p className="text-gray-300 text-sm mt-3">
                  This will create a 30-second video with your quote overlay
                </p>
                
                {/* TikTok Upload Toggle */}
                <div className="mt-6 border-t border-white/20 pt-6">
                  {!showTikTokOptions ? (
                    <div className="text-center">
                      <button
                        onClick={() => setShowTikTokOptions(true)}
                        className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-semibold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center mx-auto"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.5 0C5.6 0 0 5.6 0 12.5S5.6 25 12.5 25 25 19.4 25 12.5 19.4 0 12.5 0zM19.3 8.9c-1.2 0-2.4-.4-3.3-1.1v5.1c0 2.6-2.1 4.7-4.7 4.7s-4.7-2.1-4.7-4.7 2.1-4.7 4.7-4.7c.3 0 .5 0 .8.1v2.3c-.3-.1-.5-.1-.8-.1-1.3 0-2.4 1.1-2.4 2.4s1.1 2.4 2.4 2.4 2.4-1.1 2.4-2.4V2.3h2.3c.4 2.1 2.1 3.8 4.2 4.2v2.4z"/>
                        </svg>
                        Share to TikTok
                      </button>
                      <p className="text-gray-400 text-sm mt-2">
                        Upload your video directly to TikTok
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.5 0C5.6 0 0 5.6 0 12.5S5.6 25 12.5 25 25 19.4 25 12.5 19.4 0 12.5 0zM19.3 8.9c-1.2 0-2.4-.4-3.3-1.1v5.1c0 2.6-2.1 4.7-4.7 4.7s-4.7-2.1-4.7-4.7 2.1-4.7 4.7-4.7c.3 0 .5 0 .8.1v2.3c-.3-.1-.5-.1-.8-.1-1.3 0-2.4 1.1-2.4 2.4s1.1 2.4 2.4 2.4 2.4-1.1 2.4-2.4V2.3h2.3c.4 2.1 2.1 3.8 4.2 4.2v2.4z"/>
                          </svg>
                          Upload to TikTok
                        </h4>
                        <button
                          onClick={() => setShowTikTokOptions(false)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {!tiktokAuthenticated ? (
                        <div className="text-center">
                          <button
                            onClick={handleTikTokAuth}
                            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-semibold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center mx-auto"
                          >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.5 0C5.6 0 0 5.6 0 12.5S5.6 25 12.5 25 25 19.4 25 12.5 19.4 0 12.5 0zM19.3 8.9c-1.2 0-2.4-.4-3.3-1.1v5.1c0 2.6-2.1 4.7-4.7 4.7s-4.7-2.1-4.7-4.7 2.1-4.7 4.7-4.7c.3 0 .5 0 .8.1v2.3c-.3-.1-.5-.1-.8-.1-1.3 0-2.4 1.1-2.4 2.4s1.1 2.4 2.4 2.4 2.4-1.1 2.4-2.4V2.3h2.3c.4 2.1 2.1 3.8 4.2 4.2v2.4z"/>
                            </svg>
                            Connect to TikTok
                          </button>
                          <p className="text-gray-400 text-sm mt-2">
                            Connect your TikTok account to upload videos directly
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-2 rounded-lg mb-4 inline-flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            TikTok Connected
                          </div>
                          <div>
                            <button
                              onClick={createAndUploadToTikTok}
                              disabled={uploadingToTikTok}
                              className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center mx-auto"
                            >
                              {uploadingToTikTok ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Uploading to TikTok...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  Upload to TikTok
                                </>
                              )}
                            </button>
                            <p className="text-gray-400 text-sm mt-2">
                              This will create and upload your video directly to TikTok
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {!videosLoading && backgroundVideos.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-6 py-8 rounded-xl max-w-md mx-auto">
                  <p className="text-lg mb-2">No videos found</p>
                  <p className="text-sm text-yellow-200">
                    Try selecting a different quote or check your Pexels API configuration
                  </p>
                </div>
              </div>
            )}
          </motion.section>
        )}

      </div>
    </div>
  )
}

export default App
