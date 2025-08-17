/**
 * Extracts a clean filename from a URL, removing query parameters and handling URL decoding
 * @param url - The URL to extract filename from
 * @returns The extracted filename or undefined if no valid filename found
 */
export function extractFileNameFromUrl(url: string): string | undefined {
  if (!url) return undefined
  
  try {
    // First, remove query parameters from the URL
    const urlWithoutQuery = url.split('?')[0]
    
    // Handle S3 URLs - extract from the key/path
    if (urlWithoutQuery.includes('amazonaws.com')) {
      const s3Match = urlWithoutQuery.match(/amazonaws\.com\/(.+)$/)
      if (s3Match) {
        const key = s3Match[1]
        // Decode URI components and get the last part of the path
        const decodedKey = decodeURIComponent(key)
        const pathParts = decodedKey.split('/')
        const fileName = pathParts[pathParts.length - 1]
        
        // If we have a meaningful filename, return it
        if (fileName && fileName.length > 0 && fileName !== '/' && fileName.includes('.')) {
          return fileName
        }
      }
    }
    
    // For regular URLs, extract filename from the path
    try {
      const urlObj = new URL(urlWithoutQuery)
      const pathname = urlObj.pathname
      const pathParts = pathname.split('/')
      const fileName = pathParts[pathParts.length - 1]
      
      // If we have a filename with extension, return it
      if (fileName && fileName.includes('.')) {
        return decodeURIComponent(fileName)
      }
    } catch (urlError) {
      // If URL constructor fails, fall back to string manipulation
    }
    
    // Fallback: extract from the raw string
    const parts = urlWithoutQuery.split('/')
    const lastPart = parts[parts.length - 1]
    
    if (lastPart && lastPart.includes('.')) {
      return decodeURIComponent(lastPart)
    }
    
    return undefined
  } catch (error) {
    // Final fallback: try to extract from the raw string
    const parts = url.split('/')
    const lastPart = parts[parts.length - 1]
    
    if (lastPart && lastPart.includes('.')) {
      // Remove query parameters and decode
      const cleanPart = lastPart.split('?')[0]
      return decodeURIComponent(cleanPart)
    }
    
    return undefined
  }
}

/**
 * Gets a safe filename for a MediaFile, using provided fileName or extracting from URL
 * @param fileName - The provided filename (optional)
 * @param url - The URL to extract filename from if fileName is not provided
 * @returns A safe filename or undefined
 */
export function getSafeFileName(fileName?: string, url?: string): string | undefined {
  // Use provided fileName if it exists and is meaningful
  if (fileName && fileName.trim() && fileName !== 'undefined' && fileName !== 'null') {
    return fileName.trim()
  }
  
  // Extract from URL if available
  if (url) {
    return extractFileNameFromUrl(url)
  }
  
  return undefined
} 