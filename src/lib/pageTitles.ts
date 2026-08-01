/** Route → browser tab title (segment only; root layout adds `· PropIntel`). */
export const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/login': 'Sign in',
  '/dashboard': 'Overview',
  '/dashboard/analyzer': 'Analyzer',
  '/dashboard/crm': 'CRM Pipeline',
  '/dashboard/deals': 'Saved Deals',
  '/dashboard/compare': 'Compare',
  '/dashboard/coaching': 'Coaching',
  '/dashboard/billing': 'Billing',
  '/dashboard/settings/profile': 'Profile',
  '/dashboard/settings/underwriting': 'Underwriting',
  '/admin': 'Admin',
  '/admin/users': 'Users',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/payments': 'Payments',
  '/admin/deals': 'Deal intelligence',
  '/admin/system/api-usage': 'API usage',
  '/admin/coaching': 'Coaching admin',
  '/admin/cms': 'CMS',
  '/admin/logs': 'Logs',
  '/admin/settings': 'Admin settings',
};

const HOME_DOCUMENT_TITLE = 'PropIntel — Real Estate Investment Intelligence';

/** Resolve the best title for a pathname (longest prefix match). */
export function titleFromPath(pathname: string): string {
  if (!pathname || pathname === '/') return 'Home';

  let best: { len: number; title: string } | null = null;
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path === '/') continue;
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      if (!best || path.length > best.len) {
        best = { len: path.length, title };
      }
    }
  }
  return best?.title ?? 'App';
}

/** Full `document.title` string (includes brand). */
export function documentTitleFor(pageTitle: string): string {
  if (pageTitle === 'Home') return HOME_DOCUMENT_TITLE;
  return `${pageTitle} · PropIntel`;
}
