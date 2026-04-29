import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// ============ BETTER AUTH TABLES ============

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============ USERS (Better Auth compatible) ============

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  bannedAt: timestamp('banned_at'),
  bannedReason: text('banned_reason'),
});

// ============ ORGANIZATIONS (Multi-tenant) ============

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logo: text('logo'),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  suspendedAt: timestamp('suspended_at'),
  suspendedReason: text('suspended_reason'),
});

// ============ MEMBERSHIPS ============

export const membershipRoles = pgEnum('membership_role', ['owner', 'admin', 'member', 'viewer']);

export const memberships = pgTable('memberships', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  role: membershipRoles('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  invitedBy: integer('invited_by').references(() => users.id),
});

export const organizationInvitations = pgTable('organization_invitations', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: membershipRoles('role').notNull().default('member'),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
});

// ============ SUBSCRIPTIONS (Org-level billing) ============

export const subscriptionStatuses = pgEnum('subscription_status', [
  'active',
  'trialing',
  'pending',
  'canceled',
  'past_due',
  'paused',
]);

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  billingProvider: varchar('billing_provider', { length: 20 }).notNull().default('gebar'),
  billingCustomerId: text('billing_customer_id').unique(),
  billingSubscriptionId: text('billing_subscription_id').unique(),
  planId: text('plan_id'),
  planName: varchar('plan_name', { length: 50 }),
  status: subscriptionStatuses('status'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============ PLANS (Internal config) ============

export const plans = pgTable('plans', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  gebarPlanId: text('gebar_plan_id'),
  priceMonthly: integer('price_monthly'),
  currency: varchar('currency', { length: 10 }).notNull().default('usd'),
  trialPeriodDays: integer('trial_period_days').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ ENTITLEMENTS ============

export const entitlements = pgTable('entitlements', {
  id: serial('id').primaryKey(),
  planId: varchar('plan_id', { length: 50 })
    .notNull()
    .references(() => plans.id),
  featureKey: varchar('feature_key', { length: 100 }).notNull(),
  limitValue: integer('limit_value'),
  unlimited: boolean('unlimited').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ AUDIT LOGS ============

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  actorId: integer('actor_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 50 }),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============ ACTIVITY LOGS ============

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  memberships: many(memberships),
  organizationsOwned: many(organizations),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  subscriptions: many(subscriptions),
  invitations: many(organizationInvitations),
  activityLogs: many(activityLogs),
  auditLogs: many(auditLogs),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [memberships.invitedBy],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  entitlements: many(entitlements),
}));

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
  plan: one(plans, {
    fields: [entitlements.planId],
    references: [plans.id],
  }),
}));

// ============ TYPES ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Entitlement = typeof entitlements.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type OrganizationWithMemberships = Organization & {
  memberships: (Membership & { user: Pick<User, 'id' | 'name' | 'email'> })[];
};

export type UserWithMemberships = User & {
  memberships: (Membership & { organization: Pick<Organization, 'id' | 'name' | 'slug'> })[];
};

export type OrganizationWithSubscription = Organization & {
  subscription: Subscription | null;
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_ORGANIZATION = 'CREATE_ORGANIZATION',
  REMOVE_MEMBER = 'REMOVE_MEMBER',
  INVITE_MEMBER = 'INVITE_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  UPDATE_SUBSCRIPTION = 'UPDATE_SUBSCRIPTION',
  UPGRADE_PLAN = 'UPGRADE_PLAN',
  DOWNGRADE_PLAN = 'DOWNGRADE_PLAN',
  CANCEL_SUBSCRIPTION = 'CANCEL_SUBSCRIPTION',
  // Legacy aliases
  CREATE_TEAM = 'CREATE_ORGANIZATION',
  REMOVE_TEAM_MEMBER = 'REMOVE_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_MEMBER',
}

// ============ LEGACY ALIASES (for migration compatibility) ============

export const teams = organizations;
export const teamMembers = memberships;
export const team = organizations;
export const teamMember = memberships;

// @ts-ignore - for backward compatibility
export type Team = Organization;
// @ts-ignore
export type TeamMember = Membership;
// @ts-ignore
export type TeamDataWithMembers = OrganizationWithMemberships;