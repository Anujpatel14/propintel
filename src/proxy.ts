import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Next.js 16 renamed middleware → proxy. Keep this file tiny:
 * only auth-gate /dashboard and /admin. Nested-route 404s under Turbopack
 * are commonly triggered by heavy middleware (route matchers, logging fetch, etc.).
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session.userId) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
