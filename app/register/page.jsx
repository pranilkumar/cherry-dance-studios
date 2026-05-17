import NavigationBar from '../../src/components/NavigationBar';
import Register from '../../src/components/Register';
import Footer from '../../src/components/Footer';

export const metadata = {
  title: 'Register | Cherry Dance Studios',
  description: 'Register your child for Bollywood dance classes at Cherry Dance Studios, Ottawa.',
};

export default function RegisterPage() {
  return (
    <>
      <NavigationBar />
      <Register />
      <Footer />
    </>
  );
}
