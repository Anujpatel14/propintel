'use server';

import { getCurrentUser } from '@/lib/services/auth';
import { recordAudit } from '@/lib/logger';

/** Record logout audit before client-side Clerk signOut. */
export async function recordLogoutAuditAction() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await recordAudit({
        userId: user.id,
        action: 'LOGOUT',
        details: 'Signed out via Clerk',
      });
    }
  } catch {
    // ignore
  }
}
