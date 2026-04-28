'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { useActionState } from 'react';
import { removeMember, inviteMember } from '@/app/(login)/actions';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Building2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type OrgData = {
  id: number;
  name: string;
  slug: string;
  role: string;
  subscription: {
    planName: string | null;
    status: string | null;
    billingCustomerId: string | null;
  } | null;
  memberships: {
    id: number;
    role: string;
    user: {
      id: number;
      name: string | null;
      email: string;
    };
  }[];
};

type ActionState = {
  error?: string;
  success?: string;
};

function SubscriptionSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ManageSubscription() {
  const { data: orgData } = useSWR<OrgData[]>('/api/team', fetcher);
  const org = orgData?.[0];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Organization Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <p className="font-medium">
                Current Plan: {org?.subscription?.planName || 'Free'}
              </p>
              <p className="text-sm text-muted-foreground">
                {org?.subscription?.status === 'active'
                  ? 'Billed monthly'
                  : org?.subscription?.status === 'trialing'
                  ? 'Trial period'
                  : org?.subscription?.status === 'pending'
                  ? 'Processing...'
                  : 'No active subscription'}
              </p>
            </div>
            {org?.subscription?.billingCustomerId ? (
              <Button variant="outline">
                Manage Billing
              </Button>
            ) : (
              <Button>
                Choose a Plan
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMembersSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Organization Members</CardTitle>
      </CardHeader>
    </Card>
  );
}

function OrganizationMembers() {
  const { data: orgData } = useSWR<OrgData[]>('/api/team', fetcher);
  const org = orgData?.[0];
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeMember, {});

  const getUserDisplayName = (user: { name: string | null; email: string }) => {
    return user.name || user.email || 'Unknown User';
  };

  if (!org?.memberships?.length) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Organization Members</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {org.memberships.map((member, index) => (
            <li key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {getUserDisplayName(member.user)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {getUserDisplayName(member.user)}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {member.role}
                  </p>
                </div>
              </div>
              {member.role !== 'owner' && index > 0 && (
                <form action={removeAction}>
                  <input type="hidden" name="userId" value={member.user.id} />
                  <input type="hidden" name="organizationId" value={org.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isRemovePending}
                  >
                    {isRemovePending ? 'Removing...' : 'Remove'}
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {removeState?.error && (
          <p className="text-red-500 mt-4">{removeState.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InviteMemberSkeleton() {
  return (
    <Card className="h-[260px]">
      <CardHeader>
        <CardTitle>Invite Member</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InviteMember() {
  const { data: orgData } = useSWR<OrgData[]>('/api/team', fetcher);
  const org = orgData?.[0];
  const isAdmin = org?.role === 'owner' || org?.role === 'admin';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteMember, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <input type="hidden" name="organizationId" value={org?.id || ''} />
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              disabled={!isAdmin}
            />
          </div>
          <div>
            <Label>Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isAdmin}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">Member</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin">Admin</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-500">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-500">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isInvitePending || !isAdmin}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isAdmin && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be an admin to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6 flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        Organization Settings
      </h1>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense fallback={<TeamMembersSkeleton />}>
        <OrganizationMembers />
      </Suspense>
      <Suspense fallback={<InviteMemberSkeleton />}>
        <InviteMember />
      </Suspense>
    </section>
  );
}