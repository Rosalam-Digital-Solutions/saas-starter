function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string = ''): string {
  return process.env[name] || fallback;
}

export const env = {
  BASE_URL: required('BASE_URL', 'http://localhost:3000'),
  POSTGRES_URL: required('POSTGRES_URL'),
  AUTH_SECRET: required('AUTH_SECRET'),
  
  GEBAR_SECRET_KEY: required('GEBARBILLING_SECRET_KEY'),
  GEBAR_BASE_URL: required('GEBARBILLING_BASE_URL', 'https://api.gebarbilling.et'),
  GEBAR_WEBHOOK_SECRET: required('GEBARBILLING_WEBHOOK_SECRET'),
  GEBAR_BASE_PLAN_ID: required('GEBARBILLING_BASE_PLAN_ID'),
  GEBAR_PLUS_PLAN_ID: required('GEBARBILLING_PLUS_PLAN_ID'),
  
  GEBAR_BASE_PRICE_MONTHLY: optional('GEBARBILLING_BASE_PRICE_MONTHLY', '800'),
  GEBAR_PLUS_PRICE_MONTHLY: optional('GEBARBILLING_PLUS_PRICE_MONTHLY', '1200'),
  GEBAR_CURRENCY: optional('GEBARBILLING_CURRENCY', 'usd'),

  NEXT_PUBLIC_APP_URL: optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN: optional(
    'NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN',
    'https://checkout.gebar.et'
  ),
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
  
  if (issues.length > 0) {
    throw new Error(
      `Missing required Gebar configuration: ${issues.join(', ')}`
    );
  }
  
  console.log('Gebar configuration validated');
}
