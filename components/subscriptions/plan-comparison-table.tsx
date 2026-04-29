import { Check, Minus } from 'lucide-react';
import { formatLimit, type SubscriptionPlan } from '@/lib/subscriptions';

export function PlanComparisonTable({ plans }: { plans: SubscriptionPlan[] }) {
  const rows = [
    {
      label: 'Workspaces',
      values: plans.map((plan) => formatLimit(plan.limits.workspaces)),
    },
    {
      label: 'Team members',
      values: plans.map((plan) => formatLimit(plan.limits.teamMembers)),
    },
    {
      label: 'Analytics',
      values: plans.map((plan) => plan.limits.analytics),
    },
    {
      label: 'Support',
      values: plans.map((plan) => plan.limits.support),
    },
    {
      label: 'Advanced settings',
      values: plans.map((plan) => plan.unlockedFeatures.includes('advanced_settings')),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-2xl font-semibold text-gray-900">Feature comparison</h2>
      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Feature</th>
              {plans.map((plan) => (
                <th key={plan.key} className="px-4 py-3 font-medium text-gray-900">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-3 font-medium text-gray-700">{row.label}</td>
                {row.values.map((value, index) => (
                  <td key={`${row.label}-${plans[index].key}`} className="px-4 py-3 capitalize text-gray-600">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <Check className="h-5 w-5 text-orange-500" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-400" />
                      )
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
