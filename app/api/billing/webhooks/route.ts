import { NextResponse } from 'next/server';
import { constructEvent, applyWebhookEvent } from '@gebarbilling/webhooks';
import {
  getWebhookEventByEventId,
  createWebhookEvent,
  markWebhookEventProcessed,
} from '@/lib/db/queries';
import { handleGebarSubscriptionEvent } from '@/lib/payments/gebar';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-gebarbilling-signature');

  if (!signature) {
    return new Response('Missing webhook signature', { status: 400 });
  }

  let event: any;

  try {
    event = constructEvent(rawBody, signature, process.env.GEBARBILLING_WEBHOOK_SECRET!, {
      allowLegacySignatures: true,
    });
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

    await createWebhookEvent(event.id, event.type ?? 'unknown', event);

    await applyWebhookEvent(event, {
      async onSubscriptionCreated(e) {
        await handleGebarSubscriptionEvent(e);
      },
      async onSubscriptionUpdated(e) {
        await handleGebarSubscriptionEvent(e);
      },
      async onSubscriptionCancelled(e) {
        await handleGebarSubscriptionEvent(e);
      },
      async onInvoicePaid(e) {
        await handleGebarSubscriptionEvent(e);
      },
      async onInvoiceFailed(e) {
        await handleGebarSubscriptionEvent(e);
      },
      async onUnknownEvent(e) {
        console.log('Unhandled GebarBilling webhook:', e.type);
      },
    });

    await markWebhookEventProcessed(event.id);

    return NextResponse.json({ received: true, id: event.id, type: event.type });
  } catch (error) {
    console.error('Failed processing webhook event:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}
