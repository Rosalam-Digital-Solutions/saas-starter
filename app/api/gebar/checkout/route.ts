import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { getGebarPlanByKey } from '@/lib/payments/plans';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== GEBAR CHECKOUT CALLBACK ===');
  
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId');
  const planKey = searchParams.get('planKey');

  console.log('Callback params:', { teamId, planKey });

  if (!teamId || !planKey) {
    console.log('Missing params, redirecting to pricing');
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const user = await getUser();
  if (!user) {
    console.log('No user, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const plan = getGebarPlanByKey(planKey);
  if (!plan) {
    console.log('Invalid plan key:', planKey);
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  console.log('Plan:', plan.name, plan.gebarPlanId);

  const userTeam = await db
    .select({
      teamId: teamMembers.teamId,
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (userTeam.length === 0 || userTeam[0].teamId !== Number(teamId)) {
    console.log('User not authorized for this team');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, Number(teamId)))
    .limit(1);

  if (team.length === 0) {
    console.log('Team not found');
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const billingCustomerId = team[0].billingCustomerId || `team_${teamId}`;

  console.log('Updating team:', teamId);
  console.log('Billing status: pending');
  console.log('Billing customer ID:', billingCustomerId);

  await db
    .update(teams)
    .set({
      billingProvider: 'gebar',
      billingCustomerId: billingCustomerId,
      billingPlanId: plan.gebarPlanId,
      billingPlanName: plan.name,
      billingStatus: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(teams.id, Number(teamId)));

  console.log('Team updated, redirecting to dashboard');

  await setSession(user);
  return NextResponse.redirect(new URL('/dashboard', request.url));
}