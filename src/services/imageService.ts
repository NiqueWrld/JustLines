export interface BackgroundImage {
  id: string;
  url: string;
  download_url: string;
  width: number;
  height: number;
  author: string;
}

export const fetchRandomImage = async (): Promise<BackgroundImage> => {
  try {
    // Using Picsum Photos API for random images
    const response = await fetch('https://picsum.photos/1080/1920.jpg');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get the final URL after redirects
    const finalUrl = response.url;
    
    return {
      id: Date.now().toString(),
      url: finalUrl,
      download_url: finalUrl,
      width: 1080,
      height: 1920,
      author: 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching background image:', error);
    // Fallback to a solid color gradient
    throw new Error('Failed to fetch background image');
  }
};

export const fetchUnsplashImage = async (query: string = 'nature'): Promise<BackgroundImage> => {
  try {
    // Using Unsplash Source API (no API key required)
    const url = `https://source.unsplash.com/1080x1920/?${query}`;
    
    return {
      id: Date.now().toString(),
      url,
      download_url: url,
      width: 1080,
      height: 1920,
      author: 'Unsplash'
    };
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    throw new Error('Failed to fetch background image');
  }
};
