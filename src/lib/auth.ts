import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE_NAME = 'admin-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function checkAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    
    if (!authCookie) {
      return false;
    }

    // Simple validation - in production you might want to use JWT or similar
    const adminPassword = process.env.ADMIN_LOGIN;
    return authCookie.value === `admin-${adminPassword}`;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_LOGIN;
  return password === adminPassword;
}

export function createAuthCookie(): string {
  const adminPassword = process.env.ADMIN_LOGIN;
  return `admin-${adminPassword}`;
}

export function setAuthCookie(response: NextResponse): NextResponse {
  const cookieValue = createAuthCookie();
  
  response.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}

export function checkAuthMiddleware(request: NextRequest): NextResponse | null {
  const authCookie = request.cookies.get(ADMIN_COOKIE_NAME);
  
  if (!authCookie) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const adminPassword = process.env.ADMIN_LOGIN;
  if (authCookie.value !== `admin-${adminPassword}`) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return null; // Auth is valid, continue
} 