import { DashboardOverviewClient } from '@/components/dashboard/dashboard-overview-client';

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ billing?: string }>;
}) {
  const params = await searchParams;

  return (
    <DashboardOverviewClient shouldSyncBilling={params?.billing === 'updated'} />
  );
}
