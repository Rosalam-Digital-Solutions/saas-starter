import { NextResponse } from 'next/server';
import { constructEvent, applyWebhookEvent } from '@gebarbilling/webhooks';
import { db } from '@/lib/db/drizzle';
import { subscriptions, webhookEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getWebhookEventByEventId,
  createWebhookEvent,
  markWebhookEventProcessed,
  getSubscriptionByBillingCustomerId,
  getOrganizationById,
} from '@/lib/db/queries';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value < 10_000_000_000 ? value * 1000 : value);
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function parseOrganizationId(value?: string): number | undefined {
  if (!value) return undefined;
  const rawId = value.startsWith('org_') ? value.slice(4) : value;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

async function resolveOrganizationId(data: any): Promise<number | undefined> {
  const externalUserId = data.externalUserId ?? data.userId ?? data.external_user_id;
  const organizationId = parseOrganizationId(externalUserId);

  if (organizationId) {
    const org = await getOrganizationById(organizationId);
    if (org) return organizationId;
  }

  const customerId = data.customerId ?? data.customer_id;
  if (customerId) {
    const subscription = await getSubscriptionByBillingCustomerId(customerId);
    return subscription?.organizationId;
  }

  return undefined;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-gebarbilling-signature');

  if (!signature) {
    return new Response('Missing webhook signature', { status: 400 });
  }

  let event: any;

  try {
    event = constructEvent(
      rawBody,
      signature,
      process.env.GEBARBILLING_WEBHOOK_SECRET!,
      {
        allowLegacySignatures: true,
      }
    );
  } catch (err) {
    console.error('Invalid webhook signature or payload', err);
    return new Response('Invalid webhook signature', { status: 400 });
  }

  if (!event || !event.id) {
    return new Response('Invalid event', { status: 400 });
  }

  try {
    const existing = await getWebhookEventByEventId(event.id);
    if (existing) {
      return NextResponse.json({ received: true, id: event.id, duplicate: true });
    }

    await applyWebhookEvent(event, {
      async onSubscriptionCreated(e) {
        const data = e.data as any;
        const organizationId = await resolveOrganizationId(data);

        if (!organizationId) {
          console.warn('Could not resolve organization for subscription.created', {
            eventId: e.id,
            externalUserId: data.externalUserId,
            customerId: data.customerId,
          });
          return;
        }

        const subscriptionId = data.id ?? data.subscriptionId ?? `sub_${organizationId}_${Date.now()}`;

        await db
          .insert(subscriptions)
          .values({
            id: subscriptionId,
            organizationId,
            userId: data.externalUserId ?? data.userId ?? null,
            billingCustomerId: data.customerId,
            billingSubscriptionId: data.subscriptionId ?? data.id,
            planId: data.planId,
            priceId: data.priceId,
            planName: data.planName,
            status: data.status ?? 'active',
            currentPeriodStart: toDate(data.currentPeriodStart),
            currentPeriodEnd: toDate(data.currentPeriodEnd),
            cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: subscriptions.id,
            set: {
              billingCustomerId: data.customerId,
              billingSubscriptionId: data.subscriptionId ?? data.id,
              planId: data.planId,
              priceId: data.priceId,
              planName: data.planName,
              status: data.status ?? 'active',
              currentPeriodStart: toDate(data.currentPeriodStart),
              currentPeriodEnd: toDate(data.currentPeriodEnd),
              cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
              updatedAt: new Date(),
            },
          });
      },

      async onSubscriptionUpdated(e) {
        const data = e.data as any;
        const organizationId = await resolveOrganizationId(data);

        if (!organizationId) {
          console.warn('Could not resolve organization for subscription.updated', {
            eventId: e.id,
          });
          return;
        }

        const subscriptionId = data.id ?? data.subscriptionId;
        if (!subscriptionId) {
          console.warn('Missing subscriptionId in subscription.updated', {
            eventId: e.id,
          });
          return;
        }

        await db
          .update(subscriptions)
          .set({
            billingCustomerId: data.customerId,
            billingSubscriptionId: subscriptionId,
            planId: data.planId,
            priceId: data.priceId,
            planName: data.planName,
            status: data.status,
            currentPeriodStart: toDate(data.currentPeriodStart),
            currentPeriodEnd: toDate(data.currentPeriodEnd),
            cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
      },

      async onSubscriptionCancelled(e) {
        const data = e.data as any;
        const organizationId = await resolveOrganizationId(data);

        if (!organizationId) {
          console.warn('Could not resolve organization for subscription.cancelled', {
            eventId: e.id,
          });
          return;
        }

        const subscriptionId = data.id ?? data.subscriptionId;
        if (!subscriptionId) {
          console.warn('Missing subscriptionId in subscription.cancelled', {
            eventId: e.id,
          });
          return;
        }

        await db
          .update(subscriptions)
          .set({
            status: 'cancelled',
            cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
      },

      async onInvoicePaid(e) {
        const data = e.data as any;
        const organizationId = await resolveOrganizationId(data);

        if (!organizationId) {
          console.warn('Could not resolve organization for invoice.paid', {
            eventId: e.id,
          });
          return;
        }

        const subscriptionId = data.subscriptionId ?? data.id;
        if (!subscriptionId) {
          console.warn('Missing subscriptionId in invoice.paid', {
            eventId: e.id,
          });
          return;
        }

        await db
          .update(subscriptions)
          .set({
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
      },

      async onInvoiceFailed(e) {
        const data = e.data as any;
        const organizationId = await resolveOrganizationId(data);

        if (!organizationId) {
          console.warn('Could not resolve organization for invoice.failed', {
            eventId: e.id,
          });
          return;
        }

        const subscriptionId = data.subscriptionId ?? data.id;
        if (!subscriptionId) {
          console.warn('Missing subscriptionId in invoice.failed', {
            eventId: e.id,
          });
          return;
        }

        await db
          .update(subscriptions)
          .set({
            status: 'past_due',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscriptionId));
      },

      async onUnknownEvent(e) {
        console.log('Unhandled GebarBilling webhook:', e.type);
      },
    });

    await createWebhookEvent(event.id, event.type ?? 'unknown', event);
    await markWebhookEventProcessed(event.id);

    return NextResponse.json({ received: true, id: event.id, type: event.type });
  } catch (error) {
    console.error('Failed processing webhook event:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}
