import { NextResponse } from 'next/server';
import { resolveAppUser } from '@/lib/services/auth';

/**
 * Forces a Clerk → DB sync for the current session.
 * Used by the "Finishing your workspace" screen to recover after signup.
 */
export async function POST() {
  const resolved = await resolveAppUser();

  if (resolved.status === 'anonymous') {
    return NextResponse.json({ ok: false, status: 'anonymous' }, { status: 401 });
  }

  if (resolved.status === 'ready') {
    return NextResponse.json({
      ok: true,
      status: 'ready',
      user: { id: resolved.user.id, email: resolved.user.email },
    });
  }

  if (resolved.status === 'suspended') {
    return NextResponse.json({ ok: false, status: 'suspended' }, { status: 403 });
  }

  return NextResponse.json(
    {
      ok: false,
      status: resolved.status,
      reason: resolved.reason,
      clerkId: resolved.clerkId,
    },
    { status: 503 }
  );
}

export async function GET() {
  return POST();
}
