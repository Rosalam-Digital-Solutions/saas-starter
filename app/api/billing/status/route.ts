import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';

export function hasBillingAccess(status?: string | null) {
  return (
    status === 'active' ||
    status === 'trialing' ||
    status === 'incomplete'
  );
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getTenantContext(request as any);

  if (!ctx?.subscription) {
    return NextResponse.json({
      hasAccess: false,
      subscription: null,
    });
  }

  return NextResponse.json({
    hasAccess: hasBillingAccess(ctx.subscription.status),
    subscription: ctx.subscription,
  });
}
