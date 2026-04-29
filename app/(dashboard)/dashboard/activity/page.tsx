import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getOrganizationActivity } from '@/lib/db/queries';
import { getTenantContextFromHeaders } from '@/lib/tenant';

const iconMap: Record<string, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_ORGANIZATION]: UserPlus,
  [ActivityType.REMOVE_MEMBER]: UserMinus,
  [ActivityType.INVITE_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.UPDATE_SUBSCRIPTION]: CreditCard,
  [ActivityType.UPGRADE_PLAN]: ArrowUpCircle,
  [ActivityType.DOWNGRADE_PLAN]: ArrowDownCircle,
  [ActivityType.CANCEL_SUBSCRIPTION]: XCircle,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: string): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'Signed up';
    case ActivityType.SIGN_IN:
      return 'Signed in';
    case ActivityType.SIGN_OUT:
      return 'Signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'Changed password';
    case ActivityType.DELETE_ACCOUNT:
      return 'Deleted account';
    case ActivityType.UPDATE_ACCOUNT:
      return 'Updated account';
    case ActivityType.CREATE_ORGANIZATION:
      return 'Created organization';
    case ActivityType.REMOVE_MEMBER:
      return 'Removed member';
    case ActivityType.INVITE_MEMBER:
      return 'Invited member';
    case ActivityType.ACCEPT_INVITATION:
      return 'Accepted invitation';
    case ActivityType.UPDATE_SUBSCRIPTION:
      return 'Updated subscription';
    case ActivityType.UPGRADE_PLAN:
      return 'Upgraded plan';
    case ActivityType.DOWNGRADE_PLAN:
      return 'Downgraded plan';
    case ActivityType.CANCEL_SUBSCRIPTION:
      return 'Canceled subscription';
    default:
      return action.replace(/_/g, ' ').toLowerCase();
  }
}

export default async function ActivityPage() {
  const heads = await headers();
  const ctx = await getTenantContextFromHeaders(heads);
  const logs = ctx ? await getOrganizationActivity(ctx.organization.id) : [];

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Activity Log
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action] || Settings;
                const formattedAction = formatAction(log.action);

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you perform actions like signing in or updating your
                account, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}