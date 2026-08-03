'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { documentTitleFor, titleFromPath } from '@/lib/pageTitles';

type TitleContextValue = {
  setOverride: (title: string | null) => void;
};

const TitleContext = createContext<TitleContextValue>({ setOverride: () => undefined });

function applyDocumentTitle(title: string) {
  if (typeof document === 'undefined') return;
  if (document.title !== title) {
    document.title = title;
  }
}

/**
 * Keeps the browser tab title in sync with the route.
 * Next's metadata system can overwrite `document.title` after client nav —
 * we re-apply via useLayoutEffect + a MutationObserver so the route title wins.
 * Pages can call `usePageTitle('…')` for in-page overrides (tabs, etc.).
 */
export function DocumentTitleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const [override, setOverrideState] = useState<string | null>(null);
  const overrideForPath = useRef<string | null>(null);

  const setOverride = useCallback(
    (title: string | null) => {
      overrideForPath.current = pathname;
      setOverrideState(title);
    },
    [pathname]
  );

  const pageTitle = useMemo(() => {
    const active =
      override && overrideForPath.current === pathname ? override : null;
    return active || titleFromPath(pathname);
  }, [override, pathname]);

  const fullTitle = useMemo(() => documentTitleFor(pageTitle), [pageTitle]);

  useLayoutEffect(() => {
    // Drop stale overrides when the path changes (unless set for this path).
    if (overrideForPath.current !== pathname) {
      setOverrideState(null);
    }
  }, [pathname]);

  useLayoutEffect(() => {
    applyDocumentTitle(fullTitle);

    const titleEl = document.querySelector('title');
    if (!titleEl) return;

    const observer = new MutationObserver(() => {
      applyDocumentTitle(fullTitle);
    });
    observer.observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [fullTitle]);

  const value = useMemo(() => ({ setOverride }), [setOverride]);

  return <TitleContext.Provider value={value}>{children}</TitleContext.Provider>;
}

/** Set a custom browser tab title for the current view (clears on unmount). */
export function usePageTitle(title: string | null | undefined) {
  const { setOverride } = useContext(TitleContext);

  useLayoutEffect(() => {
    if (!title) {
      setOverride(null);
      return;
    }
    setOverride(title);
    return () => setOverride(null);
  }, [title, setOverride]);
}
