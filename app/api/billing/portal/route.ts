import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getTenantContext(request as any);

  if (!ctx?.organization) {
    return NextResponse.json(
      { error: 'No organization found. Create or join an organization first.' },
      { status: 400 }
    );
  }

  const customerId = ctx.subscription?.billingCustomerId ?? `org_${ctx.organization.id}`;

  if (!customerId) {
    return NextResponse.json(
      { error: 'No billing customer found. Start checkout before opening the portal.' },
      { status: 400 }
    );
  }

  try {
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

    // Build the hosted portal URL directly using the subscription ID
    const subscriptionId = ctx.subscription?.billingSubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found. Please purchase a plan before accessing the billing portal.', code: 'no_subscription' },
        { status: 400 }
      );
    }

    const portalUrl = new URL(`${process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN}/hosted/portal`);
    portalUrl.searchParams.set('subscriptionId', subscriptionId);
    portalUrl.searchParams.set('returnUrl', returnUrl);

    return NextResponse.json({ url: portalUrl.toString() });
  } catch (error) {
    console.error('Portal session error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Could not create hosted billing portal session';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
