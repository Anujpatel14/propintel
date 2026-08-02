import type { Metadata } from 'next';
import { Syne, Outfit, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from './providers';
import { clerkAppearance } from '@/lib/clerkAppearance';
import './globals.css';

const display = Syne({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const body = Outfit({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'PropIntel — Real Estate Investment Intelligence',
    template: '%s · PropIntel',
  },
  description:
    'Analyze deals, track cash flow, manage pipelines, and generate AI-powered investment insights for wholesalers, flippers, and rental investors.',
  icons: {
    icon: [{ url: '/brand/mark.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/brand/icon.png' }],
  },
  openGraph: {
    title: 'PropIntel — Real Estate Investment Intelligence',
    description:
      'Analyze deals, track cash flow, manage pipelines, and generate AI-powered investment insights.',
    images: [{ url: '/brand/logo.png', width: 1200, height: 675, alt: 'PropIntel' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col font-sans text-foreground"
        suppressHydrationWarning
      >
        {/* Clerk v7 + Next 16: provider must be inside <body>, not wrapping <html> */}
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          dynamic
          afterSignOutUrl="/login"
          signInUrl="/login"
          signUpUrl="/login?tab=register"
          appearance={clerkAppearance}
        >
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
