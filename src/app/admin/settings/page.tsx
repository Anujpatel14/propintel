export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Platform settings</h1>
        <p className="text-sm text-[var(--muted)]">
          API keys and maintenance mode. Values are read from environment in V1.
        </p>
      </div>

      <div className="surface-card space-y-4 p-6 text-sm">
        {[
          ['OpenAI API key', 'OPENAI_API_KEY'],
          ['Property API key', 'RENTCAST_API_KEY / ATTOM'],
          ['Google Maps key', 'NEXT_PUBLIC_GOOGLE_MAPS_KEY'],
          ['Clerk publishable', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
          ['Stripe secret', 'STRIPE_SECRET_KEY'],
        ].map(([label, env]) => (
          <label key={env} className="block space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--muted)]">{label}</span>
            <input
              className="glass-input w-full px-3 py-2 text-xs opacity-70"
              disabled
              value={`Configured via .env → ${env}`}
            />
          </label>
        ))}

        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
          <div>
            <div className="font-bold">Maintenance mode</div>
            <div className="text-xs text-[var(--muted)]">
              When enabled, public traffic sees a maintenance page.
            </div>
          </div>
          <input type="checkbox" disabled className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
