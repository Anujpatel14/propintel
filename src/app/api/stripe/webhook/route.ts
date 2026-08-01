import { NextRequest, NextResponse } from 'next/server';
import { getStripe, handleStripeWebhookEvent } from '@/lib/services/stripe';
import { logError } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret || secret.includes('replace')) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 503 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    void logError('Stripe webhook failed', err, { category: 'SYSTEM', path: '/api/stripe/webhook' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook error' },
      { status: 400 }
    );
  }
}
