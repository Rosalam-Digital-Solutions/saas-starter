import { NextRequest, NextResponse } from 'next/server';
import { handleGebarSubscriptionEvent } from '@/lib/payments/gebar';
import crypto from 'crypto';

const handledGebarEvents = new Set([
  'subscription.created',
  'subscription.updated',
  'subscription.active',
  'subscription.trialing',
  'subscription.cancelled',
  'subscription.canceled',
  'subscription.deleted',
  'subscription.pending_update.create',
  'subscription.end.of.this.cycle',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.failed',
  'payment.paid',
  'payment.succeeded',
  'payment.failed',
  'user.updated',
  'user.metric.update',
]);

export async function POST(request: NextRequest) {
  const payload = await request.text();

  console.log('=== GEBAR WEBHOOK RECEIVED ===');
  console.log('Raw payload length:', payload.length);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));

  const signature =
    request.headers.get('x-gebarbilling-signature') ||
    request.headers.get('x-signature') ||
    request.headers.get('gebar-signature') ||
    request.headers.get('gebarbilling-signature');

  const authHeader = request.headers.get('authorization');
  const eventTypeHeader = request.headers.get('eventtype') ||
                         request.headers.get('EventType') ||
                         request.headers.get('x-event-type');

  if (!process.env.GEBARBILLING_WEBHOOK_SECRET) {
    console.error('GEBARBILLING_WEBHOOK_SECRET not configured');
    return new Response('Server misconfiguration', { status: 500 });
  }

  let event: any;

  try {
    if (signature && request.headers.get('x-signature-algorithm') === 'hmac') {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.GEBARBILLING_WEBHOOK_SECRET)
        .update(payload)
        .digest('base64');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        throw new Error('Invalid HMAC signature');
      }

      event = JSON.parse(payload);
      console.log('Webhook HMAC signature verified successfully');
    } else if (authHeader) {
      const expectedAuth = `Bearer ${process.env.GEBARBILLING_WEBHOOK_SECRET}`;
      if (authHeader !== expectedAuth) {
        throw new Error('Invalid API key');
      }

      const { constructEvent } = require('@gebarbilling/webhooks');
      event = constructEvent(
        payload,
        signature || '',
        process.env.GEBARBILLING_WEBHOOK_SECRET
      );
      console.log('Webhook API key verified successfully');
    } else {
      return new Response('Missing authorization or signature', { status: 401 });
    }
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response('Invalid webhook signature', { status: 401 });
  }

  const eventType = eventTypeHeader || event.type || event.eventType || event.event?.type;
  console.log('Event type from header:', eventTypeHeader);
  console.log('Event type from event:', event.type);
  console.log('Full event:', JSON.stringify(event).substring(0, 1000));

  if (!eventType || !handledGebarEvents.has(eventType)) {
    console.log(`Unhandled event type: ${eventType}`);
    return new Response('success', { status: 200 });
  }

  event.type = eventType;

  try {
    await handleGebarSubscriptionEvent(event);
    console.log('Webhook event handled successfully');
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return new Response('Event handling failed', { status: 500 });
  }

  return new Response('success', { status: 200 });
}
