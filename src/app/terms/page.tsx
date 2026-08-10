import type { Metadata } from 'next';
import { LegalDoc } from '@/components/LegalDoc';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of the PropIntel platform.',
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" updated="August 10, 2026">
      <p>
        By accessing PropIntel you agree to these terms. If you use PropIntel on behalf of an
        organization, you represent that you have authority to bind that organization.
      </p>
      <h2 className="font-display text-lg font-bold text-white">The service</h2>
      <p>
        PropIntel provides investment analysis tools, CRM, reporting, and related features. Outputs are
        informational decision support — not legal, tax, lending, or investment advice. You remain
        responsible for offers, financing, and due diligence.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Accounts & plans</h2>
      <p>
        You must provide accurate account information and keep credentials secure. Free and paid plan
        limits (analyses, AI, seats) apply as shown on Pricing. Trials convert or expire per the plan
        you select.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Acceptable use</h2>
      <p>
        Do not misuse the platform, attempt unauthorized access, scrape beyond permitted use, or upload
        unlawful content. We may suspend accounts that violate these terms.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Contact</h2>
      <p>
        For terms questions, email{' '}
        <a href="mailto:hello@propintel.com" className="text-[#93c5fd] hover:underline">
          hello@propintel.com
        </a>
        .
      </p>
    </LegalDoc>
  );
}
