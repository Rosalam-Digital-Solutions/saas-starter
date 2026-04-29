'use client';

import { useActionState } from 'react';
import useSWR, { mutate } from 'swr';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState } from '@/components/feedback/error-state';
import { SuccessAlert } from '@/components/feedback/success-alert';
import { updateWorkspace } from '@/app/(login)/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type OrgData = {
  id: number;
  name: string;
  role: string;
};

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

export function SettingsForm() {
  const { data: orgData } = useSWR<OrgData[]>('/api/team', fetcher);
  const org = orgData?.[0];
  const canEdit = org?.role === 'owner' || org?.role === 'admin';
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await updateWorkspace(prevState, formData);
      if (result.success) mutate('/api/team');
      return result;
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={action}>
          <div>
            <Label htmlFor="workspaceName">Company / workspace name</Label>
            <Input
              id="workspaceName"
              name="workspaceName"
              defaultValue={state.name || org?.name || ''}
              disabled={!canEdit}
              required
            />
            {!canEdit ? (
              <p className="mt-1 text-xs text-gray-500">
                Only owners and admins can update workspace settings.
              </p>
            ) : null}
          </div>
          {state.error ? <ErrorState message={state.error} /> : null}
          {state.success ? <SuccessAlert message={state.success} /> : null}
          <Button type="submit" disabled={pending || !canEdit} className="bg-orange-500 hover:bg-orange-600">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save workspace
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
