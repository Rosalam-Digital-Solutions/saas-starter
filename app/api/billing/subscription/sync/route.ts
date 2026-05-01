import { NextRequest, NextResponse } from 'next/server';
import { toBillingSubscriptionState } from '@/lib/billing/access';
import { syncOrganizationSubscriptionFromGebar } from '@/lib/payments/gebar';
import { getSession, getTenantContext } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  const session = await getSession(request);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getTenantContext(request);

  if (!ctx?.user || !ctx.organization) {
    return NextResponse.json(toBillingSubscriptionState(null));
  }

  try {
    const subscription = await syncOrganizationSubscriptionFromGebar(ctx.organization.id);
    return NextResponse.json(toBillingSubscriptionState(subscription));
  } catch (error) {
    console.error('Failed to sync Gebar subscription:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Could not refresh subscription from Gebar';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
