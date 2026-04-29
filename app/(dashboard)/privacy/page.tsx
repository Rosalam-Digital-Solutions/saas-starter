import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';

export default function PrivacyPage() {
  return (
    <main>
      <SectionContainer>
        <PageHeader
          title="Privacy Policy"
          description="A concise policy page for testing legal navigation and footer links."
        />
        <div className="mx-auto mt-10 max-w-3xl space-y-5 text-sm leading-7 text-gray-600">
          <p>
            This starter stores account, organization, membership, activity, and
            subscription data required to operate the application. Billing events
            are processed through Gebar.
          </p>
          <p>
            Do not place production secrets in client-side variables. Public
            browser variables are limited to safe app and hosted billing URLs.
          </p>
          <p>
            Connect your own privacy policy, data retention rules, and support
            contact before launching a production product.
          </p>
        </div>
      </SectionContainer>
    </main>
  );
}
