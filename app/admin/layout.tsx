import { cookies } from 'next/headers';
import AdminLayoutWrapper from '../../src/components/admin/AdminLayoutWrapper';
import { verifyAdminToken, ADMIN_COOKIE } from '../../src/lib/adminAuth';

/**
 * Admin layout — Server Component.
 *
 * Middleware (middleware.ts) already verified the token before this renders,
 * so we can trust the session is valid. We decode it here purely to extract
 * the email for the sidebar display, passing it as a prop to the client shell
 * so the shell renders immediately without any client-side fetch round-trip.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  let email = '';
  try {
    const tokenData = verifyAdminToken(token);
    email = tokenData?.email ?? '';
  } catch {
    // ADMIN_JWT_SECRET not configured — email will be empty but the page still renders.
  }

  return (
    <AdminLayoutWrapper email={email}>
      {children}
    </AdminLayoutWrapper>
  );
}
