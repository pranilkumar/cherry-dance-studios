import NavigationBar from '../../src/components/NavigationBar';
import FullGallery from '../../src/components/FullGallery';
import Footer from '../../src/components/Footer';

export const metadata = {
  title: 'Gallery | Cherry Dance Studios',
  description: 'Photos and videos from Cherry Dance Studios performances and events.',
};

export default function GalleryPage() {
  return (
    <>
      <NavigationBar />
      <FullGallery />
      <Footer />
    </>
  );
}
