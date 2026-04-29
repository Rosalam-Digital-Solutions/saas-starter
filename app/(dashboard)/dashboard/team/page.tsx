'use client';

import { useActionState } from 'react';
import useSWR, { mutate } from 'swr';
import { Loader2, PlusCircle, UserPlus } from 'lucide-react';
import { inviteMember, removeMember } from '@/app/(login)/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingState } from '@/components/feedback/loading-state';
import { SuccessAlert } from '@/components/feedback/success-alert';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type OrgData = {
  id: number;
  role: string;
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

function displayName(user: { name: string | null; email: string }) {
  return user.name || user.email || 'Pending invitation';
}

export default function TeamPage() {
  const { data: orgData, isLoading } = useSWR<OrgData[]>('/api/team', fetcher);
  const org = orgData?.[0];
  const isAdmin = org?.role === 'owner' || org?.role === 'admin';
  const [removeState, removeAction, isRemovePending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await removeMember(prevState, formData);
      if (result.success) mutate('/api/team');
      return result;
    },
    {}
  );
  const [inviteState, inviteAction, isInvitePending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await inviteMember(prevState, formData);
      if (result.success) mutate('/api/team');
      return result;
    },
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <DashboardHeader
        title="Team"
        description="Review workspace members, send invitations, and test role-aware controls."
      />
      {isLoading ? <LoadingState message="Loading team..." /> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            {!org?.memberships?.length ? (
              <EmptyState
                icon={UserPlus}
                title="No members yet"
                description="Invite a teammate to test the team management flow."
              />
            ) : (
              <ul className="space-y-4">
                {org.memberships.map((member) => (
                  <li key={member.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {displayName(member.user).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{displayName(member.user)}</p>
                        <p className="text-sm capitalize text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    {isAdmin && member.role !== 'owner' && member.user.id > 0 ? (
                      <form action={removeAction}>
                        <input type="hidden" name="userId" value={member.user.id} />
                        <input type="hidden" name="organizationId" value={org.id} />
                        <Button type="submit" variant="outline" size="sm" disabled={isRemovePending}>
                          {isRemovePending ? 'Removing...' : 'Remove'}
                        </Button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {removeState.error ? <ErrorState className="mt-4" message={removeState.error} /> : null}
            {removeState.success ? <SuccessAlert className="mt-4" message={removeState.success} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite member</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteAction} className="space-y-4">
              <input type="hidden" name="organizationId" value={org?.id || ''} />
              <div>
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="teammate@company.com"
                  required
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label>Role</Label>
                <RadioGroup defaultValue="member" name="role" className="mt-2 flex gap-4" disabled={!isAdmin}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="member" id="member" />
                    <Label htmlFor="member">Member</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin">Admin</Label>
                  </div>
                </RadioGroup>
              </div>
              {inviteState.error ? <ErrorState message={inviteState.error} /> : null}
              {inviteState.success ? <SuccessAlert message={inviteState.success} /> : null}
              <Button type="submit" disabled={isInvitePending || !isAdmin} className="bg-orange-500 hover:bg-orange-600">
                {isInvitePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Invite member
              </Button>
            </form>
          </CardContent>
          {!isAdmin ? (
            <CardFooter>
              <p className="text-sm text-gray-500">Only owners and admins can invite members.</p>
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
