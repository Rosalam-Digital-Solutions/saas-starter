import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { getGebarPlanByKey } from '@/lib/payments/plans';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId');
  const planKey = searchParams.get('planKey');

  if (!teamId || !planKey) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const plan = getGebarPlanByKey(planKey);
  if (!plan) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const userTeam = await db
    .select({
      teamId: teamMembers.teamId,
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (userTeam.length === 0 || userTeam[0].teamId !== Number(teamId)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, Number(teamId)))
    .limit(1);

  if (team.length === 0) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const billingCustomerId = team[0].billingCustomerId || `team_${teamId}`;

  await db
    .update(teams)
    .set({
      billingProvider: 'gebar',
      billingCustomerId,
      billingPlanId: plan.gebarPlanId,
      billingPlanName: plan.name,
      billingStatus: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(teams.id, Number(teamId)));

  await setSession(user);
  return NextResponse.redirect(new URL('/dashboard', request.url));
}