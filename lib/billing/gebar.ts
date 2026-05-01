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
  logger: {
    info: (message: string, ...args: unknown[]) => console.log(`[Gebar] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[Gebar] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[Gebar] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => console.debug(`[Gebar] ${message}`, ...args),
  },
});

export default gebar;
