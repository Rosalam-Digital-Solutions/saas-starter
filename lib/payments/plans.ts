export type GebarPlanKey = 'base' | 'plus';

export type GebarPlanConfig = {
  key: GebarPlanKey;
  name: string;
  description: string;
  gebarPlanId: string;
  unitAmount: number;
  currency: string;
  interval: 'month' | 'year';
  trialPeriodDays: number;
  features: string[];
};

export function getGebarPlans(): GebarPlanConfig[] {
  return [
    {
      key: 'base',
      name: 'Base',
      description: 'For small teams getting started.',
      gebarPlanId: process.env.GEBARBILLING_BASE_PLAN_ID ?? '',
      unitAmount: Number(process.env.GEBARBILLING_BASE_PRICE_MONTHLY ?? 800),
      currency: process.env.GEBARBILLING_CURRENCY ?? 'usd',
      interval: 'month',
      trialPeriodDays: 7,
      features: [
        'Unlimited Usage',
        'Unlimited Workspace Members',
        'Email Support'
      ]
    },
    {
      key: 'plus',
      name: 'Plus',
      description: 'For teams that need more support and early access.',
      gebarPlanId: process.env.GEBARBILLING_PLUS_PLAN_ID ?? '',
      unitAmount: Number(process.env.GEBARBILLING_PLUS_PRICE_MONTHLY ?? 1200),
      currency: process.env.GEBARBILLING_CURRENCY ?? 'usd',
      interval: 'month',
      trialPeriodDays: 7,
      features: [
        'Everything in Base',
        'Early Access to New Features',
        '24/7 Support + Slack Access'
      ]
    }
  ];
}

export function getGebarPlanByKey(key: string): GebarPlanConfig | undefined {
  return getGebarPlans().find((plan) => plan.key === key);
}

export function getGebarPlanByPlanId(planId: string): GebarPlanConfig | undefined {
  return getGebarPlans().find((plan) => plan.gebarPlanId === planId);
}

export function validatePlanConfig(plan: GebarPlanConfig): void {
  if (!plan.gebarPlanId) {
    throw new Error(
      `GebarBilling plan ID not configured for ${plan.key} plan. ` +
      `Please set GEBARBILLING_${plan.key.toUpperCase()}_PLAN_ID in your environment.`
    );
  }
}