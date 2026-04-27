import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import { getUser, updateTeamSubscription, getTeamByBillingCustomerId, getTeamById, updateTeamSubscriptionByBillingCustomerId } from '@/lib/db/queries';
import { getGebarPlanByKey, getGebarPlans, validatePlanConfig } from './plans';

let gebar: any = null;

function getGebarClient() {
  if (!gebar) {
    const GebarBilling = require('@gebarbilling/server').default;
    gebar = new GebarBilling(process.env.GEBARBILLING_SECRET_KEY!, {
      baseUrl: process.env.GEBARBILLING_BASE_URL || 'https://api.gebarbilling.et',
      plans: {
        base: process.env.GEBARBILLING_BASE_PLAN_ID ?? null,
        plus: process.env.GEBARBILLING_PLUS_PLAN_ID ?? null
      }
    });
  }
  return gebar;
}

export async function createCheckoutSession({
  team,
  planKey
}: {
  team: Team | null;
  planKey: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&planKey=${planKey}`);
  }

  const plan = getGebarPlanByKey(planKey);
  if (!plan) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }

  validatePlanConfig(plan);

  let billingCustomerId = team.billingCustomerId;
  
  if (!billingCustomerId) {
    billingCustomerId = `team_${team.id}`;
    await updateTeamSubscription(team.id, {
      billingCustomerId,
      billingStatus: 'pending'
    });
  }

  const client = getGebarClient();
  
  const session = await client.checkout.sessions.create({
    customerId: billingCustomerId,
    planId: plan.gebarPlanId,
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/api/gebar/checkout?teamId=${team.id}&planKey=${plan.key}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    metadata: {
      userId: user.id.toString(),
      teamId: team.id.toString(),
      planKey: plan.key,
      provider: 'gebar'
    }
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session. No URL returned.');
  }

  redirect(session.url);
}

export async function createCustomerPortalSession(team: Team) {
  if (!team.billingCustomerId) {
    redirect('/pricing');
  }

  const client = getGebarClient();

  const session = await client.portal.sessions.create({
    customerId: team.billingCustomerId,
    returnUrl: `${process.env.BASE_URL}/dashboard`
  });

  return session;
}

export async function getGebarProducts() {
  const plans = getGebarPlans();
  
  return plans.map((plan) => ({
    id: plan.gebarPlanId || plan.key,
    name: plan.name,
    description: plan.description,
    defaultPriceId: plan.gebarPlanId
  }));
}

export async function getGebarPrices() {
  const plans = getGebarPlans();
  
  return plans.map((plan) => ({
    id: plan.gebarPlanId || `${plan.key}-price`,
    productId: plan.gebarPlanId || plan.key,
    unitAmount: plan.unitAmount,
    currency: plan.currency,
    interval: plan.interval,
    trialPeriodDays: plan.trialPeriodDays
  }));
}

export function getBillingAccessForTeam(team: Team) {
  const hasAccess = ['active', 'trialing', 'pending'].includes(team.billingStatus ?? '');
  
  return {
    hasAccess,
    status: team.billingStatus,
    planName: team.billingPlanName,
    planId: team.billingPlanId
  };
}

export async function handleGebarSubscriptionEvent(payload: any) {
  const data = payload.data || payload.object || payload.payload || {};
  
  const customerId =
    data.customerId ||
    data.customer_id ||
    data.billingCustomerId ||
    data.userId ||
    data.user_id;

  if (!customerId) {
    console.error('No customer ID found in webhook payload:', payload);
    return;
  }

  const subscriptionId =
    data.subscriptionId ||
    data.subscription_id ||
    data.id;

  const planId =
    data.planId ||
    data.plan_id ||
    data.productId ||
    data.product_id;

  const planName =
    data.planName ||
    data.plan_name ||
    data.productName ||
    data.product_name;

  const status =
    data.status ||
    data.subscriptionStatus ||
    data.subscription_status;

  const currentPeriodEnd =
    data.currentPeriodEnd ||
    data.current_period_end ||
    data.periodEnd ||
    data.period_end;

  const updateData: any = {
    billingStatus: status,
    billingProvider: 'gebar'
  };

  if (subscriptionId) {
    updateData.billingSubscriptionId = subscriptionId;
  }

  if (planId) {
    updateData.billingPlanId = planId;
  }

  if (planName) {
    updateData.billingPlanName = planName;
  }

  if (currentPeriodEnd) {
    updateData.billingCurrentPeriodEnd = new Date(currentPeriodEnd);
  }

  console.log('Updating team subscription:', { customerId, ...updateData });

  await updateTeamSubscriptionByBillingCustomerId(customerId, updateData);

  const unknownFields = Object.keys(data).filter(
    key => !['customerId', 'customer_id', 'billingCustomerId', 'userId', 'user_id', 'subscriptionId', 'subscription_id', 'id', 'planId', 'plan_id', 'productId', 'product_id', 'planName', 'plan_name', 'productName', 'product_name', 'status', 'subscriptionStatus', 'subscription_status', 'currentPeriodEnd', 'current_period_end', 'periodEnd', 'period_end'].includes(key)
  );

  if (unknownFields.length > 0) {
    console.log('Unknown webhook payload fields:', unknownFields);
  }
}