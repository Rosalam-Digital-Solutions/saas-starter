'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/error-state';
import { CheckoutButton } from '@/components/billing/checkout-button';
import { PortalButton } from '@/components/billing/portal-button';
import { getSubscription } from '@/lib/api/billing';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PlanCta({
  planKey,
  authenticatedLabel = 'Manage plan',
  unauthenticatedLabel = 'Get Started',
  activeBehavior = 'portal',
  className,
}: {
  planKey: string;
  authenticatedLabel?: string;
  unauthenticatedLabel?: string;
  activeBehavior?: 'dashboard' | 'portal';
  className?: string;
}) {
  const { data: user, isLoading: isUserLoading } = useSWR('/api/user', fetcher);
  const {
    data: subscription,
    isLoading,
    error,
  } = useSWR(user ? '/api/billing/subscription' : null, getSubscription);

  if (isUserLoading) {
    return (
      <Button disabled className={className || 'w-full rounded-full'}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking session...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild className={className || 'w-full rounded-full bg-orange-500 hover:bg-orange-600'}>
        <Link href={`/sign-up?redirect=checkout&planKey=${planKey}`}>
          {unauthenticatedLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button disabled className={className || 'w-full rounded-full'}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking plan...
      </Button>
    );
  }

  if (error) {
    return <ErrorState message="Could not load billing status." />;
  }

  if (subscription?.status === 'active' || subscription?.status === 'trialing') {
    return <PortalButton label={authenticatedLabel} variant="default" />;
  }

  return (
    <CheckoutButton
      planKey={planKey}
      label="Start checkout"
      className={className || 'w-full rounded-full bg-orange-500 hover:bg-orange-600'}
    />
  );
}
