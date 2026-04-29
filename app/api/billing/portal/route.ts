import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/payments/gebar';
import { getTenantContext } from '@/lib/tenant';

function validateHostedUrl(url?: string) {
  const checkoutDomain =
    (process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN || 'https://checkout.gebar.et').replace(/\/+$/, '');

  if (!url) {
    throw new Error('No hosted portal URL returned');
  }

  if (!url.startsWith(checkoutDomain)) {
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
