import NavigationBar from '../../src/components/NavigationBar';
import Footer from '../../src/components/Footer';
import WorkshopsList from '../../src/components/workshops/WorkshopsList';
import { getPublicWorkshops, partitionByTime } from '../../src/lib/workshops';

export const metadata = {
  title: 'Workshops | Cherry Dance Studios',
  description:
    'Upcoming Bollywood, hip-hop, freestyle, and Indian dance workshops at Cherry Dance Studios, Ottawa.',
};

// Always render with fresh data — workshop capacity / status changes often.
export const dynamic = 'force-dynamic';

export default async function WorkshopsPage() {
  const workshops = await getPublicWorkshops();
  const { upcoming, past } = partitionByTime(workshops);

  return (
    <>
      <NavigationBar />
      <WorkshopsList upcoming={upcoming} past={past} />
      <Footer />
    </>
  );
}
