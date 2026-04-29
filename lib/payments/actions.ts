'use server';

export const checkoutAction = async (formData: FormData) => {
  const planKey = formData.get('planKey') as string | null;

  throw new Error(
    `checkoutAction is deprecated. Use POST /api/billing/checkout${planKey ? ` for ${planKey}` : ''}.`
  );
};

export const customerPortalAction = async () => {
  throw new Error(
    'customerPortalAction is deprecated. Use POST /api/billing/portal.'
  );
};

export const upgradePlanAction = async (formData: FormData) => {
  const planKey = formData.get('planKey') as string | null;

  throw new Error(
    `upgradePlanAction is deprecated. Use POST /api/billing/checkout${planKey ? ` for ${planKey}` : ''}.`
  );
};
