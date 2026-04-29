'use client';

import type { BillingSubscriptionState } from '@/lib/billing/access';

const allowedCheckoutDomains = [
  (process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN || 'https://checkout.gebar.et').replace(/\/+$/, ''),
  'https://cs.unibee.dev',
];

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (!res.ok) {
    throw new Error(data.error || 'Billing request failed');
  }

  return data;
}

export async function getSubscription() {
  const res = await fetch('/api/billing/subscription', {
    headers: { Accept: 'application/json' },
  });

  return readJson<BillingSubscriptionState>(res);
}

export async function createCheckoutSession(planId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId,
      successUrl: `${appUrl}/billing/success`,
      cancelUrl: `${appUrl}/billing/cancel`,
    }),
  });

  return readJson<{ url: string }>(res);
}

export async function createPortalSession() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const res = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      returnUrl: `${appUrl}/dashboard/billing?updated=true`,
    }),
  });

  return readJson<{ url: string }>(res);
}

export function redirectToHostedBilling(url: string) {
  if (!url) {
    throw new Error('No hosted billing URL returned');
  }

  if (!allowedCheckoutDomains.some(domain => url.startsWith(domain))) {
    throw new Error('Unexpected hosted billing URL returned');
  }

  window.location.assign(url);
}
