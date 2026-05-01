import { NextResponse } from 'next/server';
import { gebar } from '@/lib/billing/gebar';
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
    console.log('Creating portal session for customer:', customerId);
    console.log('GEBARBILLING_BASE_URL:', process.env.GEBARBILLING_BASE_URL);

    const portalSession = await gebar.billingPortal.sessions.create({
      customerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    console.log('Portal session response:', portalSession);

    if (!portalSession.url) {
      return NextResponse.json(
        { error: 'Portal session did not return a hosted URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    const message =
      error instanceof Error
        ? error.message
        : 'Could not create hosted billing portal session';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
