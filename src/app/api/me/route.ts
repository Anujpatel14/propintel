import { NextResponse } from 'next/server';
import { resolveAppUser } from '@/lib/services/auth';

export async function GET() {
  const resolved = await resolveAppUser();

  if (resolved.status === 'anonymous') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (resolved.status === 'db_unavailable' || resolved.status === 'sync_error') {
    return NextResponse.json({ authenticated: false, error: resolved.status }, { status: 503 });
  }

  const { user } = resolved;
  return NextResponse.json({
    authenticated: true,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
