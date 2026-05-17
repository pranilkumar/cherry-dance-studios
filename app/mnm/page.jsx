import { redirect } from 'next/navigation';

/**
 * /mnm is paused. The Mom & Me workshop has ended; the registration form
 * is preserved at src/components/MnMRegistration.jsx for future use, but
 * this route now redirects to /workshops so old links don't 404.
 */
export default function Page() {
  redirect('/workshops');
}
