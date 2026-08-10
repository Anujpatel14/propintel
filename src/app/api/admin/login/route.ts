import { NextResponse } from 'next/server';
import {
  adminSessionCookieOptions,
  clearAdminSessionCookieOptions,
  createAdminSessionToken,
  credentialsMatch,
} from '@/lib/adminAuth';

export async function POST(req: Request) {
  let body: { username?: string; password?: string } = {};
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const username = (body.username || '').trim();
  const password = body.password || '';

  if (!username || !password) {
    return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
  }

  if (!credentialsMatch(username, password)) {
    return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createAdminSessionToken(username);
  const res = NextResponse.json({ success: true });
  res.cookies.set(adminSessionCookieOptions(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(clearAdminSessionCookieOptions());
  return res;
}
