'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/error-state';
import {
  createPortalSession,
  redirectToHostedBilling,
} from '@/lib/api/billing';

export function PortalButton({
  label = 'Manage billing',
  variant = 'outline',
}: {
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);

    try {
      const portal = await createPortalSession();
      redirectToHostedBilling(portal.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={openPortal} disabled={loading} variant={variant}>
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
