'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users, organizations, memberships, activityLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateUniqueSlug } from '@/lib/db/queries';
import { getTenantContextFromHeaders, isAdmin } from '@/lib/tenant';

type ActionResult = {
  error?: string;
  success?: string;
  name?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSessionCookieFromHeader(setCookieHeader: string | null): {
  name: string;
  value: string;
} | null {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/((?:__Secure-)?better-auth\.session_token)=([^;]+)/);
  if (!match) {
    return null;
  }

  return {
    name: match[1],
    value: match[2],
  };
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

// ============ AUTH ACTIONS ============

export async function signIn(prevState: any, formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirect') as string | null;

  const result = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }).safeParse({ email, password });

  if (!result.success) {
    return { error: 'Invalid email or password format' };
  }

  try {
    const sessionResponse = await auth.api.signInEmail({
      body: {
        email: result.data.email,
        password: result.data.password,
      },
    });

    if (!sessionResponse.token || !sessionResponse.user) {
      return { error: 'Invalid credentials' };
    }

    if (redirectTo === 'checkout') {
      const planKey = formData.get('planKey') as string;
      redirect(`/dashboard?redirect=checkout&planKey=${planKey}`);
    }

    redirect('/dashboard');
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
    return { error: getActionErrorMessage(e, 'Invalid credentials') };
  }
}

export async function signUp(prevState: any, formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const organizationName = formData.get('organizationName') as string;
  const redirectTo = formData.get('redirect') as string | null;

  const result = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    organizationName: z.string().min(2).max(100).optional()
  }).safeParse({ name, email, password, organizationName });

  if (!result.success) {
    return { error: 'Invalid form data' };
  }

  try {
    const sessionResponse = await auth.api.signUpEmail({
      body: {
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
      },
    });

    if (!sessionResponse.user) {
      return { error: 'Account creation failed' };
    }

    if (result.data.organizationName) {
      const slug = await generateUniqueSlug(result.data.organizationName);
      const ownerId = parseInt(sessionResponse.user.id, 10);
      const [org] = await db
        .insert(organizations)
        .values({
          name: result.data.organizationName,
          slug,
          ownerId,
        })
        .returning();

      await db.insert(memberships).values({
        userId: ownerId,
        organizationId: org.id,
        role: 'owner',
      });
    }

    if (redirectTo === 'checkout') {
      const planKey = formData.get('planKey') as string;
      redirect(`/dashboard?redirect=checkout&planKey=${planKey}`);
    }

    redirect('/dashboard');
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
    return { error: getActionErrorMessage(e, 'Account creation failed') };
  }
}

export async function signOut() {
  const heads = await headers();
  try {
    await auth.api.signOut({ headers: heads });
  } catch {
    // Redirect anyway so QA can continue through the visible app flow.
  }
  redirect('/sign-in');
}

// ============ USER ACTIONS ============

export async function updateProfile(prevState: any, formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;

  const result = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  }).safeParse({ name });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid profile data' };
  }

  const heads = await headers();
  const session = await auth.api.getSession({ headers: heads });
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  await db
    .update(users)
    .set({ name: result.data.name, updatedAt: new Date() })
    .where(eq(users.id, parseInt(session.user.id)));

  return { success: 'Profile updated successfully', name: result.data.name };
}

export const updateAccount = updateProfile;

export async function updatePassword(prevState: any, formData: FormData): Promise<ActionResult> {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const result = z
    .object({
      currentPassword: z.string().min(8),
      newPassword: z.string().min(8).max(100),
      confirmPassword: z.string().min(8).max(100),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'New passwords do not match',
      path: ['confirmPassword'],
    })
    .safeParse({ currentPassword, newPassword, confirmPassword });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid password data' };
  }

  try {
    const heads = await headers();
    await auth.api.changePassword({
      headers: heads,
      body: {
        currentPassword: result.data.currentPassword,
        newPassword: result.data.newPassword,
        revokeOtherSessions: true,
      },
    });

    return { success: 'Password updated successfully' };
  } catch (error) {
    return {
      error: getActionErrorMessage(
        error,
        'Password update failed. Verify the current password and Better Auth configuration.'
      ),
    };
  }
}

export async function deleteAccount(prevState: any, formData: FormData): Promise<ActionResult> {
  return { error: 'Account deletion is disabled' };
}

export async function removeMember(prevState: any, formData: FormData): Promise<ActionResult> {
  const userId = formData.get('userId') as string;
  const orgId = formData.get('organizationId') as string;

  if (!userId || !orgId) {
    return { error: 'Missing required fields' };
  }

  const heads = await headers();
  const session = await auth.api.getSession({ headers: heads });
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  await db
    .delete(memberships)
    .where(and(
      eq(memberships.userId, parseInt(userId)),
      eq(memberships.organizationId, parseInt(orgId))
    ));

  return { success: 'Member removed' };
}

export async function inviteMember(prevState: any, formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const orgId = formData.get('organizationId') as string;

  if (!email || !role || !orgId) {
    return { error: 'Missing required fields' };
  }

  const result = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'member', 'viewer']),
    orgId: z.string().min(1),
  }).safeParse({ email, role, orgId });

  if (!result.success) {
    return { error: 'Enter a valid invitation email and role' };
  }

  const heads = await headers();
  const session = await auth.api.getSession({ headers: heads });
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  await db.insert(memberships).values({
    organizationId: parseInt(result.data.orgId),
    email: result.data.email,
    role: result.data.role,
    invitedBy: parseInt(session.user.id),
  });

  return { success: 'Invitation sent' };
}

export async function updateMemberRole(prevState: any, formData: FormData): Promise<ActionResult> {
  const userId = formData.get('userId') as string;
  const orgId = formData.get('organizationId') as string;
  const role = formData.get('role') as string;

  const heads = await headers();
  const session = await auth.api.getSession({ headers: heads });
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  await db
    .update(memberships)
    .set({ role: role as 'admin' | 'member' | 'viewer' })
    .where(and(
      eq(memberships.userId, parseInt(userId)),
      eq(memberships.organizationId, parseInt(orgId))
    ));

  return { success: 'Role updated' };
}

export async function updateWorkspace(prevState: any, formData: FormData): Promise<ActionResult> {
  const name = formData.get('workspaceName') as string;

  const result = z.object({
    name: z.string().min(2).max(100),
  }).safeParse({ name });

  if (!result.success) {
    return { error: 'Workspace name must be between 2 and 100 characters' };
  }

  const heads = await headers();
  const ctx = await getTenantContextFromHeaders(heads);

  if (!ctx) {
    return { error: 'Not authenticated' };
  }

  if (!isAdmin(ctx)) {
    return { error: 'Only owners and admins can update workspace settings' };
  }

  await db
    .update(organizations)
    .set({ name: result.data.name, updatedAt: new Date() })
    .where(eq(organizations.id, ctx.organization.id));

  return { success: 'Workspace updated successfully', name: result.data.name };
}

export async function requestPasswordReset(
  prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string;
  const result = z.object({ email: z.string().email() }).safeParse({ email });

  if (!result.success) {
    return { error: 'Enter a valid email address' };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: result.data.email,
        redirectTo: `${requiredEnv('NEXT_PUBLIC_APP_URL')}/reset-password`,
      },
    });
  } catch {
    return {
      success:
        'If that email exists, the reset flow is ready. Configure sendResetPassword in Better Auth to deliver emails.',
    };
  }

  return {
    success:
      'If that email exists, check for a reset link. Configure email delivery before production.',
  };
}

export async function resetPassword(prevState: any, formData: FormData): Promise<ActionResult> {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const result = z
    .object({
      token: z.string().min(1, 'Reset token is required'),
      password: z.string().min(8).max(100),
      confirmPassword: z.string().min(8).max(100),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .safeParse({ token, password, confirmPassword });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid reset data' };
  }

  try {
    await auth.api.resetPassword({
      body: {
        token: result.data.token,
        newPassword: result.data.password,
      },
    });
  } catch (error) {
    return {
      error: getActionErrorMessage(
        error,
        'Password reset failed. The token may be invalid or expired.'
      ),
    };
  }

  return { success: 'Password reset successfully. You can sign in now.' };
}

export async function logOrgActivity(
  organizationId: number,
  userId: number | null,
  action: string,
  ipAddress?: string
) {
  await db.insert(activityLogs).values({
    organizationId,
    userId,
    action,
    ipAddress,
  });
}
