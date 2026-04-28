import { Team } from '@/lib/db/schema';

export function hasBillingAccess(
  team: Team | null | undefined,
  subscriptionStatus?: string | null
): boolean {
  if (!team) return false;
  const status = subscriptionStatus ?? '';
  return ['active', 'trialing', 'pending'].includes(status);
}

export function requireBillingAccess(
  team: Team | null | undefined,
  subscriptionStatus?: string | null
): void {
  if (!hasBillingAccess(team, subscriptionStatus)) {
    throw new Error('Billing access required. Please choose a plan.');
  }
}

export function getBillingStatusMessage(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'Active subscription';
    case 'trialing':
      return 'Trial period';
    case 'pending':
      return 'Processing...';
    case 'canceled':
    case 'cancelled':
      return 'Subscription canceled';
    case 'past_due':
      return 'Payment past due';
    default:
      return 'No active subscription';
  }
}
