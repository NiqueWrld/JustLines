import type { Quote } from './quoteService'

// Enhanced topic extraction using semantic analysis and advanced keywords
const enhancedTopicAnalysis = (text: string): string => {
  const lowercaseText = text.toLowerCase()
  
  // Enhanced keyword sets with semantic variations
  const enhancedKeywords = {
    'Success': [
      'success', 'achievement', 'accomplish', 'goal', 'win', 'victory', 'triumph', 
      'excel', 'outstanding', 'mastery', 'excellence', 'winner', 'champion', 
      'attain', 'reach', 'fulfill', 'complete', 'conquer', 'prevail'
    ],
    'Motivation': [
      'motivate', 'inspire', 'drive', 'push', 'encourage', 'determination', 'persistence',
      'ambition', 'passion', 'energy', 'enthusiasm', 'dedication', 'commitment',
      'effort', 'strive', 'pursue', 'hustle', 'grind', 'work hard', 'never give up'
    ],
    'Life': [
      'life', 'living', 'exist', 'journey', 'path', 'experience', 'wisdom',
      'meaning', 'purpose', 'destiny', 'fate', 'choices', 'decisions',
      'moments', 'time', 'years', 'days', 'memories', 'legacy'
    ],
    'Love': [
      'love', 'heart', 'affection', 'care', 'romance', 'relationship', 'compassion',
      'kindness', 'tender', 'beloved', 'soul', 'connection', 'bond',
      'family', 'friendship', 'devotion', 'adore', 'cherish', 'precious'
    ],
    'Happiness': [
      'happy', 'joy', 'smile', 'laughter', 'cheerful', 'positive', 'bliss',
      'delight', 'pleasure', 'contentment', 'satisfaction', 'glad', 'merry',
      'bright', 'sunny', 'wonderful', 'amazing', 'beautiful', 'grateful'
    ],
    'Growth': [
      'grow', 'learn', 'develop', 'improve', 'progress', 'change', 'evolve',
      'transform', 'advance', 'expand', 'mature', 'better', 'upgrade',
      'enhance', 'refine', 'cultivate', 'nurture', 'education', 'knowledge'
    ],
    'Courage': [
      'courage', 'brave', 'fearless', 'bold', 'strength', 'confident', 'dare',
      'warrior', 'fighter', 'strong', 'powerful', 'mighty', 'fierce',
      'risk', 'challenge', 'face', 'stand up', 'defend', 'protect'
    ],
    'Dreams': [
      'dream', 'vision', 'hope', 'aspire', 'imagine', 'future', 'possibility',
      'wish', 'desire', 'ambition', 'goal', 'aspiration', 'fantasy',
      'ideal', 'tomorrow', 'potential', 'opportunity', 'believe', 'faith'
    ],
    'Perseverance': [
      'persist', 'endure', 'overcome', 'struggle', 'challenge', 'resilience', 'tough',
      'survive', 'fight', 'battle', 'continue', 'never quit', 'keep going',
      'determination', 'grit', 'tenacity', 'strength', 'endurance', 'withstand'
    ],
    'Wisdom': [
      'wise', 'knowledge', 'understand', 'insight', 'truth', 'learn', 'experience',
      'smart', 'intelligent', 'clever', 'sage', 'enlighten', 'realize',
      'aware', 'conscious', 'mindful', 'think', 'reflect', 'contemplate'
    ]
  }
  
  // Score each topic based on keyword matches and proximity
  const topicScores: { [key: string]: number } = {}
  
  Object.entries(enhancedKeywords).forEach(([topic, keywords]) => {
    let score = 0
    
    keywords.forEach(keyword => {
      // Exact match gets full points
      if (lowercaseText.includes(keyword)) {
        score += 2
      }
      
      // Partial matches for compound words
      const words = lowercaseText.split(/\s+/)
      words.forEach(word => {
        if (word.includes(keyword) || keyword.includes(word)) {
          score += 1
        }
      })
    })
    
    topicScores[topic] = score
  })
  
  // Find the topic with the highest score
  const bestTopic = Object.entries(topicScores).reduce((best, [topic, score]) => 
    score > best.score ? { topic, score } : best
  , { topic: 'General', score: 0 })
  
  // Return General if no strong matches found
  return bestTopic.score > 0 ? bestTopic.topic : 'General'
}

export const analyzeQuoteTopic = async (quote: Quote): Promise<string> => {
  const text = `${quote.q} ${quote.a}`
  
  // Use enhanced local analysis instead of external API
  console.log('Analyzing quote with enhanced algorithm...')
  const topic = enhancedTopicAnalysis(text)
  console.log('Analysis result:', topic)
  
  return topic
}

export const getTopicColor = (topic: string): string => {
  const colors: { [key: string]: string } = {
    'Success': 'from-green-400 to-emerald-500',
    'Motivation': 'from-orange-400 to-red-500',
    'Life': 'from-blue-400 to-indigo-500',
    'Love': 'from-pink-400 to-rose-500',
    'Happiness': 'from-yellow-400 to-amber-500',
    'Growth': 'from-teal-400 to-cyan-500',
    'Courage': 'from-purple-400 to-violet-500',
    'Dreams': 'from-indigo-400 to-purple-500',
    'Perseverance': 'from-gray-400 to-slate-500',
    'Wisdom': 'from-amber-400 to-orange-500',
    'General': 'from-gray-400 to-gray-500'
  }
  
  return colors[topic] || colors['General']
}

export const getTopicIcon = (topic: string): string => {
  const icons: { [key: string]: string } = {
    'Success': '🏆',
    'Motivation': '💪',
    'Life': '🌟',
    'Love': '❤️',
    'Happiness': '😊',
    'Growth': '🌱',
    'Courage': '🦁',
    'Dreams': '✨',
    'Perseverance': '⚡',
    'Wisdom': '🧠',
    'General': '💭'
  }
  
  return icons[topic] || icons['General']
}
