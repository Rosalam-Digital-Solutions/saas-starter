import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ProfileForm } from '@/components/dashboard/profile-form';

export default function ProfilePage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <DashboardHeader
        title="Profile"
        description="Manage the personal information visible in your workspace."
      />
      <ProfileForm />
    </section>
  );
}
