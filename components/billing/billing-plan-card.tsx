import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalButton } from '@/components/billing/portal-button';

export function BillingPlanCard({
  planName,
  status,
  billingCustomerId,
}: {
  planName?: string | null;
  status?: string | null;
  billingCustomerId?: string | null;
}) {
  const hasBillingCustomer = Boolean(billingCustomerId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-orange-500" />
          <CardTitle>Current subscription</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium text-gray-900">{planName || 'Free'}</p>
            <p className="text-sm capitalize text-gray-500">
              {status ? status.replace(/_/g, ' ') : 'No active subscription'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/pricing">{hasBillingCustomer ? 'View plans' : 'Choose a plan'}</Link>
            </Button>
            {hasBillingCustomer ? <PortalButton /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
