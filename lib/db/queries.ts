import { eq, and, desc } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  users, 
  organizations, 
  memberships, 
  subscriptions, 
  activityLogs,
  type User,
  type Organization,
  type Membership,
  type Subscription,
} from './schema';
import { auth } from '@/lib/auth';

// ============ USER QUERIES ============

export async function getUserById(userId: number) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return result[0] ?? null;
}

// ============ ORGANIZATION QUERIES ============

export async function getOrganizationById(orgId: number) {
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  return result[0] ?? null;
}

export async function getOrganizationBySlug(slug: string) {
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  return result[0] ?? null;
}

// ============ MEMBERSHIP QUERIES ============

export async function getMembershipByUserAndOrg(userId: number, orgId: number) {
  const result = await db
    .select()
    .from(memberships)
    .where(and(
      eq(memberships.userId, userId),
      eq(memberships.organizationId, orgId)
    ))
    .limit(1);

  return result[0] ?? null;
}

export async function getUserMemberships(userId: number) {
  return await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));
}

export async function getOrganizationMemberships(orgId: number) {
  return await db
    .select({
      membership: memberships,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, orgId));
}

// ============ SUBSCRIPTION QUERIES ============

export async function getOrganizationSubscription(orgId: number) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);

  return result[0] ?? null;
}

export async function getSubscriptionByBillingCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.billingCustomerId, customerId))
    .limit(1);

  return result[0] ?? null;
}

export async function updateSubscription(
  orgId: number,
  data: {
    billingCustomerId?: string | null;
    billingSubscriptionId?: string | null;
    planId?: string | null;
    planName?: string | null;
    status?: 'active' | 'trialing' | 'pending' | 'canceled' | 'past_due' | 'paused' | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }
) {
  await db
    .update(subscriptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, orgId));
}

export async function createOrUpdateSubscription(
  orgId: number,
  data: {
    billingProvider?: string;
    billingCustomerId?: string | null;
    billingSubscriptionId?: string | null;
    planId?: string | null;
    planName?: string | null;
    status?: string | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
  }
) {
  const existing = await getOrganizationSubscription(orgId);
  
  if (existing) {
    const { status: _status, ...rest } = data;
    return await db
      .update(subscriptions)
      .set({
        ...rest,
        ...(_status !== undefined ? { status: _status as 'active' | 'trialing' | 'pending' | 'canceled' | 'past_due' | 'paused' } : {}),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.organizationId, orgId))
      .returning();
  }
  
  return await db
    .insert(subscriptions)
    .values({
      organizationId: orgId,
      billingProvider: data.billingProvider ?? 'gebar',
      billingCustomerId: data.billingCustomerId,
      billingSubscriptionId: data.billingSubscriptionId,
      planId: data.planId,
      planName: data.planName,
      status: (data.status as any) ?? 'pending',
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    })
    .returning();
}

// ============ ACTIVITY LOGS ============

export async function logActivity(
  orgId: number,
  userId: number | null,
  action: string,
  ipAddress?: string
) {
  return await db
    .insert(activityLogs)
    .values({
      organizationId: orgId,
      userId,
      action,
      ipAddress,
    })
    .returning();
}

export async function getOrganizationActivity(orgId: number, limit = 50) {
  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.organizationId, orgId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// ============ BETTER AUTH SESSION HELPERS ============

export async function getSessionFromRequest(request: Request) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

export async function getCurrentUserFromRequest(request: Request) {
  const session = await getSessionFromRequest(request);
  return session?.user ?? null;
}

// ============ ADMIN QUERIES ============

export async function getAllUsers(limit = 50, offset = 0) {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllOrganizations(limit = 50, offset = 0) {
  return await db
    .select()
    .from(organizations)
    .orderBy(desc(organizations.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllSubscriptions() {
  return await db
    .select()
    .from(subscriptions)
    .orderBy(desc(subscriptions.createdAt));
}

// ============ SLUG GENERATION ============

export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  while (await getOrganizationBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// ============ LEGACY COMPATIBILITY ============

export async function getUser() {
  return await getCurrentUserFromRequest(new Request('http://localhost'));
}

export async function getTeamByBillingCustomerId(customerId: string) {
  const subscription = await getSubscriptionByBillingCustomerId(customerId);
  if (!subscription) return null;
  return await getOrganizationById(subscription.organizationId);
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    billingCustomerId?: string | null;
    billingSubscriptionId?: string | null;
    billingPlanId?: string | null;
    billingPlanName?: string | null;
    billingStatus?: string | null;
    billingCurrentPeriodEnd?: Date | null;
    billingProvider?: string;
  }
) {
  await updateSubscription(teamId, {
    billingCustomerId: subscriptionData.billingCustomerId,
    billingSubscriptionId: subscriptionData.billingSubscriptionId,
    planId: subscriptionData.billingPlanId,
    planName: subscriptionData.billingPlanName,
    status: subscriptionData.billingStatus as 'active' | 'trialing' | 'pending' | 'canceled' | 'past_due' | 'paused' | null,
    currentPeriodEnd: subscriptionData.billingCurrentPeriodEnd,
  });
}

export async function updateTeamSubscriptionByBillingCustomerId(
  customerId: string,
  subscriptionData: {
    billingSubscriptionId?: string | null;
    billingPlanId?: string | null;
    billingPlanName?: string | null;
    billingStatus: string;
    billingCurrentPeriodEnd?: Date | null;
    billingProvider?: string;
  }
) {
  const subscription = await getSubscriptionByBillingCustomerId(customerId);
  
  if (!subscription) {
    console.error('Organization subscription not found for billing customer:', customerId);
    return null;
  }

  await updateSubscription(subscription.organizationId, {
    billingSubscriptionId: subscriptionData.billingSubscriptionId,
    planId: subscriptionData.billingPlanId,
    planName: subscriptionData.billingPlanName,
    status: subscriptionData.billingStatus as 'active' | 'trialing' | 'pending' | 'canceled' | 'past_due' | 'paused' | null,
    currentPeriodEnd: subscriptionData.billingCurrentPeriodEnd,
  });

  return await getOrganizationById(subscription.organizationId);
}