import type { Metadata } from 'next';
import { LegalDoc } from '@/components/LegalDoc';

export const metadata: Metadata = {
  title: 'Security',
  description: 'How PropIntel approaches product and account security.',
};

export default function SecurityPage() {
  return (
    <LegalDoc title="Security" updated="August 10, 2026">
      <p>
        We take a pragmatic approach to protecting investor workspaces and the data you entrust to
        PropIntel.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Authentication</h2>
      <p>
        Sign-in is handled by our identity provider (Clerk). Account security settings — password reset,
        sessions, and MFA options exposed by the provider — are available from Login and Settings.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Data & transport</h2>
      <p>
        Application traffic is served over HTTPS. Application data is stored in managed databases with
        access restricted to operational systems. Secrets and API keys are kept in server environment
        configuration, not in client bundles.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Payments</h2>
      <p>
        Card processing is handled by Stripe. PropIntel does not store full card numbers on our servers.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Report an issue</h2>
      <p>
        If you believe you found a vulnerability, contact{' '}
        <a href="mailto:hello@propintel.com" className="text-[#93c5fd] hover:underline">
          hello@propintel.com
        </a>{' '}
        with details so we can investigate.
      </p>
    </LegalDoc>
  );
}
