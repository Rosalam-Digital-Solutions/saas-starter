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
import { updateProfile } from '@/app/(login)/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type UserData = {
  id: number;
  name: string | null;
  email: string;
};

export function ProfileForm() {
  const { data: user } = useSWR<UserData>('/api/user', fetcher);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await updateProfile(prevState, formData);
      if (result.success) mutate('/api/user');
      return result;
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile information</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={action}>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={state.name || user?.name || ''}
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled readOnly />
            <p className="mt-1 text-xs text-gray-500">Email changes are disabled in this starter.</p>
          </div>
          {state.error ? <ErrorState message={state.error} /> : null}
          {state.success ? <SuccessAlert message={state.success} /> : null}
          <Button type="submit" disabled={pending} className="bg-orange-500 hover:bg-orange-600">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
