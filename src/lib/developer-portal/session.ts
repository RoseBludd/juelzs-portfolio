/**
 * Session utility functions for handling custom authentication
 */

/**
 * Verifies and decodes a session cookie
 * @param cookieValue The value of the session cookie
 * @returns The decoded user data or null if invalid
 */
export function verifySessionCookie(cookieValue: string): { id: string; email: string; role: string; name?: string } | null {
  try {
    // In a production app, you would verify the signature of the cookie
    // For now, we'll just decode the base64 value
    const decodedValue = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const userData = JSON.parse(decodedValue);
    return userData;
  } catch (error) {
    console.error('Failed to verify session cookie:', error);
    return null;
  }
}

/**
 * Creates a session cookie value
 * @param userData The user data to encode
 * @returns The encoded cookie value
 */
export function createSessionCookie(userData: { id: string; email: string; role: string; name?: string }): string {
  try {
    // In a production app, you would sign the cookie value
    // For now, we'll just encode it as base64
    const jsonValue = JSON.stringify(userData);
    return Buffer.from(jsonValue).toString('base64');
  } catch (error) {
    console.error('Failed to create session cookie:', error);
    throw error;
  }
} 