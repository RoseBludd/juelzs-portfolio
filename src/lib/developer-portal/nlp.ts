// Function to convert text into a bag of words vector
function text_to_vector(text: string): Map<string, number> {
  const words = text.toLowerCase().split(/\W+/);
  const vector = new Map<string, number>();
  
  for (const word of words) {
    if (word.length < 2) continue; // Skip single characters
    vector.set(word, (vector.get(word) || 0) + 1);
  }
  
  return vector;
}

// Function to calculate the magnitude of a vector
function magnitude(vector: Map<string, number>): number {
  return Math.sqrt(
    Array.from(vector.values()).reduce((sum, count) => sum + count * count, 0)
  );
}

// Function to calculate dot product of two vectors
function dot_product(v1: Map<string, number>, v2: Map<string, number>): number {
  let product = 0;
  
  for (const [word, count] of v1) {
    if (v2.has(word)) {
      product += count * (v2.get(word) || 0);
    }
  }
  
  return product;
}

/**
 * Calculates the cosine similarity between two strings.
 * This is a simple implementation that uses word frequency vectors.
 */
export function cosine_similarity(str1: string, str2: string): number {
  // Convert strings to word frequency vectors
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  // Get unique words
  const uniqueWords = Array.from(new Set([...words1, ...words2]));
  
  // Create frequency vectors
  const vector1 = uniqueWords.map(word => words1.filter(w => w === word).length);
  const vector2 = uniqueWords.map(word => words2.filter(w => w === word).length);
  
  // Calculate cosine similarity
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
} 
