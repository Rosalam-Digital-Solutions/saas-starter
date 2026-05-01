'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/loading-state';
import { ErrorState } from '@/components/feedback/error-state';
import { syncSubscription } from '@/lib/api/billing';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BillingSuccessPage() {
  const { data: user, isLoading: isUserLoading } = useSWR('/api/user', fetcher);
  const { data, isLoading, error } = useSWR(
    user ? '/api/billing/subscription' : null,
    syncSubscription
  );

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-700" />
          </div>
          <CardTitle>Checkout complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isUserLoading || isLoading ? (
            <LoadingState message="Refreshing subscription..." />
          ) : null}
          {error ? <ErrorState message="Could not refresh subscription state yet." /> : null}
          {data ? (
            <p className="text-sm text-gray-600">
              Gebar received your checkout return. Your dashboard now shows the
              latest subscription state available from the backend.
            </p>
          ) : null}
          {!isUserLoading && !user ? (
            <p className="text-sm text-gray-600">
              Gebar received the checkout return. Sign in to view the latest
              subscription state for your workspace.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">View plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
