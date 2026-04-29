'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/error-state';
import {
  createCheckoutSession,
  redirectToHostedBilling,
} from '@/lib/api/billing';

export function CheckoutButton({
  planKey,
  label = 'Start checkout',
  className,
}: {
  planKey: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const session = await createCheckoutSession(planKey);
      redirectToHostedBilling(session.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        variant="outline"
        className={className || 'w-full rounded-full'}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}
