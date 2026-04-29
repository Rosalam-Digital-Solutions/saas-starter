import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SettingsForm } from '@/components/dashboard/settings-form';

export default function SettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <DashboardHeader
        title="Settings"
        description="Manage workspace-level information and admin-only configuration."
      />
      <SettingsForm />
    </section>
  );
}
