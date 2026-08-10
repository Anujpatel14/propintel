'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * YouTube-style top progress bar for App Router navigations.
 * Starts on internal <Link>/<a> clicks and browser back/forward; finishes when the URL settles.
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeRef = useRef(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKeyRef = useRef(routeKey);

  const clearTimers = () => {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const finish = () => {
    if (!activeRef.current) return;
    clearTimers();
    setProgress(100);
    hideTimerRef.current = setTimeout(() => {
      activeRef.current = false;
      setVisible(false);
      setProgress(0);
    }, 220);
  };

  const start = () => {
    if (activeRef.current) return;
    clearTimers();
    activeRef.current = true;
    setVisible(true);
    setProgress(12);
    trickleRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const step = p < 40 ? 8 : p < 70 ? 3.5 : 1.2;
        return Math.min(92, p + step);
      });
    }, 280);
  };

  useEffect(() => {
    if (routeKeyRef.current === routeKey) return;
    routeKeyRef.current = routeKey;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish is stable via refs
  }, [routeKey]);

  useEffect(() => {
    const isInternalNav = (anchor: HTMLAnchorElement) => {
      if (anchor.target && anchor.target !== '_self') return false;
      if (anchor.hasAttribute('download')) return false;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return false;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return false;
      }
      if (url.origin !== window.location.origin) return false;

      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      return next !== current;
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.('a');
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNav(anchor)) return;

      start();
    };

    const onPopState = () => start();

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      clearTimers();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px] overflow-hidden"
    >
      <div
        className="h-full origin-left rounded-r-full bg-[#1d4ed8] shadow-[0_0_10px_rgba(29,78,216,0.45)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <React.Suspense fallback={null}>
      <NavigationProgressInner />
    </React.Suspense>
  );
}
