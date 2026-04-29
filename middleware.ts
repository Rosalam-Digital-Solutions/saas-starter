import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/admin', '/settings'];
const authRoutes = ['/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth during static generation (no headers in some build contexts)
  const host = request.headers.get('host');
  if (!host || host.includes('localhost') && process.env.NODE_ENV === 'production') {
    return NextResponse.next();
  }
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Get session using Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  // Redirect to sign-in if accessing protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(
      new URL(`/sign-in?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }
  
  // Redirect to dashboard if already logged in and trying to access auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
