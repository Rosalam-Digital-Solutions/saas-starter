'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/error-state';

export function ManageBillingButton({
  label = 'Manage Billing',
  variant = 'outline',
  className,
}: {
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openBillingPortal() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        if (data.code === 'no_subscription') {
          throw new Error('No active subscription found. Purchase a plan first to manage billing.');
        }
        throw new Error(data.error ?? 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to open billing portal'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={openBillingPortal}
        disabled={loading}
        variant={variant}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}
