function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  BASE_URL: required('BASE_URL'),
  POSTGRES_URL: required('POSTGRES_URL'),
  AUTH_SECRET: required('AUTH_SECRET'),
  
  GEBAR_SECRET_KEY: required('GEBARBILLING_SECRET_KEY'),
  GEBAR_BASE_URL: required('GEBARBILLING_BASE_URL'),
  GEBAR_WEBHOOK_SECRET: required('GEBARBILLING_WEBHOOK_SECRET'),
  GEBAR_BASE_PLAN_ID: required('GEBARBILLING_BASE_PLAN_ID'),
  GEBAR_PLUS_PLAN_ID: required('GEBARBILLING_PLUS_PLAN_ID'),
  
  GEBAR_BASE_PRICE_MONTHLY: required('GEBARBILLING_BASE_PRICE_MONTHLY'),
  GEBAR_PLUS_PRICE_MONTHLY: required('GEBARBILLING_PLUS_PRICE_MONTHLY'),
  GEBAR_CURRENCY: required('GEBARBILLING_CURRENCY'),
  GEBAR_ENV: required('GEBARBILLING_ENV'),
  GEBAR_PORTAL_DOMAIN: process.env.GEBARBILLING_PORTAL_DOMAIN ?? '',

  NEXT_PUBLIC_APP_URL: required('NEXT_PUBLIC_APP_URL'),
  NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN: required('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN'),
  NEXT_PUBLIC_GEBARBILLING_PORTAL_DOMAIN: process.env.NEXT_PUBLIC_GEBARBILLING_PORTAL_DOMAIN ?? '',
} as const;

export function validateGebarConfig(): void {
  const issues: string[] = [];
  
  if (!process.env.GEBARBILLING_SECRET_KEY) {
    issues.push('GEBARBILLING_SECRET_KEY');
  }
  
  if (!process.env.GEBARBILLING_BASE_URL) {
    issues.push('GEBARBILLING_BASE_URL');
  }
  
  if (!process.env.GEBARBILLING_WEBHOOK_SECRET) {
    issues.push('GEBARBILLING_WEBHOOK_SECRET');
  }
  
  if (!process.env.GEBARBILLING_BASE_PLAN_ID) {
    issues.push('GEBARBILLING_BASE_PLAN_ID');
  }
  
  if (!process.env.GEBARBILLING_PLUS_PLAN_ID) {
    issues.push('GEBARBILLING_PLUS_PLAN_ID');
  }

  if (!process.env.GEBARBILLING_BASE_PRICE_MONTHLY) {
    issues.push('GEBARBILLING_BASE_PRICE_MONTHLY');
  }

  if (!process.env.GEBARBILLING_PLUS_PRICE_MONTHLY) {
    issues.push('GEBARBILLING_PLUS_PRICE_MONTHLY');
  }

  if (!process.env.GEBARBILLING_CURRENCY) {
    issues.push('GEBARBILLING_CURRENCY');
  }

  if (!process.env.GEBARBILLING_ENV) {
    issues.push('GEBARBILLING_ENV');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    issues.push('NEXT_PUBLIC_APP_URL');
  }

  if (!process.env.NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN) {
    issues.push('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN');
  }
  
  if (issues.length > 0) {
    throw new Error(
      `Missing required Gebar configuration: ${issues.join(', ')}`
    );
  }
  
  console.log('Gebar configuration validated');
}
