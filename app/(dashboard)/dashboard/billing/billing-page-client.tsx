'use client';

import useSWR from 'swr';
import { DashboardBillingPage } from '@/components/billing/dashboard-billing-page';
import { getSubscription } from '@/lib/api/billing';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BillingPageClient({ updated }: { updated?: boolean }) {
  const { data: user, isLoading: isUserLoading } = useSWR('/api/user', fetcher);
  const { data, isLoading, error } = useSWR(
    user ? '/api/billing/subscription' : null,
    getSubscription
  );

  return (
    <DashboardBillingPage
      subscription={data}
      isLoading={isUserLoading || isLoading}
      error={error}
      updated={updated}
      unauthenticated={!isUserLoading && !user}
    />
  );
}
