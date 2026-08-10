import type { Metadata } from 'next';
import { LegalDoc } from '@/components/LegalDoc';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How PropIntel uses cookies and similar technologies.',
};

export default function CookiesPage() {
  return (
    <LegalDoc title="Cookie Policy" updated="August 10, 2026">
      <p>
        PropIntel uses cookies and similar storage to keep you signed in, remember preferences, and
        understand how the product is used.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Essential</h2>
      <p>
        Required for authentication sessions, CSRF protection, and core app functionality. These cannot
        be disabled if you want to use the signed-in product.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Preferences</h2>
      <p>
        Used for settings such as theme (light/dark) stored in local browser storage so your workspace
        looks consistent across visits.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Analytics</h2>
      <p>
        We may use privacy-conscious analytics to understand feature usage and improve reliability. Where
        required, we will provide controls consistent with applicable law.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Managing cookies</h2>
      <p>
        You can clear cookies and site data in your browser settings. Doing so may sign you out of
        PropIntel. Questions:{' '}
        <a href="mailto:hello@propintel.com" className="text-[#93c5fd] hover:underline">
          hello@propintel.com
        </a>
        .
      </p>
    </LegalDoc>
  );
}
