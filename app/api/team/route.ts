import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { organizations, memberships, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's organizations with subscriptions
  const userMemberships = await db
    .select({
      membership: memberships,
      organization: organizations,
    })
    .from(memberships)
    .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, parseInt(session.user.id)));

  // Get subscriptions for each org
  const orgs = await Promise.all(
    userMemberships.map(async ({ membership, organization }) => {
      if (!organization) return null;
      
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.organizationId, organization.id),
      });

      return {
        ...organization,
        role: membership.role,
        subscription: sub ?? null,
      };
    })
  );

  return Response.json(orgs.filter(Boolean));
}