import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/lib/db/drizzle';
import * as schema from '@/lib/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  plugins: [nextCookies()],
  advanced: {
    database: {
      generateId: (options) => {
        if (
          options.model === 'user' ||
          options.model === 'users' ||
          options.model === 'account' ||
          options.model === 'accounts'
        ) {
          return false;
        }
        return crypto.randomUUID();
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Auth = typeof auth;
export type Session = Awaited<ReturnType<Auth['api']['getSession']>>;

export async function getCurrentUser(headers?: Headers) {
  if (!headers) {
    return null;
  }

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };
}
