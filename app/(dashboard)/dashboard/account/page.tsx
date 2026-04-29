'use client';

import { useActionState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { updatePassword } from '@/app/(login)/actions';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ErrorState } from '@/components/feedback/error-state';
import { SuccessAlert } from '@/components/feedback/success-alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PasswordState = {
  error?: string;
  success?: string;
};

export default function AccountPage() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    updatePassword,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <DashboardHeader
        title="Account"
        description="Update password and review account-level safety controls."
      />
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={action}>
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required minLength={8} />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
            </div>
            {state.error ? <ErrorState message={state.error} /> : null}
            {state.success ? <SuccessAlert message={state.success} /> : null}
            <Button type="submit" disabled={pending} className="bg-orange-500 hover:bg-orange-600">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Account deletion is disabled in this starter to keep QA data stable.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
