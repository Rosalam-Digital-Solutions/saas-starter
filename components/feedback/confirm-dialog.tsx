'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ConfirmDialog({
  label,
  confirmLabel = 'Confirm',
  message,
  onConfirm,
  disabled,
}: {
  label: string;
  confirmLabel?: string;
  message: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="mb-3 text-sm text-gray-600">{message}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
