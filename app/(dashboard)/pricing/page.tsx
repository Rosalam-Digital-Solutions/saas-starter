import { PublicPricingPage } from '@/components/subscriptions/public-pricing-page';
import { getSubscriptionPlans } from '@/lib/subscriptions';

export const revalidate = 3600;

export default function PricingPage() {
  return <PublicPricingPage plans={getSubscriptionPlans()} />;
}
