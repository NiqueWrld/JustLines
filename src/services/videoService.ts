// Pexels video service for fetching background videos
export interface PexelsVideo {
  id: number;
  url: string;
  duration: number;
  width: number;
  height: number;
  preview: string;
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
  video_pictures: Array<{
    id: number;
    picture: string;
    nr: number;
  }>;
}

export interface PexelsResponse {
  page: number;
  per_page: number;
  total_results: number;
  url: string;
  videos: PexelsVideo[];
}

// Extract meaningful keywords from quote text for video search
const getVideoSearchKeywords = (quoteText: string): string[] => {
  // Common words to filter out (stop words)
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'time', 'has', 'look', 'more', 'write', 'go', 'see', 'no', 'could', 'there', 'what', 'were', 'been', 'have', 'their', 'said', 'each', 'which', 'do', 'how', 'if', 'will', 'up', 'other', 'about', 'out', 'first', 'than', 'them', 'well', 'were'
  ]);

  // Extract meaningful words from the quote
  const meaningfulWords = quoteText.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && // At least 4 characters
      !stopWords.has(word) && // Not a common stop word
      !/^\d+$/.test(word) // Not just numbers
    )
    .slice(0, 5); // Take top 5 meaningful words

  // Add some visual/cinematic terms for better video results
  const cinematicTerms = ['cinematic', 'beautiful', 'nature', 'abstract', 'motion'];
  
  // Combine quote keywords with cinematic terms (prioritize quote words)
  return [...meaningfulWords, ...cinematicTerms.slice(0, 2)];
};

export const fetchPexelsVideos = async (quoteText: string): Promise<PexelsVideo[]> => {
  // Note: You'll need to get a free API key from https://www.pexels.com/api/
  const PEXELS_API_KEY = 'fHowp6XLIEJ7TeHiFgptNEU5JyipPf58mWuRCDrBoUl1aRThgvXrUJvv'; // Replace with actual API key
  

  try {
    const searchKeywords = getVideoSearchKeywords(quoteText);
    const searchQuery = searchKeywords.slice(0, 3).join(' '); // Use top 3 keywords
    
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=12&orientation=portrait`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsResponse = await response.json();
    
    // Filter for TikTok-style vertical videos (9:16 aspect ratio or similar)
    const tiktokVideos = data.videos.filter(video => {
      const aspectRatio = video.width / video.height;
      // TikTok aspect ratio is 9:16 = 0.5625
      // Allow some flexibility: between 0.45 and 0.7 for vertical videos
      return aspectRatio >= 0.45 && aspectRatio <= 0.7;
    });

    // Sort by how close they are to the ideal TikTok aspect ratio (9:16 = 0.5625)
    const sortedVideos = tiktokVideos.sort((a, b) => {
      const idealRatio = 9/16; // 0.5625
      const ratioA = a.width / a.height;
      const ratioB = b.width / b.height;
      const diffA = Math.abs(ratioA - idealRatio);
      const diffB = Math.abs(ratioB - idealRatio);
      return diffA - diffB;
    });

    return sortedVideos.slice(0, 4);
    
  } catch (error) {
    console.error('Error fetching Pexels videos:', error);
    throw error; // Re-throw the error instead of falling back to mock data
  }
};


