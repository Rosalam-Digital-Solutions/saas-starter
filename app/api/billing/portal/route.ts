import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/payments/gebar';
import { getTenantContext } from '@/lib/tenant';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateHostedUrl(url?: string) {
  const allowedDomains = requiredEnv('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN')
    .split(',')
    .map(d => d.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (allowedDomains.length === 0) {
    throw new Error('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN must include at least one domain');
  }

  if (!url) {
    throw new Error('No hosted portal URL returned');
  }

  if (!allowedDomains.some(domain => url.startsWith(domain))) {
    throw new Error('Unexpected hosted portal URL returned');
  }
}

export async function POST(request: NextRequest) {
  let body: { returnUrl?: string } = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const ctx = await getTenantContext(request);

  if (!ctx?.user || !ctx.organization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ctx.subscription?.billingCustomerId) {
    return NextResponse.json(
      { error: 'No billing customer found. Start checkout before opening the portal.' },
      { status: 400 }
    );
  }

  try {
    const portal = await createCustomerPortalSession({
      request,
      organization: ctx.organization,
      returnUrl: body.returnUrl,
    });

    validateHostedUrl(portal.url);

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not create hosted billing portal session';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
