import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma, withDbRetry } from '../db';
import { Role } from '@prisma/client';
import { logError, recordAudit } from '@/lib/logger';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  clerkId: string;
  status: string;
}

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
    message.includes('Prisma client is outdated') ||
    message.includes('Unique constraint') ||
    message.includes('P2002') ||
    message.includes('Environment variable not found: DATABASE_URL') ||
    message.includes('PrismaClientInitializationError') ||
    message.includes('Can\'t reach database') ||
    message.includes('datasource url')
  );
}

function resolveRole(email: string, existing?: Role | null): Role {
  if (existing === 'ADMIN') return 'ADMIN';
  const normalized = email.toLowerCase();
  if (normalized === 'admin@propintel.com') return 'ADMIN';
  const fromEnv = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.includes(normalized)) return 'ADMIN';
  return existing || 'INVESTOR';
}

function toSession(
  dbUser: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    clerkId: string | null;
    status?: string | null;
  },
  fallbackName: string,
  clerkId: string
): UserSession {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name || fallbackName,
    role: dbUser.role,
    clerkId: dbUser.clerkId || clerkId,
    status: dbUser.status || 'ACTIVE',
  };
}

/** At most one LOGIN audit row per user per 12 hours. */
async function maybeRecordLogin(userId: string) {
  try {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const recent = await withDbRetry(() =>
      prisma.activityLog.findFirst({
        where: { userId, action: 'LOGIN', createdAt: { gte: since } },
        select: { id: true },
      })
    );
    if (!recent) {
      await recordAudit({
        userId,
        action: 'LOGIN',
        details: 'Signed in via Clerk',
      });
    }
  } catch {
    // non-blocking
  }
}

/**
 * Syncs a Clerk user into the PropIntel User / Profile / Subscription tables.
 */
export async function syncClerkUserToDb(
  clerkId: string,
  email: string,
  name?: string
): Promise<UserSession> {
  const normalized = email.trim().toLowerCase();
  const displayName = name || normalized.split('@')[0];

  return withDbRetry(async () => {
    // 1) Prefer clerkId match
    let dbUser = await prisma.user.findUnique({ where: { clerkId } });

    // 2) Else link by email (seeded / previous account)
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({ where: { email: normalized } });
      if (dbUser) {
        // Clear this clerkId from any other row that might hold it
        await prisma.user.updateMany({
          where: { clerkId, NOT: { id: dbUser.id } },
          data: { clerkId: null },
        });
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            clerkId,
            name: name || dbUser.name || displayName,
            // Preserve admin suspensions — do not force ACTIVE
            role: resolveRole(normalized, dbUser.role),
          },
        });
        return toSession(dbUser, displayName, clerkId);
      }
    }

    if (!dbUser) {
      const role = resolveRole(normalized, null);
      try {
        dbUser = await prisma.user.create({
          data: {
            clerkId,
            email: normalized,
            name: displayName,
            role,
            status: 'ACTIVE',
            profile: {
              create: {
                phone: '',
                company: role === 'ADMIN' ? 'PropIntel Corp' : 'Real Estate Investor',
                investorType:
                  role === 'ADMIN' ? 'Platform Administrator' : 'Fix & Flip / Buy & Hold',
              },
            },
            subscription: {
              create: {
                plan: role === 'ADMIN' ? 'ENTERPRISE' : 'FREE',
                status: 'ACTIVE',
              },
            },
          },
        });
      } catch (err) {
        // Race / unique: fetch again by clerkId or email
        dbUser =
          (await prisma.user.findUnique({ where: { clerkId } })) ||
          (await prisma.user.findUnique({ where: { email: normalized } }));
        if (!dbUser) throw err;
        if (!dbUser.clerkId) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { clerkId },
          });
        }
      }
      return toSession(dbUser, displayName, clerkId);
    }

    // Existing clerkId match — keep profile fresh (never wipe SUSPENDED)
    const role = resolveRole(normalized, dbUser.role);
    if (
      dbUser.role !== role ||
      (name && dbUser.name !== displayName) ||
      dbUser.email !== normalized
    ) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          role,
          name: name || dbUser.name || displayName,
          email: normalized,
        },
      });
    }

    return toSession(dbUser, displayName, clerkId);
  });
}

/**
 * Current user from Clerk session, synced into the local database.
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const clerkAuth = await auth();
    if (!clerkAuth?.userId) return null;

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      // Clerk session without email yet — treat as incomplete, not logged out
      void logError('Clerk user missing email', new Error('no email'), {
        category: 'AUTH',
        meta: { clerkId: clerkAuth.userId },
      });
      return null;
    }

    const name =
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
      user?.username ||
      undefined;

    const session = await syncClerkUserToDb(clerkAuth.userId, email, name);
    void maybeRecordLogin(session.id);
    return session;
  } catch (err) {
    void logError('getCurrentUser failed', err, { category: 'AUTH' });
    return null;
  }
}

/**
 * Like getCurrentUser, but distinguishes "no Clerk session" vs DB down vs sync failed.
 */
export async function resolveAppUser(): Promise<
  | { status: 'anonymous' }
  | { status: 'ready'; user: UserSession }
  | { status: 'suspended'; user: UserSession }
  | { status: 'sync_error'; clerkId: string }
  | { status: 'db_unavailable'; clerkId: string }
> {
  const clerkAuth = await auth();
  if (!clerkAuth?.userId) return { status: 'anonymous' };

  try {
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return { status: 'sync_error', clerkId: clerkAuth.userId };
    }

    const name =
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
      user?.username ||
      undefined;

    const session = await syncClerkUserToDb(clerkAuth.userId, email, name);
    if (session.status === 'SUSPENDED') {
      return { status: 'suspended', user: session };
    }
    void maybeRecordLogin(session.id);
    return { status: 'ready', user: session };
  } catch (err) {
    void logError('resolveAppUser failed', err, { category: 'AUTH' });
    if (isDbConnectivityError(err)) {
      return { status: 'db_unavailable', clerkId: clerkAuth.userId };
    }
    return { status: 'sync_error', clerkId: clerkAuth.userId };
  }
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized access. Please log in.');
  }
  if (user.status === 'SUSPENDED') {
    throw new Error('Account suspended. Contact support.');
  }
  return user;
}
