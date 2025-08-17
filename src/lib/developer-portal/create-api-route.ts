import { NextRequest, NextResponse } from 'next/server';

import { apiResponse, apiError, handleOptionsRequest, methodNotAllowed } from './api-utils';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
type RouteHandlers = Partial<Record<HttpMethod, (req: NextRequest, context?: any) => Promise<NextResponse>>>;

/**
 * Creates a set of standardized route handlers with proper CORS and error handling
 * @param handlers Object containing handlers for different HTTP methods
 * @returns Object with handler functions for each HTTP method
 */
export function createApiRoute(handlers: RouteHandlers) {
  // Always include OPTIONS handler for CORS preflight
  const allHandlers: RouteHandlers = {
    OPTIONS: async () => handleOptionsRequest(),
    ...handlers,
  };
  
  // Create wrapped handlers for each HTTP method
  const wrappedHandlers: Record<string, any> = {};
  
  // Standard HTTP methods to handle
  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  
  methods.forEach(method => {
    if (allHandlers[method]) {
      // Wrap the handler with error handling
      wrappedHandlers[method] = async (req: NextRequest, context?: any) => {
        try {
          return await allHandlers[method]!(req, context);
        } catch (error: any) {
          console.error(`[API] Error in ${method} handler for ${req.nextUrl.pathname}:`, error);
          return apiError(
            error.message || `Error processing ${method} request`,
            500,
            {
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
              cause: error.cause,
            }
          );
        }
      };
    } else {
      // For methods without handlers, return Method Not Allowed
      wrappedHandlers[method] = async () => {
        const allowedMethods = Object.keys(allHandlers) as HttpMethod[];
        return methodNotAllowed(allowedMethods);
      };
    }
  });
  
  return wrappedHandlers;
}
