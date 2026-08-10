import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
import {
  ADMIN_PANEL_PATH,
  isAdminPanelPath,
  isInternalAdminPath,
  toInternalAdminPath,
  toPublicAdminPath,
} from '@/lib/adminPath';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminAuth';

/**
 * Auth gate for /dashboard and the obscured admin panel URL.
 * Admin panel uses username/password cookie auth (not Clerk).
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Never expose /admin in the browser — bounce to the secret URL
  if (isInternalAdminPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = toPublicAdminPath(pathname);
    return NextResponse.redirect(url);
  }

  // Legacy /ops → secret admin entry
  if (pathname === '/ops' || pathname.startsWith('/ops/')) {
    const url = req.nextUrl.clone();
    url.pathname = ADMIN_PANEL_PATH;
    return NextResponse.redirect(url);
  }

  if (isAdminPanelPath(pathname)) {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const adminSession = await verifyAdminSessionToken(token);

    if (!adminSession) {
      if (pathname === ADMIN_PANEL_PATH || pathname === `${ADMIN_PANEL_PATH}/`) {
        const url = req.nextUrl.clone();
        url.pathname = '/admin-gate';
        return NextResponse.rewrite(url);
      }
      const url = req.nextUrl.clone();
      url.pathname = ADMIN_PANEL_PATH;
      return NextResponse.redirect(url);
    }

    const url = req.nextUrl.clone();
    url.pathname = toInternalAdminPath(pathname);
    return NextResponse.rewrite(url);
  }

  const isProtected = pathname.startsWith('/dashboard');

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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
