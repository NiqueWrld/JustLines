import { useEffect, useState } from 'react'
import { tiktokService } from '../services/tiktokService'

const TikTokCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Connecting to TikTok...')

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      if (error) {
        console.error('TikTok OAuth error:', error, errorDescription)
        setStatus('error')
        setMessage(`Authentication failed: ${errorDescription || error}`)
        
        // Notify parent window and close popup after delay
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'TIKTOK_AUTH_ERROR', error: error }, '*')
          }
          window.close()
        }, 3000)
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('No authorization code received from TikTok')
        setTimeout(() => {
          window.close()
        }, 3000)
        return
      }

      try {
        setMessage('Exchanging authorization code for access token...')
        await tiktokService.exchangeCodeForToken(code)
        
        setStatus('success')
        setMessage('Successfully connected to TikTok!')
        
        // Notify parent window and close popup
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'TIKTOK_AUTH_SUCCESS' }, '*')
          }
          window.close()
        }, 2000)
        
      } catch (error) {
        console.error('Failed to exchange code for token:', error)
        setStatus('error')
        setMessage('Failed to complete TikTok authentication. Please try again.')
        
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'TIKTOK_AUTH_ERROR', error: error }, '*')
          }
          window.close()
        }, 3000)
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center max-w-md w-full">
        {status === 'loading' && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <h2 className="text-white text-xl font-semibold mb-2">Connecting to TikTok</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="inline-block rounded-full h-12 w-12 bg-green-500 mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Success!</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-gray-400 text-sm mt-3">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="inline-block rounded-full h-12 w-12 bg-red-500 mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <button 
              onClick={() => window.close()}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default TikTokCallback
