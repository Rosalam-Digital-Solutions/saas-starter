import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { organizations, memberships, subscriptions, users } from '@/lib/db/schema';
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

      const orgMemberships = await db
        .select({
          id: memberships.id,
          role: memberships.role,
          email: memberships.email,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(memberships)
        .leftJoin(users, eq(memberships.userId, users.id))
        .where(eq(memberships.organizationId, organization.id));

      return {
        ...organization,
        role: membership.role,
        subscription: sub ?? null,
        memberships: orgMemberships.map((member) => ({
          id: member.id,
          role: member.role,
          user: member.user?.id
            ? member.user
            : {
                id: 0,
                name: null,
                email: member.email || 'Pending invitation',
              },
        })),
      };
    })
  );

  return Response.json(orgs.filter(Boolean));
}
