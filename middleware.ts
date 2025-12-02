import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Get the session token from the user's cookies
  const sessionToken = request.cookies.get('auth-token');
  
  // Check if token exists AND has a value. 
  // If the user just logged out, the cookie might still exist but be empty string.
  const hasValidToken = sessionToken && sessionToken.value.length > 0;

  const publicPaths = [
    '/auth/login',
    '/auth/register'
  ];

  const requestedPath = request.nextUrl.pathname;
  const isPublicPath = publicPaths.some(path => requestedPath.startsWith(path));

  // --- Logic ---

  // SCENARIO 1: User is trying to access a PUBLIC page (Login/Register)
  if (isPublicPath) {
    // If they are ALREADY logged in, kick them to the dashboard
    if (hasValidToken) {
      return NextResponse.redirect(new URL('/auth/dashboard/customers', request.url));
    }
    // If they are NOT logged in, let them stay on the login page
    return NextResponse.next();
  }

  // SCENARIO 2: User is trying to access a PROTECTED page (Dashboard, etc.)
  if (!hasValidToken) {
    // If they are NOT logged in, kick them to the login page
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}