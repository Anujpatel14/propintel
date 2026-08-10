import type { Metadata } from 'next';
import { LegalDoc } from '@/components/LegalDoc';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How PropIntel collects, uses, and protects your information.',
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="August 10, 2026">
      <p>
        PropIntel (“we”, “us”) provides real estate investment underwriting and portfolio tools. This
        policy explains what we collect and how we use it when you visit our site or use the product.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Information we collect</h2>
      <p>
        Account details (name, email), authentication data via our identity provider, deal and property
        inputs you enter, usage analytics needed to operate the service, and billing information processed
        by our payment provider.
      </p>
      <h2 className="font-display text-lg font-bold text-white">How we use information</h2>
      <p>
        To provide underwriting, CRM, reports, and coaching features; to secure accounts; to process
        subscriptions; and to improve product reliability. We do not sell personal information.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Sharing</h2>
      <p>
        We share data with infrastructure, auth, and payment processors strictly as needed to run
        PropIntel, or when required by law.
      </p>
      <h2 className="font-display text-lg font-bold text-white">Your choices</h2>
      <p>
        You may update profile details in Settings, request account deletion, or contact us at{' '}
        <a href="mailto:hello@propintel.com" className="text-[#93c5fd] hover:underline">
          hello@propintel.com
        </a>
        .
      </p>
    </LegalDoc>
  );
}
