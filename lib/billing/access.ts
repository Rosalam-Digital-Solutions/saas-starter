import { getGebarPlanByPlanId } from '@/lib/payments/plans';
import type { Subscription } from '@/lib/db/schema';

export type BillingStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'inactive';

export type BillingPermission =
  | 'basic_dashboard'
  | 'team_management'
  | 'billing_portal'
  | 'basic_analytics'
  | 'advanced_analytics'
  | 'priority_support'
  | 'advanced_settings';

export type BillingLimits = {
  projects?: number;
  teamMembers?: number;
  automations?: number;
  storageGb?: number;
  [key: string]: number | undefined;
};

export type BillingSubscriptionState = {
  planId: string | null;
  planName: string | null;
  status: BillingStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  permissions: BillingPermission[];
  limits: BillingLimits;
};

const baseAccess = {
  permissions: [
    'basic_dashboard',
    'team_management',
    'billing_portal',
    'basic_analytics',
  ] satisfies BillingPermission[],
  limits: {
    projects: 3,
    teamMembers: 5,
    automations: 10,
    storageGb: 5,
  } satisfies BillingLimits,
};

const plusAccess = {
  permissions: [
    ...baseAccess.permissions,
    'advanced_analytics',
    'priority_support',
    'advanced_settings',
  ] satisfies BillingPermission[],
  limits: {
    projects: 25,
    teamMembers: 25,
    automations: 100,
    storageGb: 50,
  } satisfies BillingLimits,
};

export function normalizeBillingStatus(status?: string | null): BillingStatus {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return status;
    case 'canceled':
    case 'cancelled':
    case 'paused':
      return 'canceled';
    default:
      return 'inactive';
  }
}

export function getAccessForSubscription(subscription?: Subscription | null) {
  const plan = subscription?.planId
    ? getGebarPlanByPlanId(subscription.planId)
    : undefined;

  const normalizedName = subscription?.planName?.toLowerCase() ?? '';
  const isPlus =
    plan?.key === 'plus' ||
    normalizedName.includes('plus') ||
    normalizedName.includes('pro');

  return isPlus ? plusAccess : baseAccess;
}

export function toBillingSubscriptionState(
  subscription?: Subscription | null
): BillingSubscriptionState {
  const status = normalizeBillingStatus(subscription?.status);
  const access = status === 'inactive' ? { permissions: [], limits: {} } : getAccessForSubscription(subscription);

  return {
    planId: subscription?.planId ?? null,
    planName: subscription?.planName ?? null,
    status,
    currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString(),
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    permissions: access.permissions,
    limits: access.limits,
  };
}

export function hasPermission(
  subscription: BillingSubscriptionState | undefined | null,
  permission: BillingPermission
) {
  return Boolean(subscription?.permissions.includes(permission));
}
