'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users, organizations, memberships, activityLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateUniqueSlug } from '@/lib/db/queries';

type ActionResult = {
  error?: string;
  success?: string;
  name?: string;
};

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
    return { error: getActionErrorMessage(e, 'Account creation failed') };
  }
}

export async function signOut() {
  redirect('/sign-in');
}

// ============ USER ACTIONS ============

export async function updateAccount(prevState: any, formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;

  const session = await auth.api.getSession();
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  await db
    .update(users)
    .set({ name, updatedAt: new Date() })
    .where(eq(users.id, parseInt(session.user.id)));

  return { success: 'Account updated successfully', name };
}

export async function updatePassword(prevState: any, formData: FormData): Promise<ActionResult> {
  return { error: 'Password update requires verification' };
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

  const session = await auth.api.getSession();
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

  const session = await auth.api.getSession();
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  await db.insert(memberships).values({
    organizationId: parseInt(orgId),
    email,
    role: role as 'admin' | 'member' | 'viewer',
    invitedBy: parseInt(session.user.id),
  });

  return { success: 'Invitation sent' };
}

export async function updateMemberRole(prevState: any, formData: FormData): Promise<ActionResult> {
  const userId = formData.get('userId') as string;
  const orgId = formData.get('organizationId') as string;
  const role = formData.get('role') as string;

  const session = await auth.api.getSession();
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