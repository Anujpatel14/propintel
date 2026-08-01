import { cookies } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma, withDbRetry } from '../db';
import { Role } from '@prisma/client';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  clerkId: string;
}

const MOCK_INVESTOR: UserSession = {
  id: 'mock-investor-id-12345',
  email: 'investor@propintel.com',
  name: 'Alex Investor',
  role: 'INVESTOR',
  clerkId: 'mock_clerk_investor_123',
};

const MOCK_ADMIN: UserSession = {
  id: 'mock-admin-id-67890',
  email: 'admin@propintel.com',
  name: 'Sarah Admin',
  role: 'ADMIN',
  clerkId: 'mock_clerk_admin_456',
};

export const MOCK_USERS = [MOCK_INVESTOR, MOCK_ADMIN];

function isDbConnectivityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes('terminating connection') ||
    message.includes('P1001') ||
    message.includes('P1017') ||
    message.includes('57P01') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('Database is temporarily unavailable') ||
    message.includes('Prisma client is outdated')
  );
}

/**
 * Ensures a sandbox/demo user exists in Neon and returns the DB-backed session.
 */
async function ensureSandboxUserInDb(session: UserSession): Promise<UserSession> {
  return withDbRetry(async () => {
    let dbUser = await prisma.user.findUnique({
      where: { email: session.email },
      include: { profile: true, subscription: true },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: session.clerkId,
          email: session.email,
          name: session.name,
          role: session.role,
          status: 'ACTIVE',
          profile: {
            create: {
              phone: '+1 (555) 019-2834',
              company: session.role === 'INVESTOR' ? 'Apex Equity Partners' : 'PropIntel Corp',
              investorType:
                session.role === 'INVESTOR'
                  ? 'Fix & Flip / Buy & Hold'
                  : 'Platform Administrator',
            },
          },
          subscription: {
            create: {
              plan: session.role === 'INVESTOR' ? 'PRO' : 'ENTERPRISE',
              status: 'ACTIVE',
            },
          },
        },
        include: { profile: true, subscription: true },
      });
    } else if (dbUser.role !== session.role || dbUser.name !== session.name) {
      // Keep sandbox accounts aligned with mock roles (e.g. admin@ always ADMIN)
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          role: session.role,
          name: session.name,
          status: 'ACTIVE',
        },
        include: { profile: true, subscription: true },
      });
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || session.name,
      role: dbUser.role,
      clerkId: dbUser.clerkId,
    };
  });
}

/**
 * Syncs a Clerk user into Neon PostgreSQL database User, Profile, and Subscription tables.
 */
export async function syncClerkUserToDb(
  clerkId: string,
  email: string,
  name?: string
): Promise<UserSession> {
  return withDbRetry(async () => {
    let dbUser = await prisma.user.findUnique({
      where: { clerkId },
      include: { profile: true, subscription: true },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId,
          email,
          name: name || 'Investor User',
          role: 'INVESTOR',
          profile: {
            create: {
              phone: '',
              company: 'Real Estate Investor',
              investorType: 'Fix & Flip / Buy & Hold',
            },
          },
          subscription: {
            create: {
              plan: 'PRO',
              status: 'ACTIVE',
            },
          },
        },
        include: { profile: true, subscription: true },
      });
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || 'Investor User',
      role: dbUser.role,
      clerkId: dbUser.clerkId,
    };
  });
}

/**
 * Gets the current active user session.
 * Tries Sandbox cookie first (for quick demo mode), then falls back to Clerk authentication.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('propintel_session');

    if (sessionCookie?.value) {
      const session = JSON.parse(sessionCookie.value) as UserSession;

      try {
        return await ensureSandboxUserInDb(session);
      } catch (dbErr) {
        console.error('Sandbox session DB resolve failed:', dbErr);
        // Soft-fail so layouts can redirect to login instead of hard-crashing
        if (isDbConnectivityError(dbErr)) {
          return null;
        }
        return null;
      }
    }
  } catch (cookieErr) {
    console.error('Sandbox cookie parse failed:', cookieErr);
  }

  try {
    const clerkAuth = await auth();
    if (clerkAuth?.userId) {
      const user = await currentUser();
      const email = user?.emailAddresses[0]?.emailAddress;
      if (email) {
        const name =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.username ||
          undefined;
        return await syncClerkUserToDb(clerkAuth.userId, email, name);
      }
    }
  } catch (clerkErr) {
    if (isDbConnectivityError(clerkErr)) {
      console.error('Clerk user DB sync failed:', clerkErr);
      return null;
    }
  }

  return null;
}

/**
 * Logs in a simulated user by ensuring Neon row exists, then setting a secure cookie.
 */
export async function signInMockUser(email: string): Promise<UserSession | null> {
  const targetUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!targetUser) return null;

  // Ensure DB user exists BEFORE setting cookie so the next request can resolve auth
  let dbSession: UserSession;
  try {
    dbSession = await ensureSandboxUserInDb(targetUser);
  } catch (err) {
    console.error('Login DB sync failed:', err);
    const detail = err instanceof Error ? err.message : String(err);
    if (detail.includes('outdated') || detail.includes('prisma generate')) {
      throw new Error(detail);
    }
    throw new Error(
      'Database is waking up or unreachable. Wait a few seconds and try the sandbox login again.'
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    'propintel_session',
    JSON.stringify({
      ...targetUser,
      id: dbSession.id,
    }),
    {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  return dbSession;
}

/**
 * Signs out the simulated user.
 */
export async function signOutMockUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('propintel_session');
}

/**
 * Validates that user is authenticated, otherwise throws error.
 */
export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized access. Please log in.');
  }
  return user;
}
