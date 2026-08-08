import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except /admin/login and /admin/reset-password)
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/admin/reset-password')
  ) {
    const token =
      request.cookies.get('govcms_access_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      // Let client-side ProtectedRoute handle redirect if token is in localStorage
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
