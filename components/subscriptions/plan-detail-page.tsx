import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';
import { PlanCta } from '@/components/subscriptions/plan-cta';
import { formatLimit, type SubscriptionPlan } from '@/lib/subscriptions';

export function PlanDetailPage({
  plan,
  otherPlan,
}: {
  plan: SubscriptionPlan;
  otherPlan: SubscriptionPlan;
}) {
  return (
    <main>
      <SectionContainer>
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/pricing">
            <ArrowLeft className="h-4 w-4" />
            Back to pricing
          </Link>
        </Button>
        <PageHeader title={`${plan.name} plan`} description={plan.description} />
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>What this plan includes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-4xl font-semibold text-gray-900">
                ${plan.unitAmount / 100}
                <span className="text-base font-normal text-gray-500"> / {plan.interval}</span>
              </p>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-gray-700">
                    <Check className="h-5 w-5 shrink-0 text-orange-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p>Workspaces: {formatLimit(plan.limits.workspaces)}</p>
              <p>Team members: {formatLimit(plan.limits.teamMembers)}</p>
              <p className="capitalize">Analytics: {plan.limits.analytics}</p>
              <p className="capitalize">Support: {plan.limits.support}</p>
              <PlanCta
                planKey={plan.key}
                authenticatedLabel="Manage in Gebar"
                activeBehavior="portal"
              />
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      <SectionContainer className="bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Unlocks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.unlockedFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-gray-700">
                    <Check className="h-5 w-5 shrink-0 text-orange-500" />
                    {feature.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Not included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.notIncluded.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-gray-700">
                    <X className="h-5 w-5 shrink-0 text-gray-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      <SectionContainer>
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Compared with {otherPlan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              {plan.name} supports {formatLimit(plan.limits.teamMembers)} team members;
              {` ${otherPlan.name}`} supports {formatLimit(otherPlan.limits.teamMembers)}.
            </p>
            <p className="capitalize">
              {plan.name} analytics are {plan.limits.analytics}; {otherPlan.name}
              analytics are {otherPlan.limits.analytics}.
            </p>
            <Button asChild variant="outline">
              <Link href={`/plans/${otherPlan.slug}`}>View {otherPlan.name}</Link>
            </Button>
          </CardContent>
        </Card>
      </SectionContainer>
    </main>
  );
}
