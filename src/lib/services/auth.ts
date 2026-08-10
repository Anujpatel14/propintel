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

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isDbConnectivityError(error: unknown): boolean {
  const message = errorMessage(error);
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
    message.includes('Environment variable not found: DATABASE_URL') ||
    message.includes('PrismaClientInitializationError') ||
    message.includes("Can't reach database") ||
    message.includes('datasource url') ||
    message.includes('does not exist in the current database') ||
    message.includes('P2021') ||
    message.includes('P1003')
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
    if (recent) return;
    await recordAudit({
      userId,
      action: 'LOGIN',
      details: 'Signed in via Clerk',
    });
  } catch {
    // non-blocking — never fail auth because of audit logging
  }
}

async function ensureProfileAndSubscription(
  userId: string,
  role: Role
): Promise<void> {
  try {
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        company: role === 'ADMIN' ? 'PropIntel Corp' : 'Real Estate Investor',
        investorType:
          role === 'ADMIN' ? 'Platform Administrator' : 'Fix & Flip / Buy & Hold',
      },
      update: {},
    });
  } catch (err) {
    void logError('ensureProfile failed', err, { category: 'AUTH', meta: { userId } });
  }

  try {
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: role === 'ADMIN' ? 'ENTERPRISE' : 'FREE',
        status: 'ACTIVE',
      },
      update: {},
    });
  } catch (err) {
    void logError('ensureSubscription failed', err, { category: 'AUTH', meta: { userId } });
  }
}

/**
 * Syncs a Clerk user into the PropIntel User table (then best-effort profile/subscription).
 * Core user row creation must succeed for dashboard access.
 */
export async function syncClerkUserToDb(
  clerkId: string,
  email: string,
  name?: string
): Promise<UserSession> {
  const normalized = email.trim().toLowerCase();
  const displayName = (name || normalized.split('@')[0] || 'Investor').trim() || 'Investor';

  return withDbRetry(async () => {
    let dbUser =
      (await prisma.user.findUnique({ where: { clerkId } })) ||
      (await prisma.user.findUnique({ where: { email: normalized } }));

    if (dbUser && dbUser.clerkId !== clerkId) {
      // Link existing email account to this Clerk id
      await prisma.user.updateMany({
        where: { clerkId, NOT: { id: dbUser.id } },
        data: { clerkId: null },
      });
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          clerkId,
          name: name || dbUser.name || displayName,
          role: resolveRole(normalized, dbUser.role),
        },
      });
    }

    if (!dbUser) {
      const role = resolveRole(normalized, null);
      try {
        // Create the core row only — nested creates used to fail the whole signup.
        dbUser = await prisma.user.create({
          data: {
            clerkId,
            email: normalized,
            name: displayName,
            role,
            status: 'ACTIVE',
          },
        });
      } catch (err) {
        dbUser =
          (await prisma.user.findUnique({ where: { clerkId } })) ||
          (await prisma.user.findUnique({ where: { email: normalized } }));
        if (!dbUser) throw err;
        if (dbUser.clerkId !== clerkId) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { clerkId },
          });
        }
      }
    } else {
      // Keep profile fields fresh; never clear SUSPENDED here
      const role = resolveRole(normalized, dbUser.role);
      const needsUpdate =
        dbUser.role !== role ||
        (name && dbUser.name !== displayName) ||
        dbUser.email !== normalized ||
        dbUser.clerkId !== clerkId;
      if (needsUpdate) {
        try {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              role,
              name: name || dbUser.name || displayName,
              email: normalized,
              clerkId,
            },
          });
        } catch {
          // Email unique race — keep existing row
        }
      }
    }

    await ensureProfileAndSubscription(dbUser.id, dbUser.role);
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

export type ResolveAppUserResult =
  | { status: 'anonymous' }
  | { status: 'ready'; user: UserSession }
  | { status: 'suspended'; user: UserSession }
  | { status: 'sync_error'; clerkId: string; reason: string }
  | { status: 'db_unavailable'; clerkId: string; reason: string };

/**
 * Like getCurrentUser, but distinguishes "no Clerk session" vs DB down vs sync failed.
 */
export async function resolveAppUser(): Promise<ResolveAppUserResult> {
  const clerkAuth = await auth();
  if (!clerkAuth?.userId) return { status: 'anonymous' };

  const clerkId = clerkAuth.userId;

  const attemptSync = async (): Promise<ResolveAppUserResult | { status: 'missing_email' }> => {
    const user = await currentUser();
    if (!user) {
      return {
        status: 'sync_error',
        clerkId,
        reason: 'Clerk user payload was empty. Check CLERK_SECRET_KEY matches the publishable key.',
      };
    }

    const email =
      user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      return { status: 'missing_email' };
    }

    const name =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.username ||
      undefined;

    const session = await syncClerkUserToDb(clerkId, email, name);
    if (session.status === 'SUSPENDED') {
      return { status: 'suspended', user: session };
    }
    void maybeRecordLogin(session.id);
    return { status: 'ready', user: session };
  };

  try {
    let result = await attemptSync();

    if (result.status === 'missing_email') {
      await new Promise((r) => setTimeout(r, 600));
      result = await attemptSync();
    }

    if (result.status === 'missing_email') {
      return {
        status: 'sync_error',
        clerkId,
        reason: 'No email on the Clerk account yet. Add an email in Clerk, then retry.',
      };
    }

    return result;
  } catch (err) {
    const reason = errorMessage(err);
    void logError('resolveAppUser failed', err, { category: 'AUTH', meta: { clerkId, reason } });

    try {
      await new Promise((r) => setTimeout(r, 700));
      const retry = await attemptSync();
      if (retry.status === 'missing_email') {
        return {
          status: 'sync_error',
          clerkId,
          reason: 'No email on the Clerk account yet. Add an email in Clerk, then retry.',
        };
      }
      return retry;
    } catch (retryErr) {
      const retryReason = errorMessage(retryErr);
      void logError('resolveAppUser retry failed', retryErr, {
        category: 'AUTH',
        meta: { clerkId, reason: retryReason },
      });
      if (isDbConnectivityError(err) || isDbConnectivityError(retryErr)) {
        return {
          status: 'db_unavailable',
          clerkId,
          reason: retryReason || reason,
        };
      }
      return { status: 'sync_error', clerkId, reason: retryReason || reason };
    }
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
