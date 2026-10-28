import type { Metadata } from 'next';
import MeasurementForm from '../../../../src/components/measurements/MeasurementForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `${title} — Costume Measurements | Cherry Dance Studios`,
    description: 'Submit your child\'s costume measurements for Cherry Dance Studios.',
    robots: { index: false },
  };
}

export default async function MeasurementsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 py-10 text-white">
      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
      {/* Red glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-0 h-[50vh] w-[60vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle,rgba(209,6,15,0.22) 0%,transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="mb-2 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d1060f]">
            Cherry Dance Studios
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
            Costume Measurements
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Fill in all measurements in <strong className="font-medium text-white/70">inches</strong>.
          </p>
          <div className="mt-5 flex items-center gap-3 text-[#B8872A]/60">
            <span className="h-px flex-1 bg-[#B8872A]/25" />
            <span className="text-[7px]">◆</span>
            <span className="h-px flex-1 bg-[#B8872A]/25" />
          </div>
        </div>

        <MeasurementForm eventSlug={slug} />
      </div>
    </main>
  );
}
