import { NextResponse } from 'next/server';
import { gebar } from '@/lib/billing/gebar';
import { auth } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/db/queries';
import { getGebarPlanByKey, getGebarPlans } from '@/lib/payments/plans';
import { createOrganization, getTenantContext } from '@/lib/tenant';

function findPlanKey(planId: string) {
  return getGebarPlans().find(
    (plan) => plan.key === planId || plan.gebarPlanId === planId
  )?.key;
}

export async function POST(request: Request) {
  let body: { planId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.planId) {
    return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
  }

  const planKey = findPlanKey(body.planId);
  if (!planKey) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getTenantContext(request as any);
  let organization = ctx?.organization;

  if (!organization) {
    const userName = session.user.name || session.user.email.split('@')[0];
    const organizationName = `${userName}'s Workspace`;
    const slug = await generateUniqueSlug(organizationName);

    organization = await createOrganization(
      parseInt(session.user.id, 10),
      organizationName,
      slug
    );
  }

  const plan = getGebarPlanByKey(planKey);
  if (!plan) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    const checkoutSession = await gebar.checkout.sessions.create({
      email: session.user.email,
      externalUserId: `org_${organization.id}`,
      customerId: ctx?.subscription?.billingCustomerId ?? `org_${organization.id}`,
      planId: plan.gebarPlanId,
      mode: 'subscription',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: 'Checkout session did not return a hosted URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Could not create hosted checkout session';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
