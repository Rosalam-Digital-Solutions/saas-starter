import { redirect } from 'next/navigation';

export default function GeneralRedirectPage() {
  redirect('/dashboard/profile');
}
