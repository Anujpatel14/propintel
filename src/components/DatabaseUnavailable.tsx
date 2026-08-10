import Link from 'next/link';
import { BrandMark } from '@/components/BrandLogo';

/** Shown when Clerk auth succeeded but Prisma/DATABASE_URL is unavailable. */
export default function DatabaseUnavailable() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-5 py-12 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="font-display text-xl font-bold tracking-tight">PropIntel</span>
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">
          Database not connected
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          You signed in successfully, but the app cannot sync your account because{' '}
          <code className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-xs">DATABASE_URL</code>{' '}
          is missing or invalid in <code className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-xs">.env</code>.
        </p>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>
            Open <code className="text-xs">propintel/.env</code> and set a real Postgres{' '}
            <code className="text-xs">DATABASE_URL</code> / <code className="text-xs">DIRECT_URL</code>.
          </li>
          <li>
            Restart the dev server, then run{' '}
            <code className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-xs">npx prisma db push</code>.
          </li>
          <li>Reload this page.</li>
        </ol>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Try again
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)]"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
