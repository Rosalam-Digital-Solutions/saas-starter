import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    gebar: {
      hasSecret: !!process.env.GEBARBILLING_SECRET_KEY,
      hasBaseUrl: !!process.env.GEBARBILLING_BASE_URL,
      hasWebhookSecret: !!process.env.GEBARBILLING_WEBHOOK_SECRET,
      hasBasePlanId: !!process.env.GEBARBILLING_BASE_PLAN_ID,
      hasPlusPlanId: !!process.env.GEBARBILLING_PLUS_PLAN_ID,
      baseUrl: process.env.GEBARBILLING_BASE_URL,
      basePlanId: process.env.GEBARBILLING_BASE_PLAN_ID,
    },
    base: {
      url: process.env.BASE_URL,
    },
    db: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
    },
    auth: {
      hasSecret: !!process.env.AUTH_SECRET,
    },
  };

  const isConfigured = 
    config.gebar.hasSecret &&
    config.gebar.hasBasePlanId &&
    config.gebar.hasPlusPlanId;

  return NextResponse.json({
    configured: isConfigured,
    ...config,
  });
}
