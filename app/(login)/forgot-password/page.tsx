import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/password-reset-forms';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <p className="text-sm text-gray-500">
            Enter your email and the app will start the Better Auth reset flow.
          </p>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
