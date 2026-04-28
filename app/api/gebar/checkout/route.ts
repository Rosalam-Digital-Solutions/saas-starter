import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, organizations, memberships, subscriptions } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { getGebarPlanByKey } from '@/lib/payments/plans';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== GEBAR CHECKOUT CALLBACK ===');
  
  const searchParams = request.nextUrl.searchParams;
  const orgId = searchParams.get('teamId');
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

  const billingCustomerId = `org_${orgId}`;

  console.log('Updating organization:', orgId);
  console.log('Billing status: pending');
  console.log('Billing customer ID:', billingCustomerId);

  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, Number(orgId)),
  });

  if (existingSub) {
    await db
      .update(subscriptions)
      .set({
        billingProvider: 'gebar',
        billingCustomerId: billingCustomerId,
        planId: plan.gebarPlanId,
        planName: plan.name,
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.organizationId, Number(orgId)));
  } else {
    await db.insert(subscriptions).values({
      organizationId: Number(orgId),
      billingProvider: 'gebar',
      billingCustomerId: billingCustomerId,
      planId: plan.gebarPlanId,
      planName: plan.name,
      status: 'pending',
    });
  }

  console.log('Organization updated, redirecting to dashboard');

  return NextResponse.redirect(new URL('/dashboard', request.url));
}