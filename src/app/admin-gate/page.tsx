import { redirect } from 'next/navigation';
import { getAdminPanelSession } from '@/lib/adminAuth';
import { ADMIN_PANEL_PATH } from '@/lib/adminPath';
import AdminGateClient from './AdminGateClient';

/**
 * Internal login surface rewritten from the secret admin URL when logged out.
 */
export default async function AdminGatePage() {
  const session = await getAdminPanelSession();
  if (session) {
    redirect(ADMIN_PANEL_PATH);
  }

  return <AdminGateClient />;
}
