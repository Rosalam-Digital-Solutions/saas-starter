import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingCancelPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <XCircle className="h-6 w-6 text-orange-700" />
          </div>
          <CardTitle>Checkout canceled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-gray-600">
            No subscription change was completed. You can review pricing again
            or return to dashboard billing.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <Link href="/pricing">Back to pricing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/billing">Dashboard billing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
