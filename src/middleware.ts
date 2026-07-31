import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Sandbox demo cookie bypasses Clerk entirely
  const sandbox = req.cookies.get('propintel_session')?.value;
  if (sandbox) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // Prefer our /login page over Clerk hosted UI for unauthenticated users
  try {
    const session = await auth();
    if (session.userId) {
      return NextResponse.next();
    }
  } catch (err) {
    console.error('Clerk auth check failed; redirecting to sandbox login:', err);
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
