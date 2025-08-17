/**
 * Utility to help update API routes to use quiet session verification
 * This replaces verbose console.log messages for session verification
 */

export const sessionUpdatePatterns = {
  // Pattern to replace verbose session logging
  oldPattern: /console\.log\(['"`]API: No session cookie found['"`]\);?/g,
  newPattern: '', // Remove the logging entirely

  // Pattern for invalid session logging
  oldInvalidPattern: /console\.log\(['"`]API: Invalid session data['"`]\);?/g,
  newInvalidPattern: '', // Remove the logging entirely
};

export const replacementCode = `
// Replace verbose session checking with quiet verification
import { verifySession, apiUnauthorized } from '@/lib/api-utils';

// Instead of:
// const sessionCookie = request.cookies.get('user-session');
// if (!sessionCookie?.value) {
//   console.log('API: No session cookie found');
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// }

// Use:
// const userData = verifySession(request);
// if (!userData) {
//   return apiUnauthorized();
// }
`;

/**
 * Instructions for manual update of API routes:
 * 
 * 1. Import the new utilities:
 *    import { verifySession, apiUnauthorized, apiError } from '@/lib/api-utils';
 * 
 * 2. Replace session verification code:
 *    OLD:
 *      const sessionCookie = request.cookies.get('user-session');
 *      if (!sessionCookie?.value) {
 *        console.log('API: No session cookie found');
 *        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *      }
 * 
 *    NEW:
 *      const userData = verifySession(request);
 *      if (!userData) {
 *        return apiUnauthorized();
 *      }
 * 
 * 3. Remove verbose logging statements:
 *    - Remove all instances of console.log('API: No session cookie found');
 *    - Remove all instances of console.log('API: Invalid session data');
 */ 