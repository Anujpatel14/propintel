import { getAdminPanelSession } from '@/lib/adminAuth';
import { requireAuth, type UserSession } from '@/lib/services/auth';

/**
 * Accepts either:
 * - Admin panel username/password session cookie, or
 * - Clerk user with role ADMIN
 */
export async function requireAdminAccess(): Promise<
  | { kind: 'panel'; username: string }
  | { kind: 'clerk'; user: UserSession }
> {
  const panel = await getAdminPanelSession();
  if (panel) {
    return { kind: 'panel', username: panel.username };
  }

  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('Access denied. Administrator privileges required.');
  }
  return { kind: 'clerk', user };
}
