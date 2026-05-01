'use client';

import useSWR from 'swr';
import { FeatureLockedCard } from '@/components/subscriptions/feature-locked-card';
import { LoadingState } from '@/components/feedback/loading-state';
import { getSubscription } from '@/lib/api/billing';
import { hasPermission, type BillingPermission } from '@/lib/billing/access';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PlanGate({
  feature,
  children,
  fallback,
}: {
  planKey?: string;
  feature: BillingPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data: user, isLoading: isUserLoading } = useSWR('/api/user', fetcher);
  const { data: subscription, isLoading } = useSWR(
    user ? '/api/billing/subscription' : null,
    getSubscription
  );

  if (isUserLoading || isLoading) {
    return <LoadingState message="Checking access..." />;
  }

  if (hasPermission(subscription, feature)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback || (
        <FeatureLockedCard
          title="Plus feature locked"
          description="This feature requires the Plus plan. Choose a plan to unlock it."
        />
      )}
    </>
  );
}
