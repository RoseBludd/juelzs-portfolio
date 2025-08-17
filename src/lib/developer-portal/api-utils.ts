import { NextRequest, NextResponse } from 'next/server';

import { verifySessionCookie } from './session';

// Standard CORS headers to use across all API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Cache-busting headers to prevent stale data
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Last-Modified': new Date().toUTCString(),
  'ETag': `"${Date.now()}"`,
};

/**
 * Quietly verifies session without verbose logging
 * @param request The Next.js request object
 * @returns User data if session is valid, null otherwise
 */
export function verifySession(request: NextRequest): { id: string; email: string; role: string; name?: string } | null {
  const sessionCookie = request.cookies.get('user-session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return verifySessionCookie(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Standard API response for successful requests
 */
export function apiResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { 
    status,
    headers: {
      ...corsHeaders,
      ...noCacheHeaders
    }
  });
}

/**
 * Standard API response for errors
 */
export function apiError(message: string, status: number = 400, details?: any): NextResponse {
  const response: any = { 
    success: false, 
    error: message 
  };
  
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return NextResponse.json(response, { 
    status,
    headers: {
      ...corsHeaders,
      ...noCacheHeaders
    }
  });
}

/**
 * Standard API response for unauthorized requests
 */
export function apiUnauthorized(message: string = 'Unauthorized'): NextResponse {
  return apiError(message, 401);
}

/**
 * Standard API response for validation errors
 */
export function apiValidationError(message: string, errors?: any): NextResponse {
  return apiError(message, 422, errors);
}

/**
 * Standard API response for not found errors
 */
export function apiNotFound(message: string = 'Resource not found'): NextResponse {
  return apiError(message, 404);
}

/**
 * Standard API response for method not allowed
 */
export function methodNotAllowed(allowedMethods: string[]): NextResponse {
  const response = NextResponse.json(
    { success: false, error: 'Method not allowed' }, 
    { 
      status: 405,
      headers: {
        ...corsHeaders,
        ...noCacheHeaders,
        'Allow': allowedMethods.join(', ')
      }
    }
  );
  return response;
}

/**
 * Standard CORS response for OPTIONS requests
 */
export function handleOptionsRequest(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      ...noCacheHeaders
    },
  });
}

/**
 * Enhanced error handler for async operations
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`${errorMessage}:`, error);
    return apiError(
      error.message || errorMessage,
      500,
      {
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    );
  }
}
