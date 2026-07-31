'use server';

import { getCurrentUser } from '@/lib/services/auth';
import { updateSubscriptionStatus } from '@/lib/services/stripe';

export async function processCheckoutAction(plan: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated.');
  }

  // Update subscription status in DB
  await updateSubscriptionStatus(user.id, plan, 'ACTIVE');

  return { success: true };
}
