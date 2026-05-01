import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpgradePrompt({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-orange-900">{message}</p>
      <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600">
        <Link href="/pricing">
          Upgrade
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
