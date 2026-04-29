import Link from 'next/link';
import { ArrowRight, CreditCard, Database, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionContainer } from '@/components/layout/section-container';
import { Terminal } from './terminal';

const features = [
  {
    icon: Database,
    title: 'Postgres and Drizzle',
    description: 'A practical data layer for users, organizations, subscriptions, plans, and activity logs.',
  },
  {
    icon: CreditCard,
    title: 'Gebar ready',
    description: 'Hosted checkout, portal sessions, and verified webhooks are wired for real billing tests.',
  },
  {
    icon: Users,
    title: 'Organization workflow',
    description: 'Team membership, workspace settings, and role-aware controls are built into the dashboard.',
  },
];

export default function HomePage() {
  return (
    <main>
      <SectionContainer className="bg-gray-50">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Launch and test a SaaS workflow with Gebar
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
              A complete Next.js starter with auth, teams, dashboard settings,
              billing, and production-shaped pages ready for QA.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-orange-500 hover:bg-orange-600">
                <Link href="/sign-up">
                  Create account
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/pricing">View plans</Link>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-6">
            <Terminal />
          </div>
        </div>
      </SectionContainer>

      <SectionContainer className="bg-white">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-orange-500 text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>

      <SectionContainer className="bg-gray-50">
        <div className="grid gap-8 rounded-lg border border-gray-200 bg-white p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-600">
              <ShieldCheck className="h-4 w-4" />
              QA-ready starter
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Test the full business journey without chasing dead links.
            </h2>
            <p className="mt-3 max-w-3xl text-gray-600">
              Public pages, auth, dashboard settings, billing, team management,
              and responsive navigation all point to real routes and clear states.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/features">
              Explore features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SectionContainer>
    </main>
  );
}
