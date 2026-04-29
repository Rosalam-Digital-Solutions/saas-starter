import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/marketing/contact-form';
import { PageHeader } from '@/components/layout/page-header';
import { SectionContainer } from '@/components/layout/section-container';

export default function ContactPage() {
  return (
    <main>
      <SectionContainer>
        <PageHeader
          title="Contact"
          description="Send a QA-ready message and verify validation, loading, success, and error states without external email delivery."
        />
        <Card className="mx-auto mt-10 max-w-2xl">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </SectionContainer>
    </main>
  );
}
