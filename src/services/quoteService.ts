export interface Quote {
  q: string; // Quote text
  a: string; // Author
  h: string; // HTML content
}

export const fetchQuotes = async (): Promise<Quote[]> => {
  try {
    // Using DummyJSON API - reliable and no CORS issues
    // Get a random selection by using skip parameter
    const totalQuotes = 150; // DummyJSON has about 150 quotes
    const randomSkip = Math.floor(Math.random() * (totalQuotes - 10)); // Random starting point
    const response = await fetch(`https://dummyjson.com/quotes?limit=4&skip=${randomSkip}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Transform the response to match our Quote interface
    const transformedQuotes: Quote[] = data.quotes.map((quote: any) => ({
      q: quote.quote,
      a: quote.author,
      h: quote.quote
    }));
    
    return transformedQuotes;
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
};
