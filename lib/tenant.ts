import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { memberships, organizations, subscriptions, users } from '@/lib/db/schema';
import type { Organization, Membership, Subscription, User } from '@/lib/db/schema';

export interface TenantContext {
  user: User;
  organization: Organization;
  membership: Membership;
  subscription: Subscription | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export async function getSession(request: NextRequest) {
  return await auth.api.getSession({
    headers: request.headers,
  });
}

export async function getCurrentUser(request: NextRequest) {
  const session = await getSession(request);
  return session?.user ?? null;
}

export async function getTenantContext(request: NextRequest): Promise<TenantContext | null> {
  const session = await getSession(request);
  
  if (!session?.user) {
    return null;
  }

  // Try to get org from header first (for multi-org switching)
  const orgIdHeader = request.headers.get('x-organization-id');
  const orgSlugHeader = request.headers.get('x-organization-slug');
  
  let orgQuery;
  
  if (orgIdHeader) {
    orgQuery = db.query.organizations.findFirst({
      where: eq(organizations.id, parseInt(orgIdHeader)),
    });
  } else if (orgSlugHeader) {
    orgQuery = db.query.organizations.findFirst({
      where: eq(organizations.slug, orgSlugHeader),
    });
  } else {
    // Fallback: get user's first organization
    const membership = await db.query.memberships.findFirst({
      where: eq(memberships.userId, parseInt(session.user.id)),
      with: {
        organization: true,
      },
    });
    
    orgQuery = membership?.organization;
  }
  
  const organization = await orgQuery;
  
  if (!organization) {
    return null;
  }
  
  // Get user's membership for this org
  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, parseInt(session.user.id)),
      eq(memberships.organizationId, organization.id)
    ),
  });
  
  if (!membership) {
    return null;
  }
  
  // Get subscription for this org
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organization.id),
  });
  
  // Get user from DB
  const user = await db.query.users.findFirst({
    where: eq(users.id, parseInt(session.user.id)),
  });
  
  if (!user) {
    return null;
  }
  
  return {
    user,
    organization,
    membership,
    subscription: subscription ?? null,
    role: membership.role as 'owner' | 'admin' | 'member' | 'viewer',
  };
}

export async function requireAuth(request: NextRequest): Promise<TenantContext> {
  const ctx = await getTenantContext(request);
  
  if (!ctx) {
    throw new Error('Unauthorized');
  }
  
  return ctx;
}

export function requireRole(ctx: TenantContext, minRole: 'owner' | 'admin' | 'member' | 'viewer') {
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
  
  if (roleHierarchy[ctx.role] < roleHierarchy[minRole]) {
    throw new Error('Forbidden');
  }
  
  return true;
}

export function isAdmin(ctx: TenantContext) {
  return ctx.role === 'owner' || ctx.role === 'admin';
}

export function isOwner(ctx: TenantContext) {
  return ctx.role === 'owner';
}

export async function getUserOrganizations(userId: number) {
  const userMemberships = await db.query.memberships.findMany({
    where: eq(memberships.userId, userId),
    with: {
      organization: {
        with: {
          subscriptions: true,
        },
      },
    },
  });
  
  return userMemberships.map(m => ({
    ...m.organization,
    role: m.role,
    subscription: m.organization.subscriptions[0] ?? null,
  }));
}

export async function createOrganization(
  userId: number,
  name: string,
  slug: string
) {
  // Create organization
  const [organization] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      ownerId: userId,
    })
    .returning();
  
  // Add owner as member
  await db.insert(memberships).values({
    userId,
    organizationId: organization.id,
    role: 'owner',
  });
  
  return organization;
}

export function hasSubscriptionAccess(ctx: TenantContext) {
  if (!ctx.subscription) return false;
  return ['active', 'trialing', 'pending'].includes(ctx.subscription.status ?? '');
}