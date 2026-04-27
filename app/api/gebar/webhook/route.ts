import { NextRequest, NextResponse } from 'next/server';
import { handleGebarSubscriptionEvent } from '@/lib/payments/gebar';

function normalizeGebarWebhookEvent(event: any) {
  const data = event.data || event.object || event.payload || {};
  return {
    customerId:
      data.customerId ||
      data.customer_id ||
      data.billingCustomerId ||
      data.userId ||
      data.user_id,
    subscriptionId:
      data.subscriptionId ||
      data.subscription_id ||
      data.id,
    planId:
      data.planId ||
      data.plan_id ||
      data.productId ||
      data.product_id,
    planName:
      data.planName ||
      data.plan_name ||
      data.productName ||
      data.product_name,
    status:
      data.status ||
      data.subscriptionStatus ||
      data.subscription_status,
    currentPeriodEnd:
      data.currentPeriodEnd ||
      data.current_period_end ||
      data.periodEnd ||
      data.period_end,
  };
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  
  const signature =
    request.headers.get('gebar-signature') ||
    request.headers.get('x-gebar-signature') ||
    request.headers.get('gebarbilling-signature') ||
    request.headers.get('x-gebarbilling-signature');

  if (!signature) {
    console.error('Missing GebarBilling signature header');
    return NextResponse.json(
      { error: 'Missing signature header' },
      { status: 400 }
    );
  }

  try {
    const { constructEvent } = require('@gebarbilling/webhooks');
    
    let event;
    try {
      event = constructEvent(
        payload,
        signature,
        process.env.GEBARBILLING_WEBHOOK_SECRET!
      );
    } catch {
      const parsed = JSON.parse(payload);
      event = parsed;
    }

    console.log('Received GebarBilling event:', event.type);

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
        await handleGebarSubscriptionEvent(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}