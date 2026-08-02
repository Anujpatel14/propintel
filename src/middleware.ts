import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Auth gate for /dashboard and /admin.
 *
 * IMPORTANT: keep this file named `middleware.ts`, NOT `proxy.ts`.
 * Next.js 16.2.x + Turbopack has a known bug where `src/proxy.ts` makes
 * valid App Router routes return 404 in `next dev` even though the proxy
 * runs (see vercel/next.js#92921, #94739). Keep the Clerk auth gate in
 * `src/middleware.ts` until that bug is fixed upstream.
 *
 * Matcher follows Clerk’s recommended pattern so request auth state is
 * decorated for the whole app (needed by ClerkProvider / client hooks).
 * Keep this file tiny — no logging fetch, no heavy route tables.
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
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
