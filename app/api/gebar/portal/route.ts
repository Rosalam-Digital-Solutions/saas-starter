import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/payments/gebar';
import { getTenantContext } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  const ctx = await getTenantContext(request);

  if (!ctx?.user || !ctx.organization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ctx.subscription?.billingCustomerId) {
    return NextResponse.json(
      { error: 'No billing customer' },
      { status: 400 }
    );
  }

  try {
    const portal = await createCustomerPortalSession({
      request,
      organization: ctx.organization,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Failed to create Gebar portal session:', error);
    const message =
      error instanceof Error ? error.message : 'Could not open billing portal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
