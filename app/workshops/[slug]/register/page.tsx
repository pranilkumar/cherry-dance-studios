import Link from 'next/link';
import { notFound } from 'next/navigation';
import NavigationBar from '../../../../src/components/NavigationBar';
import Footer from '../../../../src/components/Footer';
import WorkshopRegisterForm from '../../../../src/components/workshops/WorkshopRegisterForm';
import { getWorkshopBySlug } from '../../../../src/lib/workshops';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);
  return {
    title: workshop
      ? `Register · ${workshop.title} | Cherry Dance Studios`
      : 'Register | Cherry Dance Studios',
  };
}

export default async function WorkshopRegisterPage({ params }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);

  if (!workshop) notFound();

  // If the workshop is past or sold out, block the registration form and send
  // the user back to the detail page (which has the proper messaging).
  const isFull = workshop.capacity > 0 && workshop.registered_count >= workshop.capacity;
  const isClosed =
    workshop.status === 'completed' || workshop.status === 'cancelled' ||
    workshop.status === 'sold_out' || isFull;

  if (isClosed) {
    return (
      <>
        <NavigationBar />
        <main className="min-h-screen bg-[#0a0a0f] pt-32 text-white">
          <div className="mx-auto max-w-xl px-6 py-24 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
              Registration closed
            </h1>
            <p className="mt-4 text-white/65">
              This workshop is{' '}
              {workshop.status === 'completed'
                ? 'already over'
                : workshop.status === 'cancelled'
                ? 'cancelled'
                : 'sold out'}
              . Browse our upcoming workshops or get in touch about the next one.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/workshops"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 hover:border-white/30"
              >
                All workshops
              </Link>
              <Link
                href={`/workshops/${slug}`}
                className="rounded-full bg-[#d1060f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ee2435]"
              >
                Back to workshop
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavigationBar />
      <WorkshopRegisterForm workshop={workshop} />
      <Footer />
    </>
  );
}
