import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({
  message = 'Loading...',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-gray-600', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
      {message}
    </div>
  );
}
