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

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredNumberEnv(name: string): number {
  const value = Number(requiredEnv(name));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number for required environment variable: ${name}`);
  }
  return value;
}

export function getGebarPlans(): GebarPlanConfig[] {
  return [
    {
      key: 'base',
      name: 'Base',
      description: 'For small teams getting started.',
      gebarPlanId: requiredEnv('GEBARBILLING_BASE_PLAN_ID'),
      unitAmount: requiredNumberEnv('GEBARBILLING_BASE_PRICE_MONTHLY'),
      currency: requiredEnv('GEBARBILLING_CURRENCY'),
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
      gebarPlanId: requiredEnv('GEBARBILLING_PLUS_PLAN_ID'),
      unitAmount: requiredNumberEnv('GEBARBILLING_PLUS_PRICE_MONTHLY'),
      currency: requiredEnv('GEBARBILLING_CURRENCY'),
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
      `Gebar plan ID not configured for ${plan.key} plan. ` +
      `Please set GEBARBILLING_${plan.key.toUpperCase()}_PLAN_ID in your environment.`
    );
  }
}
