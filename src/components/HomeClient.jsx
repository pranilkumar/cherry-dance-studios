'use client';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import NavigationBar from './NavigationBar';
import Home from './Home';
import About from './About';
import Classes from './Classes';
import Gallery from './Gallery';
import Instructors from './Instructors';
import FAQ from './FAQ';
import Contact from './Contact';
import Register from './Register';
import Footer from './Footer';
import RegistrationBanner from './RegistrationBanner';

export default function HomeClient() {
  const [showModalBanner, setShowModalBanner] = useState(false);

  // Scroll to a #section anchor when arriving from another page (e.g. /#contact)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    // Wait one frame so target sections are mounted
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1d1d1f',
            padding: '14px 18px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            fontSize: '0.9rem',
          },
          success: { iconTheme: { primary: '#0071e3', secondary: '#fff' } },
        }}
      />
      <NavigationBar />
      <main>
        <Home />
        <About />
        <Classes />
        <Gallery />
        <Instructors />
        <FAQ />
        <Contact />
        <Register />
      </main>
      <Footer />
      <RegistrationBanner show={showModalBanner} onHide={() => setShowModalBanner(false)} />
    </>
  );
}
