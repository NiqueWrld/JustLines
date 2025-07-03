import { useEffect } from 'react'
import { tiktokService } from '../services/tiktokService'

const TikTokCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      if (error) {
        console.error('TikTok OAuth error:', error)
        alert('Failed to authenticate with TikTok. Please try again.')
        window.close()
        return
      }

      if (code) {
        try {
          await tiktokService.exchangeCodeForToken(code)
          alert('Successfully connected to TikTok!')
          
          // Notify parent window and close popup
          if (window.opener) {
            window.opener.postMessage({ type: 'TIKTOK_AUTH_SUCCESS' }, '*')
          }
          window.close()
        } catch (error) {
          console.error('Failed to exchange code for token:', error)
          alert('Failed to complete TikTok authentication. Please try again.')
          window.close()
        }
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <h2 className="text-white text-xl font-semibold mb-2">Connecting to TikTok...</h2>
        <p className="text-gray-300">Please wait while we complete the authentication.</p>
      </div>
    </div>
  )
}

export default TikTokCallback
