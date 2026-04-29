'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MobileNavigation({
  links,
  onNavigate,
}: {
  links: { href: string; label: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-1 border-t border-gray-200 bg-white px-4 py-4 lg:hidden">
      {links.map((link) => (
        <Button
          key={link.href}
          asChild
          variant="ghost"
          className={cn(
            'w-full justify-start',
            pathname === link.href && 'bg-gray-100'
          )}
          onClick={onNavigate}
        >
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
    </div>
  );
}
