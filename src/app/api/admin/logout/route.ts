import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Create redirect response to login page
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  
  // Clear the auth cookie
  return clearAuthCookie(response);
} 