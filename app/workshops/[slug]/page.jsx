import { notFound } from 'next/navigation';
import NavigationBar from '../../../src/components/NavigationBar';
import Footer from '../../../src/components/Footer';
import WorkshopDetail from '../../../src/components/workshops/WorkshopDetail';
import { getWorkshopBySlug } from '../../../src/lib/workshops';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);
  if (!workshop) {
    return { title: 'Workshop not found | Cherry Dance Studios' };
  }
  return {
    title: `${workshop.title} | Cherry Dance Studios`,
    description: workshop.subtitle || workshop.description?.slice(0, 160),
  };
}

export default async function WorkshopDetailPage({ params }) {
  const { slug } = await params;
  const workshop = await getWorkshopBySlug(slug);

  if (!workshop) {
    notFound();
  }

  return (
    <>
      <NavigationBar />
      <WorkshopDetail workshop={workshop} />
      <Footer />
    </>
  );
}
