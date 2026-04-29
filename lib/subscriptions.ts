import type { BillingPermission } from '@/lib/billing/access';
import {
  type GebarPlanConfig,
  type GebarPlanKey,
  getGebarPlanByKey,
  getGebarPlans,
} from '@/lib/payments/plans';

export type SubscriptionFeature = BillingPermission;

export type SubscriptionPlan = GebarPlanConfig & {
  slug: string;
  bestFor: string;
  limits: {
    workspaces: number | 'unlimited';
    teamMembers: number | 'unlimited';
    analytics: 'basic' | 'advanced';
    support: 'email' | 'priority';
  };
  unlockedFeatures: SubscriptionFeature[];
  notIncluded: string[];
};

const planDetails: Record<GebarPlanKey, Omit<SubscriptionPlan, keyof GebarPlanConfig>> = {
  base: {
    slug: 'base',
    bestFor: 'Small teams validating a SaaS idea and testing the core dashboard workflow.',
    limits: {
      workspaces: 1,
      teamMembers: 5,
      analytics: 'basic',
      support: 'email',
    },
    unlockedFeatures: [
      'basic_dashboard',
      'team_management',
      'billing_portal',
      'basic_analytics',
    ],
    notIncluded: [
      'Advanced analytics',
      'Priority support',
      'Advanced workspace controls',
    ],
  },
  plus: {
    slug: 'plus',
    bestFor: 'Growing teams that need deeper analytics, more members, and faster support.',
    limits: {
      workspaces: 3,
      teamMembers: 25,
      analytics: 'advanced',
      support: 'priority',
    },
    unlockedFeatures: [
      'basic_dashboard',
      'team_management',
      'billing_portal',
      'basic_analytics',
      'advanced_analytics',
      'priority_support',
      'advanced_settings',
    ],
    notIncluded: ['Custom enterprise terms', 'Dedicated account manager'],
  },
};

export function getSubscriptionPlans(): SubscriptionPlan[] {
  return getGebarPlans().map((plan) => ({
    ...plan,
    ...planDetails[plan.key],
  }));
}

export function getSubscriptionPlanByKey(key: string): SubscriptionPlan | undefined {
  const plan = getGebarPlanByKey(key);
  if (!plan) return undefined;
  return {
    ...plan,
    ...planDetails[plan.key],
  };
}

export function getSubscriptionPlanBySlug(slug: string): SubscriptionPlan | undefined {
  return getSubscriptionPlans().find((plan) => plan.slug === slug);
}

export function getPlanKeyFromSubscription(input?: {
  planId?: string | null;
  planName?: string | null;
} | null): GebarPlanKey {
  if (!input) return 'base';

  const byPlanId = getSubscriptionPlans().find(
    (plan) => input.planId && plan.gebarPlanId === input.planId
  );
  if (byPlanId) return byPlanId.key;

  const normalizedName = input.planName?.toLowerCase();
  if (normalizedName?.includes('plus') || normalizedName?.includes('pro')) {
    return 'plus';
  }

  return 'base';
}

export function hasFeature(
  planKey: GebarPlanKey | string | undefined,
  feature: SubscriptionFeature
) {
  const plan = getSubscriptionPlanByKey(planKey || 'base');
  return Boolean(plan?.unlockedFeatures.includes(feature));
}

export function formatLimit(value: number | 'unlimited') {
  return value === 'unlimited' ? 'Unlimited' : value.toString();
}
