import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';
import { PlanCta } from '@/components/subscriptions/plan-cta';
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
                <PlanCta planKey={plan.key} />
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </main>
  );
}
