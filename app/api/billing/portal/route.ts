import { NextRequest, NextResponse } from 'next/server';
import {
  createCustomerPortalSession,
  syncOrganizationSubscriptionFromGebar,
} from '@/lib/payments/gebar';
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

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return undefined;

  const details = error as {
    code?: string;
    status?: number;
    requestId?: string;
    response?: unknown;
    raw?: unknown;
    details?: unknown;
  };

  return {
    code: details.code,
    status: details.status,
    requestId: details.requestId,
    response: details.response,
    raw: details.raw,
    details: details.details,
  };
}

function isNoManageableSubscriptionError(error: unknown) {
  return (
    error instanceof Error &&
    /no latest subscription found|purchase your first plan|no subscription/i.test(error.message)
  );
}

function canManageSubscription(status: string | null | undefined) {
  return ['active', 'trialing', 'past_due', 'paused'].includes(status ?? '');
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

  let subscription = ctx.subscription;

  if (!subscription?.billingCustomerId) {
    return NextResponse.json(
      { error: 'No billing customer found. Start checkout before opening the portal.' },
      { status: 400 }
    );
  }

  if (!canManageSubscription(subscription.status)) {
    subscription = await syncOrganizationSubscriptionFromGebar(ctx.organization.id);
  }

  if (!canManageSubscription(subscription?.status)) {
    return NextResponse.json(
      { error: 'No manageable subscription found. Choose a plan before opening the portal.' },
      { status: 409 }
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
    if (isNoManageableSubscriptionError(error)) {
      return NextResponse.json(
        { error: 'No manageable subscription found. Choose a plan before opening the portal.' },
        { status: 409 }
      );
    }

    console.error('Portal session error:', {
      message: error instanceof Error ? error.message : 'Unknown portal error',
      ...getErrorDetails(error),
    });

    const message =
      error instanceof Error
        ? error.message
        : 'Could not create hosted billing portal session';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
