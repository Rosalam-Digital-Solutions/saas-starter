import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import { getUser, updateTeamSubscription, getTeamByBillingCustomerId, getTeamById, updateTeamSubscriptionByBillingCustomerId } from '@/lib/db/queries';
import { getGebarPlanByKey, getGebarPlans, validatePlanConfig } from './plans';
import { env } from '@/lib/env';

let gebar: any = null;

function getGebarClient() {
  if (!gebar) {
    console.log('Initializing GebarBilling client...');
    const GebarBilling = require('@gebarbilling/server').default;
    gebar = new GebarBilling(process.env.GEBARBILLING_SECRET_KEY!, {
      baseUrl: process.env.GEBARBILLING_BASE_URL || 'https://api.gebarbilling.et',
    });
    console.log('GebarBilling client initialized');
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
  console.log('=== CREATE CHECKOUT SESSION ===');
  console.log('Plan key:', planKey);
  console.log('Team:', team?.id);

  const user = await getUser();

  if (!team || !user) {
    console.log('No team or user, redirecting to sign-up');
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

  let billingCustomerId = team.billingCustomerId;
  
  if (!billingCustomerId) {
    billingCustomerId = `team_${team.id}`;
    console.log('Creating billing customer ID:', billingCustomerId);
    await updateTeamSubscription(team.id, {
      billingCustomerId,
      billingStatus: 'pending',
      billingProvider: 'gebar'
    });
    console.log('Billing customer ID saved to team');
  }

  console.log('Using billing customer ID:', billingCustomerId);

  const client = getGebarClient();
  
  console.log('Creating checkout session with Gebar...');
  console.log('Request:', {
    customerId: billingCustomerId,
    planId: plan.gebarPlanId,
  });

  const session = await client.checkout.sessions.create({
    customerId: billingCustomerId,
    planId: plan.gebarPlanId,
    metadata: {
      userId: user.id.toString(),
      teamId: team.id.toString(),
      planKey: plan.key,
      provider: 'gebar'
    }
  });

  console.log('Checkout session response:', JSON.stringify(session, null, 2));

  if (!session.url) {
    console.error('No URL in checkout session response');
    throw new Error('Failed to create checkout session. No URL returned.');
  }

  console.log('Redirecting to checkout URL:', session.url);
  redirect(session.url);
}

export async function createCustomerPortalSession(team: Team) {
  console.log('=== CREATE CUSTOMER PORTAL SESSION ===');
  console.log('Team:', team?.id);

  if (!team.billingCustomerId) {
    console.log('No billing customer ID, redirecting to pricing');
    redirect('/pricing');
  }

  console.log('Using billing customer ID:', team.billingCustomerId);

  const client = getGebarClient();

  console.log('Creating portal session with Gebar...');
  const session = await client.portal.sessions.create({
    customerId: team.billingCustomerId,
    returnUrl: `${process.env.BASE_URL}/dashboard`
  });

  console.log('Portal session response:', JSON.stringify(session, null, 2));

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
  console.log('=== HANDLE GEBAR SUBSCRIPTION EVENT ===');
  console.log('Raw payload:', JSON.stringify(payload, null, 2));

  const data = payload.data || payload.object || payload.payload || payload;
  
  const customerId =
    data.customerId ||
    data.customer_id ||
    data.billingCustomerId ||
    data.userId ||
    data.user_id;

  if (!customerId) {
    console.error('No customer ID found in webhook payload');
    console.log('Available data keys:', Object.keys(data));
    return;
  }

  console.log('Extracted customer ID:', customerId);

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
    console.log('Subscription ID:', subscriptionId);
  }

  if (planId) {
    updateData.billingPlanId = planId;
    console.log('Plan ID:', planId);
  }

  if (planName) {
    updateData.billingPlanName = planName;
    console.log('Plan Name:', planName);
  }

  if (currentPeriodEnd) {
    updateData.billingCurrentPeriodEnd = new Date(currentPeriodEnd);
    console.log('Current Period End:', currentPeriodEnd);
  }

  console.log('Status:', status);

  console.log('Updating DB with:', JSON.stringify(updateData, null, 2));

  const result = await updateTeamSubscriptionByBillingCustomerId(customerId, updateData);

  if (result) {
    console.log('DB updated successfully, team:', result.id);
  } else {
    console.error('DB update failed - team not found for customer:', customerId);
  }

  const unknownFields = Object.keys(data).filter(
    key => !['customerId', 'customer_id', 'billingCustomerId', 'userId', 'user_id', 'subscriptionId', 'subscription_id', 'id', 'planId', 'plan_id', 'productId', 'product_id', 'planName', 'plan_name', 'productName', 'product_name', 'status', 'subscriptionStatus', 'subscription_status', 'currentPeriodEnd', 'current_period_end', 'periodEnd', 'period_end'].includes(key)
  );

  if (unknownFields.length > 0) {
    console.log('Unknown webhook payload fields (for mapping reference):', unknownFields);
  }
}