import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </section>
  );
}
