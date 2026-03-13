import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth/jwt-edge';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login'];

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/projects',
  '/calculator',
  '/reports',
  '/analytics',
  '/financial',
  '/team',
  '/settings',
  '/api/projects',
  '/api/templates',
  '/api/users',
  '/api/settings',
  '/api/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });

  if (isProtectedRoute) {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token (async Edge-compatible verification)
    const payload = await verifyTokenEdge(token);

    if (!payload) {
      // Redirect to login if token invalid
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      
      // Clear invalid cookie
      response.cookies.set({
        name: 'auth_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/',
      });
      
      return response;
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-email', payload.email);
      requestHeaders.set('x-user-role', payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
