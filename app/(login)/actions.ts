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
    const session = await auth.api.getSession();
    if (session?.user) {
      if (redirectTo === 'checkout') {
        const planKey = formData.get('planKey') as string;
        redirect(`/dashboard?redirect=checkout&planKey=${planKey}`);
      }
      redirect('/dashboard');
    }
    return { error: 'Authentication failed' };
  } catch (e) {
    return { error: 'Invalid credentials' };
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

  // Create user directly in DB (Better Auth handles password hashing)
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(result.data.password, 12);
  
  const [user] = await db
    .insert(users)
    .values({
      name: result.data.name,
      email: result.data.email,
      passwordHash,
    })
    .returning();

  if (result.data.organizationName) {
    const slug = await generateUniqueSlug(result.data.organizationName);
    const [org] = await db
      .insert(organizations)
      .values({
        name: result.data.organizationName,
        slug,
        ownerId: user.id,
      })
      .returning();
    
    await db.insert(memberships).values({
      userId: user.id,
      organizationId: org.id,
      role: 'owner',
    });
  }

  if (redirectTo === 'checkout') {
    const planKey = formData.get('planKey') as string;
    redirect(`/dashboard?redirect=checkout&planKey=${planKey}`);
  }

  redirect('/dashboard');
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