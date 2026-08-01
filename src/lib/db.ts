import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaWarnedOutdated?: boolean;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function hasExpandedModels(client: PrismaClient): boolean {
  return typeof (client as { userSettings?: unknown }).userSettings !== 'undefined';
}

/**
 * Returns a Prisma client. After schema changes, Next may keep a stale singleton;
 * we recreate when possible. Missing new delegates no longer hard-crash login —
 * core models (User, etc.) still work until `prisma generate` + server restart.
 */
function getClient(): PrismaClient {
  const existing = globalForPrisma.prisma;

  // Drop HMR singleton that is clearly missing newer delegates
  if (existing && !hasExpandedModels(existing)) {
    void existing.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    const client = createPrismaClient();
    if (!hasExpandedModels(client) && !globalForPrisma.prismaWarnedOutdated) {
      globalForPrisma.prismaWarnedOutdated = true;
      console.warn(
        '[prisma] Client is missing UserSettings/Order delegates. Run `npx prisma generate` and restart `npm run dev` for full features. Auth/core queries will still work.'
      );
    }
    globalForPrisma.prisma = client;
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

function isRetryableDbError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes('terminating connection') ||
    message.includes('Connection reset') ||
    message.includes('Server has closed the connection') ||
    message.includes('P1001') ||
    message.includes('P1017') ||
    message.includes('57P01') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT')
  );
}

/**
 * Retries Prisma operations when Neon is waking from idle or a pooled
 * connection was terminated by the administrator.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 4
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableDbError(error) || attempt === retries - 1) {
        throw error;
      }

      try {
        await getClient().$disconnect();
      } catch {
        // ignore disconnect failures before retry
      }
      globalForPrisma.prisma = undefined;

      const waitMs = 800 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}
