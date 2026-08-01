import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Keep this file minimal. Next 16 + Turbopack has intermittent 404s on nested
 * routes when middleware does heavy work (route matchers, outbound fetch, etc.).
 * Auth gating for dashboard/admin stays here; request logging lives elsewhere.
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/api/log') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/webhooks')
  ) {
    return NextResponse.next({ request: req });
  }

  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  if (isProtected) {
    const session = await auth();
    if (!session.userId) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: req });
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
