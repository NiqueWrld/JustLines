export interface Quote {
  q: string; // Quote text
  a: string; // Author
  h: string; // HTML content
}

export const fetchQuotes = async (): Promise<Quote[]> => {
  try {
    // Try quotable.io API first (no CORS issues)
    const response = await fetch('https://api.quotable.io/quotes?limit=5');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Transform the response to match our Quote interface
    const transformedQuotes: Quote[] = data.results.map((quote: any) => ({
      q: quote.content,
      a: quote.author,
      h: quote.content
    }));
    
    return transformedQuotes;
  } catch (error) {
    console.error('Error fetching quotes from quotable.io:', error);
    
    try {
      // Fallback to zenquotes.io with different endpoint
      const response = await fetch('https://zenquotes.io/api/random/5');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.slice(0, 5);
    } catch (fallbackError) {
      console.error('Error fetching quotes from zenquotes.io:', fallbackError);
      
      // Return empty array if all APIs fail
      return [];
    }
  }
};
