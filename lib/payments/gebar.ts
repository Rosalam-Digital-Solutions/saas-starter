import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { Organization, Subscription } from '@/lib/db/schema';
import {
  createOrUpdateSubscription,
  getSessionFromRequest,
  getOrganizationSubscription,
  getOrganizationById,
  getSubscriptionByBillingCustomerId,
} from '@/lib/db/queries';
import { getGebarPlanByKey, getGebarPlanByPlanId, validatePlanConfig } from './plans';

type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'pending'
  | 'canceled'
  | 'past_due'
  | 'paused';

type NormalizedGebarEvent = {
  eventType: string;
  organizationId?: number;
  billingCustomerId?: string;
  billingSubscriptionId?: string;
  planId?: string;
  planName?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getCheckoutBaseUrl(): string {
  const checkoutBaseUrl = requiredEnv('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN')
    .split(',')[0]
    ?.trim()
    .replace(/\/+$/, '');

  if (!checkoutBaseUrl) {
    throw new Error('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN must include at least one domain');
  }

  return checkoutBaseUrl;
}

function splitName(name?: string | null) {
  if (!name) return { firstName: undefined, lastName: undefined };

  const [firstName, ...rest] = name.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.length ? rest.join(' ') : undefined,
  };
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function firstBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
  }

  return undefined;
}

function parseOrganizationId(value?: string) {
  if (!value) return undefined;

  const rawId = value.startsWith('org_') ? value.slice(4) : value;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function parseGebarDate(value: unknown) {
  if (!value) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return parseGebarDate(numeric);
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function normalizeSubscriptionStatus(
  eventType: string,
  status?: string
): SubscriptionStatus {
  const normalized = status?.trim().toLowerCase();

  switch (normalized) {
    case 'active':
    case 'trialing':
    case 'pending':
    case 'past_due':
    case 'paused':
      return normalized;
    case 'cancelled':
    case 'canceled':
    case 'deleted':
      return 'canceled';
  }

  switch (eventType) {
    case 'subscription.active':
    case 'invoice.paid':
    case 'payment.paid':
    case 'payment.succeeded':
      return 'active';
    case 'subscription.trialing':
      return 'trialing';
    case 'subscription.cancelled':
    case 'subscription.canceled':
    case 'subscription.deleted':
      return 'canceled';
    case 'invoice.payment_failed':
    case 'payment.failed':
      return 'past_due';
    default:
      return 'pending';
  }
}

function normalizeGebarEvent(payload: any): NormalizedGebarEvent {
  const eventType = firstString(payload?.type, payload?.eventType, payload?.event_type) ?? 'unknown';
  const data = payload?.data?.subscription ?? payload?.data?.object ?? payload?.data ?? payload?.object ?? payload?.payload ?? payload;
  const metadata = data?.metadata ?? payload?.data?.metadata ?? payload?.metadata ?? {};
  const customer = data?.customer ?? data?.customerData ?? data?.billingCustomer ?? {};
  const plan = data?.plan ?? data?.product ?? data?.price ?? {};
  const subscription = data?.subscription ?? {};

  const billingCustomerId = firstString(
    data?.customerId,
    data?.customer_id,
    data?.billingCustomerId,
    data?.billing_customer_id,
    customer?.id,
    customer?.customerId,
    metadata?.billingCustomerId,
    metadata?.billing_customer_id
  );

  const metadataOrganizationId = firstString(
    metadata?.organizationId,
    metadata?.organization_id,
    data?.organizationId,
    data?.organization_id
  );
  const organizationId =
    parseOrganizationId(metadataOrganizationId) ??
    parseOrganizationId(firstString(data?.externalUserId, data?.external_user_id, metadata?.externalUserId)) ??
    parseOrganizationId(billingCustomerId);

  const planId = firstString(
    data?.planId,
    data?.plan_id,
    data?.productId,
    data?.product_id,
    subscription?.planId,
    subscription?.plan_id,
    plan?.id,
    plan?.planId,
    metadata?.planId
  );
  const configuredPlan = planId ? getGebarPlanByPlanId(planId) : undefined;
  const planKey = firstString(metadata?.planKey, metadata?.plan_key);
  const configuredPlanByKey = planKey ? getGebarPlanByKey(planKey) : undefined;

  return {
    eventType,
    organizationId,
    billingCustomerId,
    billingSubscriptionId: firstString(
      data?.subscriptionId,
      data?.subscription_id,
      subscription?.id,
      data?.id
    ),
    planId: planId ?? configuredPlanByKey?.gebarPlanId,
    planName: firstString(
      data?.planName,
      data?.plan_name,
      data?.productName,
      data?.product_name,
      plan?.name,
      configuredPlan?.name,
      configuredPlanByKey?.name
    ),
    status: normalizeSubscriptionStatus(
      eventType,
      firstString(data?.status, data?.subscriptionStatus, data?.subscription_status)
    ),
    currentPeriodStart: parseGebarDate(
      data?.currentPeriodStart ??
        data?.current_period_start ??
        data?.periodStart ??
        data?.period_start
    ),
    currentPeriodEnd: parseGebarDate(
      data?.currentPeriodEnd ??
        data?.current_period_end ??
        data?.periodEnd ??
        data?.period_end
    ),
    cancelAtPeriodEnd: firstBoolean(
      data?.cancelAtPeriodEnd,
      data?.cancel_at_period_end
    ),
  };
}

function definedSubscriptionUpdate(event: NormalizedGebarEvent) {
  const update: Parameters<typeof createOrUpdateSubscription>[1] = {
    billingProvider: 'gebar',
    status: event.status,
  };

  if (event.billingCustomerId !== undefined) update.billingCustomerId = event.billingCustomerId;
  if (event.billingSubscriptionId !== undefined) update.billingSubscriptionId = event.billingSubscriptionId;
  if (event.planId !== undefined) update.planId = event.planId;
  if (event.planName !== undefined) update.planName = event.planName;
  if (event.currentPeriodStart !== undefined) update.currentPeriodStart = event.currentPeriodStart;
  if (event.currentPeriodEnd !== undefined) update.currentPeriodEnd = event.currentPeriodEnd;
  if (event.cancelAtPeriodEnd !== undefined) update.cancelAtPeriodEnd = event.cancelAtPeriodEnd;

  return update;
}

async function createGebarClient() {
  let GebarBilling: any;
  try {
    const module = await import('@gebarbilling/server');
    GebarBilling = module.default;
  } catch (e) {
    console.error('Failed to import Gebar SDK:', e);
    throw new Error('Gebar SDK not available');
  }

  return new GebarBilling(requiredEnv('GEBARBILLING_SECRET_KEY'), {
    baseUrl: requiredEnv('GEBARBILLING_BASE_URL'),
    environment: requiredEnv('GEBARBILLING_ENV'),
    checkoutDomain: getCheckoutBaseUrl(),
  } as any);
}

export interface CheckoutSessionParams {
  request: NextRequest;
  organization: Organization | null;
  planKey: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession({
  request,
  organization,
  planKey,
  successUrl,
  cancelUrl,
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

  const client = await createGebarClient();

  const existingSubscription = await getOrganizationSubscription(organization.id);
  const externalUserId = `org_${organization.id}`;
  const { firstName, lastName } = splitName(session.user.name);
  const billingCustomerId = existingSubscription?.billingCustomerId || externalUserId;

  console.log('Using billing customer ID:', billingCustomerId);

  console.log('Creating checkout session with Gebar...');
  console.log('Request:', {
    customerId: billingCustomerId,
    planId: plan.gebarPlanId,
    email: session.user.email,
    externalUserId,
  });

  await createOrUpdateSubscription(organization.id, {
    billingProvider: 'gebar',
    billingCustomerId,
    planId: plan.gebarPlanId,
    planName: plan.name,
    status: 'pending',
  });

  const appUrl = requiredEnv('NEXT_PUBLIC_APP_URL');

  const checkoutInput = {
    customerId: billingCustomerId,
    planId: plan.gebarPlanId,
    email: session.user.email,
    userId: session.user.id.toString(),
    externalUserId,
    firstName,
    lastName,
    mode: 'subscription',
    returnUrl:
      successUrl ||
      `${appUrl}/api/gebar/checkout?organizationId=${organization.id}&planKey=${plan.key}`,
    cancelUrl: cancelUrl || `${appUrl}/pricing`,
    metadata: {
      userId: session.user.id.toString(),
      email: session.user.email,
      organizationId: organization.id.toString(),
      organizationSlug: organization.slug,
      billingCustomerId,
      planKey: plan.key,
      planId: plan.gebarPlanId,
      provider: 'gebar',
    },
  };

  const checkoutSession = await client.checkout.sessions.create(checkoutInput);

  console.log('Checkout session response:', JSON.stringify(checkoutSession, null, 2));

  if (!checkoutSession.url) {
    console.error('No URL in checkout session response');
    throw new Error('Failed to create checkout session. No URL returned.');
  }

  return checkoutSession;
}

export interface PortalSessionParams {
  request: NextRequest;
  organization: Organization;
  returnUrl?: string;
}

export async function createCustomerPortalSession({
  request,
  organization,
  returnUrl,
}: PortalSessionParams) {
  console.log('=== CREATE CUSTOMER PORTAL SESSION ===');
  console.log('Organization:', organization?.id);

  const subscription = await getOrganizationSubscription(organization.id);
  const billingCustomerId = subscription?.billingCustomerId;

  if (!billingCustomerId) {
    console.log('No billing customer ID, redirecting to pricing');
    redirect('/pricing');
  }

  console.log('Using billing customer ID:', billingCustomerId);

  const client = await createGebarClient();

  console.log('Creating portal session with Gebar...');
  const portalSession = await client.portal.sessions.create({
    customerId: billingCustomerId,
    returnUrl:
      returnUrl ||
      `${requiredEnv('NEXT_PUBLIC_APP_URL')}/dashboard/billing?updated=true`
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
  const event = normalizeGebarEvent(payload);

  console.log('Normalized event:', JSON.stringify({
    eventType: event.eventType,
    organizationId: event.organizationId,
    billingCustomerId: event.billingCustomerId,
    status: event.status,
    planId: event.planId,
  }, null, 2));

  let organizationId = event.organizationId;

  if (organizationId) {
    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      console.error('No organization found for Gebar webhook:', organizationId);
      return;
    }
  } else if (event.billingCustomerId) {
    const subscription = await getSubscriptionByBillingCustomerId(event.billingCustomerId);
    organizationId = subscription?.organizationId;
  }

  if (!organizationId) {
    console.error('No organization or billing customer mapping found in Gebar webhook');
    return;
  }

  await createOrUpdateSubscription(organizationId, definedSubscriptionUpdate(event));

  console.log('Subscription updated successfully');
}
