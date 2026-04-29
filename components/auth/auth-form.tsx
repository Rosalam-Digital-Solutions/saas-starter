'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CircleIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorState } from '@/components/feedback/error-state';
import { signIn, signUp } from '@/app/(login)/actions';

interface ActionState {
  error?: string;
  success?: string;
}

export function AuthForm({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const planKey = searchParams.get('planKey');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    {}
  );

  const altHref = `${mode === 'signin' ? '/sign-up' : '/sign-in'}${
    redirect ? `?redirect=${redirect}` : ''
  }${planKey ? `${redirect ? '&' : '?'}planKey=${planKey}` : ''}`;

  return (
    <div className="min-h-[100dvh] bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-semibold text-gray-900">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          {mode === 'signin'
            ? 'Access your dashboard, billing, and workspace settings.'
            : 'Start testing the full SaaS workflow.'}
        </p>

        <form className="mt-8 space-y-5" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="planKey" value={planKey || ''} />

          {mode === 'signup' ? (
            <>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" autoComplete="name" required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="organizationName">Company or workspace name</Label>
                <Input id="organizationName" name="organizationName" maxLength={100} />
              </div>
            </>
          ) : null}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === 'signin' ? (
                <Link href="/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              maxLength={100}
            />
          </div>

          {state.error ? <ErrorState message={state.error} /> : null}

          <Button
            type="submit"
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600"
            disabled={pending}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {mode === 'signin' ? 'New to the starter?' : 'Already have an account?'}{' '}
          <Link href={altHref} className="font-medium text-orange-600 hover:text-orange-700">
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
