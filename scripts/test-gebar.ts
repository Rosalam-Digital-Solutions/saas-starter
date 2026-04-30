import 'dotenv/config';
import GebarBilling from '@gebarbilling/server';

type GebarEnvironment = 'development' | 'production' | 'test' | 'staging';

function requireGebarEnvironment(value: string | undefined): GebarEnvironment {
  if (
    value === 'development' ||
    value === 'production' ||
    value === 'test' ||
    value === 'staging'
  ) {
    return value;
  }

  throw new Error('GEBARBILLING_ENV must be development, production, test, or staging');
}

async function main() {
  console.log('=== GEBAR CONNECTIVITY TEST ===\n');

  if (!process.env.GEBARBILLING_SECRET_KEY) {
    console.error('GEBARBILLING_SECRET_KEY not set');
    process.exit(1);
  }

  if (!process.env.GEBARBILLING_BASE_URL) {
    console.error('GEBARBILLING_BASE_URL not set');
    process.exit(1);
  }

  if (!process.env.GEBARBILLING_BASE_PLAN_ID) {
    console.error('GEBARBILLING_BASE_PLAN_ID not set');
    process.exit(1);
  }

  if (!process.env.GEBARBILLING_ENV) {
    console.error('GEBARBILLING_ENV not set');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN) {
    console.error('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN not set');
    process.exit(1);
  }

  const environment = requireGebarEnvironment(process.env.GEBARBILLING_ENV);
  const checkoutDomain = process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN
    .split(',')[0]
    ?.trim()
    .replace(/\/+$/, '');

  if (!checkoutDomain) {
    console.error('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN must include at least one domain');
    process.exit(1);
  }

  console.log('Config loaded:');
  console.log('  BASE_URL:', process.env.GEBARBILLING_BASE_URL);
  console.log('  BASE_PLAN_ID:', process.env.GEBARBILLING_BASE_PLAN_ID);
  console.log('  ENV:', environment);
  console.log('');

  const client = new GebarBilling(process.env.GEBARBILLING_SECRET_KEY, {
    baseUrl: process.env.GEBARBILLING_BASE_URL,
    environment,
    checkoutDomain,
  });

  console.log('Testing Gebar connection...\n');

  try {
    console.log('Attempting to create checkout session...');
    
    const session = await client.checkout.sessions.create({
      customerId: `test_customer_${Date.now()}`,
      planId: process.env.GEBARBILLING_BASE_PLAN_ID,
      metadata: {
        test: 'true',
        timestamp: Date.now().toString(),
      },
    });

    console.log('Checkout session created successfully!\n');
    console.log('Session details:');
    console.log('  ID:', (session as any).id || (session as any).sessionId || 'N/A');
    console.log('  URL:', session.url || 'N/A');
    console.log('  Status:', (session as any).status || 'N/A');
    console.log('\nFull response:', JSON.stringify(session, null, 2));
    
    if (session.url) {
      console.log('\nCheckout URL:');
      console.log(session.url);
    }
  } catch (err: any) {
    console.error('Gebar connection failed:');
    console.error('  Error:', err.message || err);
    console.error('  Base URL:', process.env.GEBARBILLING_BASE_URL);
    console.error('  Plan ID:', process.env.GEBARBILLING_BASE_PLAN_ID);
    
    if (err.response) {
      console.error('  Response:', err.response.data || err.response);
    }

    console.error('');
    console.error('Check that GEBARBILLING_SECRET_KEY, GEBARBILLING_BASE_URL,');
    console.error('GEBARBILLING_BASE_PLAN_ID, and the Gebar checkout API route are valid.');
    
    process.exit(1);
  }
}

main();
