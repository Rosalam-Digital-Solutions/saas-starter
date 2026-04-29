import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { organizations, memberships, subscriptions } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { createOrUpdateSubscription } from '@/lib/db/queries';
import { createCheckoutSession } from '@/lib/payments/gebar';
import { getGebarPlanByKey, validatePlanConfig } from '@/lib/payments/plans';
import { getTenantContext } from '@/lib/tenant';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== GEBAR CHECKOUT SESSION REQUEST ===');

  let body: { planKey?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const planKey = body.planKey;

  if (!planKey) {
    return NextResponse.json({ error: 'Missing planKey' }, { status: 400 });
  }

  const ctx = await getTenantContext(request);

  if (!ctx?.user || !ctx.organization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = getGebarPlanByKey(planKey);

  if (!plan) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    validatePlanConfig(plan);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid plan configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const session = await createCheckoutSession({
      request,
      organization: ctx.organization,
      planKey,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Failed to create Gebar checkout session:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('=== GEBAR CHECKOUT CALLBACK ===');
  
  const searchParams = request.nextUrl.searchParams;
  const orgId =
    searchParams.get('organizationId') || searchParams.get('teamId');
  const planKey = searchParams.get('planKey');

  console.log('Callback params:', { orgId, planKey });

  if (!orgId || !planKey) {
    console.log('Missing params, redirecting to pricing');
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session?.user) {
    console.log('No session, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const plan = getGebarPlanByKey(planKey);
  if (!plan) {
    console.log('Invalid plan key:', planKey);
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  console.log('Plan:', plan.name, plan.gebarPlanId);

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, parseInt(session.user.id)),
  });

  if (!membership || membership.organizationId !== Number(orgId)) {
    console.log('User not authorized for this organization');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, Number(orgId)),
  });

  if (!org) {
    console.log('Organization not found');
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, Number(orgId)),
  });

  const billingCustomerId = existingSub?.billingCustomerId ?? `org_${orgId}`;

  console.log('Updating organization:', orgId);
  console.log('Billing status: pending');
  console.log('Billing customer ID:', billingCustomerId);

  await createOrUpdateSubscription(Number(orgId), {
    billingProvider: 'gebar',
    billingCustomerId,
    planId: plan.gebarPlanId,
    planName: plan.name,
    status: 'pending',
  });

  console.log('Organization updated, redirecting to dashboard');

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
