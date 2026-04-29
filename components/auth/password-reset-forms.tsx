'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState } from '@/components/feedback/error-state';
import { SuccessAlert } from '@/components/feedback/success-alert';
import { requestPasswordReset, resetPassword } from '@/app/(login)/actions';

type ActionState = {
  error?: string;
  success?: string;
};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    requestPasswordReset,
    {}
  );

  return (
    <form className="space-y-4" action={action}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      {state.error ? <ErrorState message={state.error} /> : null}
      {state.success ? <SuccessAlert message={state.success} /> : null}
      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send reset link
      </Button>
      <Link href="/sign-in" className="block text-center text-sm text-gray-500 hover:text-gray-900">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, action, pending] = useActionState<ActionState, FormData>(
    resetPassword,
    {}
  );

  return (
    <form className="space-y-4" action={action}>
      <input type="hidden" name="token" value={token} />
      {!token ? (
        <ErrorState message="A reset token is required. Use the link from the reset email." />
      ) : null}
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
      </div>
      {state.error ? <ErrorState message={state.error} /> : null}
      {state.success ? <SuccessAlert message={state.success} /> : null}
      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600"
        disabled={pending || !token}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Reset password
      </Button>
      <Link href="/sign-in" className="block text-center text-sm text-gray-500 hover:text-gray-900">
        Return to sign in
      </Link>
    </form>
  );
}
