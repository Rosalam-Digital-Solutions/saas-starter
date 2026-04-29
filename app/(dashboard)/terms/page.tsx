import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';

export default function TermsPage() {
  return (
    <main>
      <SectionContainer>
        <PageHeader
          title="Terms"
          description="Baseline terms content for route coverage and QA navigation."
        />
        <div className="mx-auto mt-10 max-w-3xl space-y-5 text-sm leading-7 text-gray-600">
          <p>
            This application starter is provided as a foundation for testing and
            product development. Replace this page with your legal terms before
            accepting production customers.
          </p>
          <p>
            Subscription access is determined by server-side billing records and
            verified Gebar webhooks. Checkout callbacks are not treated as
            final proof of payment.
          </p>
          <p>
            Users are responsible for keeping account credentials secure and for
            configuring production email, billing, and support operations.
          </p>
        </div>
      </SectionContainer>
    </main>
  );
}
