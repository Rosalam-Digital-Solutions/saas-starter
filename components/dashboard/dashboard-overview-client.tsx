'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Activity, CreditCard, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalButton } from '@/components/billing/portal-button';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { EmptyState } from '@/components/feedback/empty-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { FeatureLockedCard } from '@/components/subscriptions/feature-locked-card';
import { PlanGate } from '@/components/subscriptions/plan-gate';
import { getSubscription, syncSubscription } from '@/lib/api/billing';
import type { BillingSubscriptionState } from '@/lib/billing/access';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type OrgData = {
  name: string;
  role: string;
  subscription: {
    planName: string | null;
    status: string | null;
    billingCustomerId?: string | null;
  } | null;
  memberships: unknown[];
};

export function DashboardOverviewClient({
  shouldSyncBilling,
}: {
  shouldSyncBilling: boolean;
}) {
  const { data: orgData, isLoading } = useSWR<OrgData[]>('/api/team', fetcher);
  const org = orgData?.[0];
  const { data: billingState, isLoading: isBillingLoading } = useSWR<BillingSubscriptionState>(
    org ? '/api/billing/subscription' : null,
    shouldSyncBilling ? syncSubscription : getSubscription
  );
  const planName = billingState?.planName ?? org?.subscription?.planName ?? null;
  const status = billingState?.status ?? org?.subscription?.status ?? null;
  const hasBillingCustomer = Boolean(org?.subscription?.billingCustomerId);
  const canManageSubscription =
    hasBillingCustomer && ['active', 'trialing', 'past_due', 'paused'].includes(status ?? '');

  return (
    <section className="flex-1 p-4 lg:p-8">
      <DashboardHeader
        title="Dashboard overview"
        description="Review the current workspace, subscription, and team state."
      />
      {shouldSyncBilling ? (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Billing refreshed from Gebar. Verified webhooks remain the source of truth.
        </div>
      ) : null}
      {isLoading ? <LoadingState message="Loading workspace..." /> : null}
      {!isLoading && !org ? (
        <EmptyState
          title="No workspace found"
          description="Create a workspace during sign up to test team and billing flows."
        />
      ) : null}
      {org ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <Settings className="mb-2 h-5 w-5 text-orange-500" />
                <CardTitle>Workspace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">{org.name}</p>
                <p className="text-sm capitalize text-gray-500">{org.role}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CreditCard className="mb-2 h-5 w-5 text-orange-500" />
                <CardTitle>Current plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium text-gray-900">{planName || 'Free'}</p>
                <p className="text-sm capitalize text-gray-500">
                  {isBillingLoading
                    ? 'Checking Gebar...'
                    : status?.replace(/_/g, ' ') || 'No active subscription'}
                </p>
                {canManageSubscription ? (
                  <PortalButton label="Manage subscription" variant="outline" />
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/pricing">Choose plan</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="mb-2 h-5 w-5 text-orange-500" />
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-gray-900">{org.memberships?.length || 0} members</p>
                <p className="text-sm text-gray-500">Including pending invitations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Activity className="mb-2 h-5 w-5 text-orange-500" />
                <CardTitle>Next steps</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href="/pricing">View plans</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <PlanGate
              feature="advanced_analytics"
              fallback={
                <FeatureLockedCard
                  title="Advanced analytics locked"
                  description="This workspace does not have the advanced analytics permission. Open billing to manage plan access."
                />
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>Advanced analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Plus privileges are active. Advanced analytics and priority support are available for testing.
                  </p>
                </CardContent>
              </Card>
            </PlanGate>
          </div>
        </>
      ) : null}
    </section>
  );
}
