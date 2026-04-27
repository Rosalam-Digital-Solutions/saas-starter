import { Team } from '@/lib/db/schema';

export function hasBillingAccess(team: Team | null | undefined): boolean {
  if (!team) return false;
  return ['active', 'trialing', 'pending'].includes(team.billingStatus ?? '');
}

export function requireBillingAccess(team: Team | null | undefined): void {
  if (!hasBillingAccess(team)) {
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