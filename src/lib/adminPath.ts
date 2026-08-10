/** Obscured public URL for the admin console (browser-facing). */
export const ADMIN_PANEL_PATH = '/pintel-4dmin-p4n3l-9f2a';

export function isAdminPanelPath(pathname: string): boolean {
  return pathname === ADMIN_PANEL_PATH || pathname.startsWith(`${ADMIN_PANEL_PATH}/`);
}

export function isInternalAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/** Build a public admin href from an internal `/admin/...` path or subpath. */
export function adminHref(subpath = ''): string {
  const raw = subpath.trim();
  if (!raw || raw === '/' || raw === '/admin') return ADMIN_PANEL_PATH;
  const withoutAdmin = raw.replace(/^\/admin\/?/, '').replace(/^\//, '');
  return withoutAdmin ? `${ADMIN_PANEL_PATH}/${withoutAdmin}` : ADMIN_PANEL_PATH;
}

/** Map public secret URL → internal App Router path under `/admin`. */
export function toInternalAdminPath(pathname: string): string {
  if (pathname === ADMIN_PANEL_PATH || pathname === `${ADMIN_PANEL_PATH}/`) return '/admin';
  if (pathname.startsWith(`${ADMIN_PANEL_PATH}/`)) {
    return `/admin/${pathname.slice(ADMIN_PANEL_PATH.length + 1)}`;
  }
  return pathname;
}

/** Map internal `/admin` path → public secret URL. */
export function toPublicAdminPath(pathname: string): string {
  if (pathname === '/admin' || pathname === '/admin/') return ADMIN_PANEL_PATH;
  if (pathname.startsWith('/admin/')) {
    return `${ADMIN_PANEL_PATH}/${pathname.slice('/admin/'.length)}`;
  }
  return pathname;
}
