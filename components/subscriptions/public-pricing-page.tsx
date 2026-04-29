import Link from 'next/link';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';
import { Button } from '@/components/ui/button';
import { PlanCta } from '@/components/subscriptions/plan-cta';
import { PlanComparisonTable } from '@/components/subscriptions/plan-comparison-table';
import type { SubscriptionPlan } from '@/lib/subscriptions';

export function PublicPricingPage({ plans }: { plans: SubscriptionPlan[] }) {
  return (
    <main>
      <SectionContainer>
        <PageHeader
          title="Pricing"
          description="Compare plans, review limits, and choose the right Gebar starter subscription."
        />
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.key} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-sm text-gray-600">{plan.bestFor}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-4xl font-semibold text-gray-900">
                  ${plan.unitAmount / 100}
                  <span className="text-base font-normal text-gray-500"> / {plan.interval}</span>
                </p>
                <ul className="my-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-gray-700">
                      <Check className="h-5 w-5 shrink-0 text-orange-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="space-y-3">
                  <PlanCta planKey={plan.key} />
                  <Button asChild variant="ghost" className="w-full">
                    <Link href={`/plans/${plan.slug}`}>View plan details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="bg-white">
        <PlanComparisonTable plans={plans} />
      </SectionContainer>

      <SectionContainer>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-900">Pricing FAQ</h2>
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-medium text-gray-900">Can visitors manage subscriptions here?</h3>
              <p className="mt-1 text-sm text-gray-600">
                No. This page is for marketing and plan education. Subscription management is in dashboard billing.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Does checkout use real Gebar?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Yes. Authenticated checkout is created server-side and redirects to hosted Gebar checkout.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Which plan should I test first?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Start with Base for core flows, then use hosted billing to move to Plus and verify locked and unlocked states.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </main>
  );
}
