import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchQuotes } from './services/quoteService'
import type { Quote } from './services/quoteService'

function App() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuotes()
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
            Create TikTok-style videos with inspirational quotes
          </motion.p>
        </motion.header>

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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {quotes.map((quote, index) => (
                    <motion.div 
                      key={index} 
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/15"
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
                    >
                      <blockquote className="text-center">
                        <p className="text-white text-lg mb-4 leading-relaxed">
                          "{quote.q}"
                        </p>
                        <cite className="text-gray-300 text-sm font-medium">
                          — {quote.a}
                        </cite>
                      </blockquote>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </main>
      </div>
    </div>
  )
}

export default App
