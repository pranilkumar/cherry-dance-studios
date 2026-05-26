import { notFound } from 'next/navigation';
import NavigationBar from '../../../../../src/components/NavigationBar';
import Footer from '../../../../../src/components/Footer';
import WorkshopTicket from '../../../../../src/components/workshops/WorkshopTicket';
import { getBookingByToken } from '../../../../../src/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your ticket | Cherry Dance Studios',
  robots: { index: false, follow: false }, // tickets should not be indexed
};

export default async function TicketPage({ params }) {
  const { slug, token } = await params;
  const booking = await getBookingByToken(token);

  // 404 if no booking, or if the slug in the URL doesn't match the booking's workshop
  if (!booking || booking.workshop?.slug !== slug) {
    notFound();
  }

  return (
    <>
      <NavigationBar />
      <WorkshopTicket booking={booking} />
      <Footer />
    </>
  );
}
