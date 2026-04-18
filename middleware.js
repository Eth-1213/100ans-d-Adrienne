/**
 * Vercel Middleware to protect the /admin/dashboard route.
 * This runs at the edge and can redirect users before the static file is even served.
 */
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect routes starting with /admin/dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      // Redirect to login if no token found
      return NextResponse.redirect(new URL('/admin/index.html', request.url));
    }
  }

  return NextResponse.next();
}

// Optional: config to limit where middleware runs for better performance
export const config = {
  matcher: ['/admin/dashboard/:path*'],
};
