import { redirect } from 'next/navigation';
import { ADMIN_PANEL_PATH } from '@/lib/adminPath';

/** Legacy /ops → secret admin panel URL */
export default function OpsRedirectPage() {
  redirect(ADMIN_PANEL_PATH);
}
