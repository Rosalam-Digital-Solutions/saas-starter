import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/payments/gebar';
import { generateUniqueSlug } from '@/lib/db/queries';
import { getGebarPlanByKey, getGebarPlans, validatePlanConfig } from '@/lib/payments/plans';
import { createOrganization, getSession, getTenantContext } from '@/lib/tenant';

function findPlanKey(planId: string) {
  return getGebarPlans().find(
    (plan) => plan.key === planId || plan.gebarPlanId === planId
  )?.key;
}

function validateHostedUrl(url?: string) {
  const allowedDomains = [
    (process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN || 'https://checkout.gebar.et').replace(/\/+$/, ''),
    'https://cs.unibee.dev',
  ];

  if (!url) {
    throw new Error('No hosted checkout URL returned');
  }

  if (!allowedDomains.some(domain => url.startsWith(domain))) {
    throw new Error('Unexpected hosted checkout URL returned');
  }
}

export async function POST(request: NextRequest) {
  let body: { planId?: string; successUrl?: string; cancelUrl?: string };

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

  const session = await getSession(request);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getTenantContext(request);
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
    validatePlanConfig(plan);
    const session = await createCheckoutSession({
      request,
      organization,
      planKey,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });

    validateHostedUrl(session.url);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Could not create hosted checkout session';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
