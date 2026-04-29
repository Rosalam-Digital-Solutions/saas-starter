'use client';

import Link from 'next/link';
import { CalendarDays, CheckCircle2, Gauge, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalButton } from '@/components/billing/portal-button';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import type { BillingSubscriptionState } from '@/lib/billing/access';

export function DashboardBillingPage({
  subscription,
  isLoading,
  error,
  updated,
  unauthenticated,
}: {
  subscription?: BillingSubscriptionState;
  isLoading?: boolean;
  error?: unknown;
  updated?: boolean;
  unauthenticated?: boolean;
}) {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <DashboardHeader
        title="Billing"
        description="View your current Gebar subscription and open hosted billing to manage plan, payment, and invoice details."
      />

      {updated ? (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Billing updated. The latest subscription state is shown below.
        </div>
      ) : null}

      {isLoading ? <LoadingState message="Loading subscription..." /> : null}
      {unauthenticated ? (
        <ErrorState message="Sign in to view billing for your workspace." />
      ) : null}
      {error ? <ErrorState message="Could not load billing information." /> : null}

      {!isLoading && !error && subscription ? (
        <div className="space-y-6">
          <CurrentPlanCard subscription={subscription} />
          <div className="grid gap-6 lg:grid-cols-2">
            <SubscriptionUsage limits={subscription.limits} />
            <PermissionsCard permissions={subscription.permissions} />
          </div>
          <HostedBillingCard active={subscription.status !== 'inactive'} />
        </div>
      ) : null}

      {!isLoading && !error && !subscription ? (
        <EmptyState
          title="No billing state found"
          description="Gebar could not load a subscription state for this workspace."
        />
      ) : null}
    </section>
  );
}

function CurrentPlanCard({
  subscription,
}: {
  subscription: BillingSubscriptionState;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-2xl font-semibold text-gray-900">
              {subscription.planName || 'No active plan'}
            </p>
            <p className="mt-1 text-sm capitalize text-gray-500">
              {subscription.status.replace(/_/g, ' ')}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 text-orange-500" />
              Renewal:{' '}
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : 'Not available yet'}
            </p>
            {subscription.cancelAtPeriodEnd ? (
              <p className="mt-2 text-sm text-orange-700">
                This subscription is set to cancel at period end.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {subscription.status === 'inactive' ? (
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <Link href="/pricing">Choose a plan</Link>
              </Button>
            ) : (
              <>
                <PortalButton variant="default" />
                <PortalButton label="Change plan" />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionUsage({
  limits,
}: {
  limits: BillingSubscriptionState['limits'];
}) {
  const items = Object.entries(limits);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-orange-500" />
          <CardTitle>Usage limits</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-3">
            {items.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span className="capitalize text-gray-600">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No limits available"
            description="Limits will appear after Gebar returns an active subscription state."
            className="py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}

function PermissionsCard({
  permissions,
}: {
  permissions: BillingSubscriptionState['permissions'];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-orange-500" />
          <CardTitle>Permissions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {permissions.length ? (
          <ul className="space-y-3">
            {permissions.map((permission) => (
              <li key={permission} className="flex gap-2 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                <span className="capitalize">{permission.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No active permissions"
            description="Choose a plan to unlock workspace permissions."
            className="py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}

function HostedBillingCard({ active }: { active: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hosted Gebar billing</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-gray-600 lg:flex-row lg:items-center lg:justify-between">
        <p>
          Gebar hosted billing handles plan changes, cancellation, payment
          methods, invoices, and billing information.
        </p>
        {active ? <PortalButton label="Open hosted billing" /> : null}
      </CardContent>
    </Card>
  );
}
