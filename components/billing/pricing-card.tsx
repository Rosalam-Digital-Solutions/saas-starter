import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanCta } from '@/components/subscriptions/plan-cta';

export function PricingCard({
  name,
  description,
  price,
  interval,
  trialDays,
  features,
  planKey,
}: {
  name: string;
  description: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  planKey: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-4xl font-semibold text-gray-900">
          ${price / 100}
          <span className="text-base font-normal text-gray-500"> / {interval}</span>
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Includes a {trialDays} day free trial.
        </p>
        <ul className="my-8 flex-1 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <PlanCta planKey={planKey} />
      </CardContent>
    </Card>
  );
}
