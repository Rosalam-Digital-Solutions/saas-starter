import { BillingPageClient } from './billing-page-client';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const params = await searchParams;

  return <BillingPageClient updated={params.updated === 'true'} />;
}
