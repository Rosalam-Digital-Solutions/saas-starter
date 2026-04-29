import { NextRequest, NextResponse } from 'next/server';
import { handleGebarSubscriptionEvent } from '@/lib/payments/gebar';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  
  console.log('=== GEBAR WEBHOOK RECEIVED ===');
  console.log('Raw payload length:', payload.length);

  const signature =
    request.headers.get('gebar-signature') ||
    request.headers.get('x-gebar-signature') ||
    request.headers.get('gebarbilling-signature') ||
    request.headers.get('x-gebarbilling-signature');

  if (!signature) {
    console.error('Missing Gebar signature header');
    return NextResponse.json(
      { error: 'Missing signature header' },
      { status: 400 }
    );
  }

  console.log('Signature header present:', !!signature);

  if (!process.env.GEBARBILLING_WEBHOOK_SECRET) {
    console.error('GEBARBILLING_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  let event: any;
  
  try {
    const { constructEvent } = require('@gebarbilling/webhooks');
    
    event = constructEvent(
      payload,
      signature,
      process.env.GEBARBILLING_WEBHOOK_SECRET
    );
    
    console.log('Webhook signature verified successfully');
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  console.log('Event type:', event.type);
  console.log('Event data:', JSON.stringify(event.data || event, null, 2));

  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
    case 'subscription.trialing':
    case 'subscription.cancelled':
    case 'subscription.canceled':
    case 'subscription.deleted':
    case 'invoice.paid':
    case 'invoice.payment_failed':
      try {
        await handleGebarSubscriptionEvent(event);
        console.log('Webhook event handled successfully');
      } catch (err) {
        console.error('Error handling webhook event:', err);
        return NextResponse.json(
          { error: 'Event handling failed' },
          { status: 500 }
        );
      }
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
