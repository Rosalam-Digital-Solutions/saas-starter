import GebarBilling from '@gebarbilling/server';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const checkoutDomain = requiredEnv('NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN')
  .split(',')[0]
  .trim()
  .replace(/\/+$/, '');

export const gebar = new GebarBilling(requiredEnv('GEBARBILLING_SECRET_KEY'), {
  baseUrl: requiredEnv('GEBARBILLING_BASE_URL'),
  environment: requiredEnv('GEBARBILLING_ENV') as
    | 'development'
    | 'staging'
    | 'production'
    | 'test',
  checkoutDomain,
});

export default gebar;
