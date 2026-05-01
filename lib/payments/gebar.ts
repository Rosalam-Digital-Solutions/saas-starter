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
  status?: unknown
): SubscriptionStatus {
  const normalized =
    typeof status === 'number' && Number.isFinite(status)
      ? String(status)
      : typeof status === 'string'
        ? status.trim().toLowerCase()
        : undefined;

  switch (normalized) {
    case 'active':
    case 'paid':
    case 'success':
    case 'succeeded':
    case '2':
    case '20':
      return 'active';
    case 'trialing':
    case 'pending':
      return normalized;
    case 'incomplete':
    case 'processing':
    case 'created':
    case '0':
    case '1':
      return 'pending';
    case 'past_due':
    case 'failed':
    case '4':
      return 'past_due';
    case 'paused':
    case '5':
      return 'paused';
    case 'cancelled':
    case 'canceled':
    case 'deleted':
    case 'expired':
    case '3':
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

function normalizeGebarEvent(payload: any): NormalizedGebarEvent {
  const eventType = firstString(payload?.type, payload?.eventType, payload?.event_type) ?? 'unknown';
  const data = payload?.data?.subscription ?? payload?.data?.object ?? payload?.data ?? payload?.object ?? payload?.payload ?? payload;
  const metadata = data?.metadata ?? payload?.data?.metadata ?? payload?.metadata ?? {};

  const billingCustomerId = firstString(
    data?.customerId,
    data?.customer_id,
    data?.billingCustomerId,
    metadata?.billingCustomerId,
    metadata?.billing_customer_id
  );

  const metadataOrganizationId = firstString(
    metadata?.organizationId,
    metadata?.organization_id,
    data?.organizationId,
    data?.organization_id
  );

  const rawId = metadataOrganizationId?.startsWith('org_')
    ? metadataOrganizationId.slice(4)
    : metadataOrganizationId;
  const organizationId = rawId
    ? Number(rawId)
    : undefined;
  const validOrgId = Number.isInteger(organizationId) && organizationId! > 0
    ? organizationId
    : undefined;

  const planId = firstString(
    data?.planId,
    data?.plan_id,
    data?.productId,
    data?.product_id,
    metadata?.planId
  );
  const configuredPlan = planId ? getGebarPlanByPlanId(planId) : undefined;
  const planKey = firstString(metadata?.planKey, metadata?.plan_key);
  const configuredPlanByKey = planKey ? getGebarPlanByKey(planKey) : undefined;

  return {
    eventType,
    organizationId: validOrgId,
    billingCustomerId,
    billingSubscriptionId: firstString(
      data?.subscriptionId,
      data?.subscription_id,
      data?.id
    ),
    planId: planId ?? configuredPlanByKey?.gebarPlanId,
    planName: firstString(
      data?.planName,
      data?.plan_name,
      configuredPlan?.name,
      configuredPlanByKey?.name
    ),
    status: normalizeSubscriptionStatus(
      eventType,
      data?.status ?? data?.subscriptionStatus ?? data?.subscription_status
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

export async function syncOrganizationSubscriptionFromGebar(organizationId: number) {
  const existingSubscription = await getOrganizationSubscription(organizationId);
  return existingSubscription;
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
}: CheckoutSessionParams) {
  const session = await getSessionFromRequest(request);

  if (!session?.user || !organization) {
    redirect(`/sign-up?redirect=checkout&planKey=${planKey}`);
  }

  const plan = getGebarPlanByKey(planKey);
  if (!plan) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }

  validatePlanConfig(plan);

  const existingSubscription = await getOrganizationSubscription(organization.id);
  const billingCustomerId = existingSubscription?.billingCustomerId || `org_${organization.id}`;

  await createOrUpdateSubscription(organization.id, {
    billingProvider: 'gebar',
    billingCustomerId,
    planId: plan.gebarPlanId,
    planName: plan.name,
    status: 'pending',
  });

  return { url: '' };
}

export interface PortalSessionParams {
  request: NextRequest;
  organization: Organization;
  returnUrl?: string;
}

export async function createCustomerPortalSession({
  request,
  organization,
}: PortalSessionParams) {
  const subscription = await getOrganizationSubscription(organization.id);
  const billingCustomerId = subscription?.billingCustomerId;

  if (!billingCustomerId) {
    redirect('/pricing');
  }

  return { url: '' };
}
