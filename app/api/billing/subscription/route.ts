import { NextRequest, NextResponse } from 'next/server';
import { toBillingSubscriptionState } from '@/lib/billing/access';
import { getSession, getTenantContext } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getTenantContext(request);

  if (!ctx?.user || !ctx.organization) {
    return NextResponse.json(toBillingSubscriptionState(null));
  }

  return NextResponse.json(toBillingSubscriptionState(ctx.subscription));
}
