import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';

export default function AboutPage() {
  return (
    <main>
      <SectionContainer>
        <PageHeader
          title="About Gebar Starter"
          description="A focused SaaS foundation for teams that need auth, organizations, billing, and settings flows ready for realistic QA."
        />
        <div className="mx-auto mt-10 max-w-3xl space-y-5 text-base leading-7 text-gray-600">
          <p>
            This starter is built around a practical application journey: visitors
            can review features and pricing, users can create accounts, and teams
            can manage workspace, billing, and member settings after signing in.
          </p>
          <p>
            Gebar powers the subscription flow through server-side checkout,
            browser redirects, customer portal sessions, and verified webhook state
            updates.
          </p>
        </div>
      </SectionContainer>
    </main>
  );
}
