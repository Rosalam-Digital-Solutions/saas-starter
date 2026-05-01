import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { subscriptions, memberships } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ManageBillingButton } from '@/components/billing/manage-billing-button';

export default async function BillingPage() {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, parseInt(session.user.id)),
    with: {
      organization: {
        with: {
          subscriptions: true,
        },
      },
    },
  });

  if (!membership?.organization) {
    redirect('/dashboard');
  }

  const subscription = membership.organization.subscriptions[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-600">
          Manage your subscription and billing details.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Subscription</h2>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium">
              {subscription?.status ? (
                <span
                  className={
                    subscription.status === 'active'
                      ? 'text-green-600'
                      : subscription.status === 'trialing'
                        ? 'text-blue-600'
                        : subscription.status === 'past_due'
                          ? 'text-red-600'
                          : subscription.status === 'cancelled' ||
                              subscription.status === 'canceled'
                            ? 'text-gray-600'
                            : 'text-gray-600'
                  }
                >
                  {subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)}
                </span>
              ) : (
                'No active subscription'
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Plan</span>
            <span className="font-medium">
              {subscription?.planName ?? 'Free'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Current period ends</span>
            <span className="font-medium">
              {subscription?.currentPeriodEnd
                ? subscription.currentPeriodEnd.toLocaleDateString()
                : 'N/A'}
            </span>
          </div>

          {subscription?.cancelAtPeriodEnd && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              Your subscription will cancel at the end of the current billing
              period.
            </div>
          )}
        </div>

        <div className="mt-6">
          <ManageBillingButton />
        </div>
      </div>
    </div>
  );
}
