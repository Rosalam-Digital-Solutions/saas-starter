import { Activity, Bell, CreditCard, Lock, Settings, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';

const features = [
  ['Dashboard overview', 'Review workspace status, billing state, and team readiness.', Activity],
  ['Profile and account settings', 'Update profile details and validate account security flows.', Settings],
  ['Real Gebar billing', 'Create hosted checkout and portal sessions through server-side routes.', CreditCard],
  ['Team management', 'Invite members, review roles, and test empty and loading states.', Users],
  ['Notification preferences', 'Persist QA-ready communication preferences locally.', Bell],
  ['Protected routes', 'Keep dashboard screens behind the existing auth middleware.', Lock],
] as const;

export default function FeaturesPage() {
  return (
    <main>
      <SectionContainer>
        <PageHeader
          title="Features"
          description="Everything needed to test a business SaaS starter from public discovery to authenticated billing workflows."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description, Icon]) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="mb-3 h-6 w-6 text-orange-500" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-gray-600">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </main>
  );
}
