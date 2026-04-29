import { notFound, redirect } from 'next/navigation';
import { PlanDetailPage } from '@/components/subscriptions/plan-detail-page';
import { getSubscriptionPlanBySlug, getSubscriptionPlans } from '@/lib/subscriptions';

const aliases: Record<string, string> = {
  starter: 'base',
  pro: 'plus',
};

export default async function PlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (aliases[slug]) {
    redirect(`/plans/${aliases[slug]}`);
  }

  const plan = getSubscriptionPlanBySlug(slug);
  if (!plan) notFound();

  const otherPlan = getSubscriptionPlans().find((candidate) => candidate.key !== plan.key);
  if (!otherPlan) notFound();

  return <PlanDetailPage plan={plan} otherPlan={otherPlan} />;
}
