import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { Organization, Subscription } from '@/lib/db/schema';
import { getSessionFromRequest, getOrganizationSubscription } from '@/lib/db/queries';
import { getGebarPlanByKey, validatePlanConfig } from './plans';

export interface CheckoutSessionParams {
  request: NextRequest;
  organization: Organization | null;
  planKey: string;
}

export async function createCheckoutSession({
  request,
  organization,
  planKey
}: CheckoutSessionParams) {
  console.log('=== CREATE CHECKOUT SESSION ===');
  console.log('Plan key:', planKey);
  console.log('Organization:', organization?.id);

  const session = await getSessionFromRequest(request);

  if (!session?.user || !organization) {
    console.log('No session or organization, redirecting to sign-up');
    redirect(`/sign-up?redirect=checkout&planKey=${planKey}`);
  }

  const plan = getGebarPlanByKey(planKey);
  if (!plan) {
    console.error('Invalid plan key:', planKey);
    throw new Error(`Invalid plan key: ${planKey}`);
  }

  console.log('Plan found:', plan.name, plan.gebarPlanId);

  try {
    validatePlanConfig(plan);
  } catch (err) {
    console.error('Plan validation failed:', err);
    throw err;
  }

  let GebarBilling: any;
  try {
    const module = await import('@gebarbilling/server');
    GebarBilling = module.default;
  } catch (e) {
    console.error('Failed to import GebarBilling:', e);
    throw new Error('GebarBilling SDK not available');
  }

  const client = new GebarBilling(process.env.GEBARBILLING_SECRET_KEY!, {
    baseUrl: process.env.GEBARBILLING_BASE_URL || 'https://api.gebarbilling.et',
  });

  const existingSubscription = await getOrganizationSubscription(organization.id);
  let billingCustomerId = existingSubscription?.billingCustomerId;
  
  if (!billingCustomerId) {
    billingCustomerId = `org_${organization.id}`;
    console.log('Creating billing customer ID:', billingCustomerId);
  }

  console.log('Using billing customer ID:', billingCustomerId);

  console.log('Creating checkout session with Gebar...');
  console.log('Request:', {
    customerId: billingCustomerId,
    planId: plan.gebarPlanId,
  });

  const checkoutSession = await client.checkout.sessions.create({
    customerId: billingCustomerId,
    planId: plan.gebarPlanId,
    metadata: {
      userId: session.user.id.toString(),
      organizationId: organization.id.toString(),
      organizationSlug: organization.slug,
      planKey: plan.key,
      provider: 'gebar'
    }
  });

  console.log('Checkout session response:', JSON.stringify(checkoutSession, null, 2));

  if (!checkoutSession.url) {
    console.error('No URL in checkout session response');
    throw new Error('Failed to create checkout session. No URL returned.');
  }

  console.log('Redirecting to checkout URL:', checkoutSession.url);
  redirect(checkoutSession.url);
}

export interface PortalSessionParams {
  request: NextRequest;
  organization: Organization;
}

export async function createCustomerPortalSession({
  request,
  organization
}: PortalSessionParams) {
  console.log('=== CREATE CUSTOMER PORTAL SESSION ===');
  console.log('Organization:', organization?.id);

  if (!organization.billingCustomerId) {
    console.log('No billing customer ID, redirecting to pricing');
    redirect('/pricing');
  }

  console.log('Using billing customer ID:', organization.billingCustomerId);

  let GebarBilling: any;
  try {
    const module = await import('@gebarbilling/server');
    GebarBilling = module.default;
  } catch (e) {
    console.error('Failed to import GebarBilling:', e);
    throw new Error('GebarBilling SDK not available');
  }

  const client = new GebarBilling(process.env.GEBARBILLING_SECRET_KEY!, {
    baseUrl: process.env.GEBARBILLING_BASE_URL || 'https://api.gebarbilling.et',
  });

  console.log('Creating portal session with Gebar...');
  const portalSession = await client.portal.sessions.create({
    customerId: organization.billingCustomerId,
    returnUrl: `${process.env.BASE_URL}/dashboard`
  });

  console.log('Portal session response:', JSON.stringify(portalSession, null, 2));

  return portalSession;
}

export function hasBillingAccess(subscription: Subscription | null) {
  if (!subscription) return false;
  return ['active', 'trialing', 'pending'].includes(subscription.status ?? '');
}

export function getBillingStatusMessage(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'Active subscription';
    case 'trialing':
      return 'Trial period';
    case 'pending':
      return 'Processing...';
    case 'canceled':
    case 'cancelled':
      return 'Subscription canceled';
    case 'past_due':
      return 'Payment past due';
    case 'paused':
      return 'Subscription paused';
    default:
      return 'No active subscription';
  }
}

export async function handleGebarSubscriptionEvent(payload: any) {
  console.log('=== HANDLE GEBAR SUBSCRIPTION EVENT ===');
  console.log('Raw payload:', JSON.stringify(payload, null, 2));

  const data = payload.data || payload.object || payload.payload || payload;
  
  const customerId =
    data.customerId ||
    data.customer_id ||
    data.billingCustomerId ||
    data.organizationId;

  if (!customerId) {
    console.error('No customer ID found in webhook payload');
    console.log('Available data keys:', Object.keys(data));
    return;
  }

  console.log('Extracted customer ID:', customerId);

  const { getSubscriptionByBillingCustomerId, createOrUpdateSubscription } = await import('@/lib/db/queries');
  const subscription = await getSubscriptionByBillingCustomerId(customerId);

  if (!subscription) {
    console.error('No subscription found for billing customer:', customerId);
    return;
  }

  const subscriptionId =
    data.subscriptionId ||
    data.subscription_id ||
    data.id;

  const planId =
    data.planId ||
    data.plan_id ||
    data.productId;

  const planName =
    data.planName ||
    data.plan_name ||
    data.productName;

  const status =
    data.status ||
    data.subscriptionStatus;

  const currentPeriodEnd =
    data.currentPeriodEnd ||
    data.current_period_end ||
    data.periodEnd;

  const updateData: any = {
    billingProvider: 'gebar',
    billingSubscriptionId: subscriptionId,
    planId: planId,
    planName: planName,
    status: status,
  };

  if (currentPeriodEnd) {
    updateData.currentPeriodEnd = new Date(currentPeriodEnd);
  }

  console.log('Status:', status);
  console.log('Updating subscription with:', JSON.stringify(updateData, null, 2));

  await createOrUpdateSubscription(subscription.organizationId, updateData);

  console.log('Subscription updated successfully');
}