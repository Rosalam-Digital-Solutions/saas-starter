'use client';

import type { BillingSubscriptionState } from '@/lib/billing/access';

function requiredPublicEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const appUrl = requiredPublicEnv('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL);
const allowedCheckoutDomains = requiredPublicEnv(
  'NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN',
  process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN
)
  .split(',')
  .map(d => d.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (allowedCheckoutDomains.length === 0) {
  throw new Error('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN must include at least one domain');
}

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

export async function syncSubscription() {
  const res = await fetch('/api/billing/subscription/sync', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  return readJson<BillingSubscriptionState>(res);
}

export async function createCheckoutSession(planId: string) {
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
  const res = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      returnUrl: `${appUrl}/dashboard?billing=updated`,
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
