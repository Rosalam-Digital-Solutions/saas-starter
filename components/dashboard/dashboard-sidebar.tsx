'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  LayoutDashboard,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/account', icon: Shield, label: 'Account' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/team', icon: Users, label: 'Team' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="h-full overflow-y-auto p-4">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Button
            key={item.href}
            asChild
            variant={active ? 'secondary' : 'ghost'}
            className={cn('my-1 w-full justify-start shadow-none', active && 'bg-gray-100')}
            onClick={onNavigate}
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
